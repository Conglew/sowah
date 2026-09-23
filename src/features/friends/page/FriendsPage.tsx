import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SowahAvatar from "@/src/assets/images/sowah-avar.svg";
import { AppLogoHeader } from "@/src/components/layout/AppHeader";
import { hasPaidMembership } from "@/src/features/membership/membership-access";
import type { UserProfile } from "@/src/features/profile/types";
import { getCountryFlag } from "@/src/shared/utils/country-flag";
import { useAuthStore } from "@/src/stores/auth.store";
import { colors } from "@/src/theme/colors";
import { useFriends } from "../hooks/useFriends";
import { MIN_QUERY_LENGTH, useUserSearch } from "../hooks/useUserSearch";
import type { UserRelationship } from "../utils/relationship";
import { buildRelationshipLookup } from "../utils/relationship";

/**
 * 非 "none" 的關係都不能再送邀請。
 * 同一份對照表同時決定按鈕能不能按、以及按下去要說什麼，兩者不會再走鐘。
 */
const RELATIONSHIP_MESSAGE: Record<UserRelationship, string | null> = {
  self: "這是你自己的帳號。",
  friend: "已添加過好友。",
  "request-sent": "已發送過好友邀請。",
  "request-received": "對方已邀請你，請到 Private 聊天室接受或拒絕。",
  none: null,
};

function getStatus(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;
}

export default function FriendsPage() {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const friendsState = useFriends();
  const [query, setQuery] = useState("");
  const [invitingUid, setInvitingUid] = useState<string | null>(null);

  const {
    results,
    appliedQuery,
    isSearching,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
  } = useUserSearch(query);

  const { friends, incoming, outgoing } = friendsState;
  const relationshipOf = useMemo(
    () =>
      buildRelationshipLookup({
        currentUserUid: authUser?.user_uid,
        friends,
        incoming,
        outgoing,
      }),
    [authUser?.user_uid, friends, incoming, outgoing],
  );

  const invite = async (profile: UserProfile) => {
    if (invitingUid) return;
    if (!hasPaidMembership(authUser)) {
      Alert.alert("付費會員限定", "升級為付費會員後，才可以發送好友邀請。");
      return;
    }

    const blockedMessage =
      RELATIONSHIP_MESSAGE[relationshipOf(profile.user_uid)];
    if (blockedMessage) {
      Alert.alert("無法邀請", blockedMessage);
      return;
    }

    setInvitingUid(profile.user_uid);
    try {
      await friendsState.sendRequest(profile.user_uid);
      Alert.alert("已發送好友邀請", `已邀請 ${profile.user_id}`);
    } catch (requestError) {
      Alert.alert(
        "無法發送邀請",
        getStatus(requestError) === 409
          ? "已發送過好友邀請或已添加過好友。"
          : "請稍後再試一次。",
      );
    } finally {
      setInvitingUid(null);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: UserProfile }) => {
      const relationship = relationshipOf(item.user_uid);
      const isSelf = relationship === "self";
      const isBlocked = relationship !== "none";

      return (
        <View style={styles.userRow}>
          {item.avatar?.download_url ? (
            <Image
              source={{ uri: item.avatar.download_url }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <SowahAvatar width={42} height={42} />
            </View>
          )}
          <Text style={styles.username} numberOfLines={1}>
            {item.user_id} {getCountryFlag(item.country)}
            {isSelf ? "（你）" : ""}
          </Text>
          {isSelf ? null : (
            <TouchableOpacity
              style={styles.addButton}
              disabled={isBlocked || invitingUid !== null}
              onPress={() => void invite(item)}
              accessibilityLabel={`邀請 ${item.user_id} 成為好友`}
            >
              {invitingUid === item.user_uid ? (
                <ActivityIndicator size="small" color="#111111" />
              ) : (
                <Text
                  style={[styles.addIcon, isBlocked && styles.addIconDisabled]}
                >
                  {isBlocked ? "✓" : "+"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      );
    },
    // invite 依賴 invitingUid / authUser / friendsState，這裡以 invitingUid 為主要變動來源
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invitingUid, relationshipOf],
  );

  const trimmedQuery = query.trim();

  /**
   * 空狀態的優先序：限流 > 一般錯誤 > 字數不足 > 真的查無此人。
   * 「查無此人」只在 appliedQuery 有值（= 真的送出去查過並回來了）時才顯示，
   * 否則使用者還在打字的那 450ms 就會看到一句假話。
   */
  const renderEmpty = () => {
    if (isSearching) {
      return <ActivityIndicator style={styles.loading} color={colors.brand} />;
    }
    if (error === "rate-limited") {
      return (
        <Text style={styles.emptyText}>
          搜尋太頻繁，請稍候幾秒再試。{"\n"}（這不代表查無此人）
        </Text>
      );
    }
    if (error === "failed") {
      return <Text style={styles.emptyText}>搜尋失敗，請稍後再試。</Text>;
    }
    if (trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH) {
      return (
        <Text style={styles.emptyText}>
          請至少輸入 {MIN_QUERY_LENGTH} 個字再搜尋。
        </Text>
      );
    }
    if (appliedQuery) {
      return <Text style={styles.emptyText}>找不到符合的使用者</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AppLogoHeader />
        <View style={styles.toolbar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋公開 user_id"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.separator} />

        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.results}
          data={results}
          keyExtractor={(item) => item.user_uid}
          renderItem={renderItem}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={renderEmpty()}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator style={styles.footer} color={colors.brand} />
            ) : hasMore ? (
              <View style={styles.footer} />
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  toolbar: { height: 38, paddingHorizontal: 28, justifyContent: "center" },
  backButton: { width: 40, height: 38, justifyContent: "center" },
  backText: { fontSize: 36, lineHeight: 38, color: "#555555" },
  searchWrap: {
    height: 34,
    marginHorizontal: 38,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BEBEBE",
    borderRadius: 7,
  },
  searchIcon: { marginRight: 5, fontSize: 17, color: "#555555" },
  searchInput: {
    flex: 1,
    height: 32,
    paddingVertical: 0,
    fontSize: 14,
    color: "#111111",
  },
  separator: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E6E6E6",
  },
  results: { paddingHorizontal: 20, paddingBottom: 30, flexGrow: 1 },
  loading: { marginTop: 40 },
  footer: { height: 44, justifyContent: "center" },
  emptyText: {
    marginTop: 40,
    textAlign: "center",
    lineHeight: 20,
    color: "#999999",
  },
  userRow: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8E8",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEEEEE",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  username: { flex: 1, marginLeft: 12, fontSize: 15, color: "#222222" },
  addButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
    textAlign: "center",
    lineHeight: 18,
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    backgroundColor: "#171717",
  },
  addIconDisabled: { backgroundColor: "#AFAFAF" },
});
