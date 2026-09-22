import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SowahAvatar from "@/src/assets/images/sowah-avar.svg";
import { AppLogoHeader } from "@/src/components/layout/AppHeader";
import { usersApi } from "@/src/features/profile/api/users.api";
import { hasPaidMembership } from "@/src/features/membership/membership-access";
import { useAuthStore } from "@/src/stores/auth.store";
import type { UserProfile } from "@/src/features/profile/types";
import { getCountryFlag } from "@/src/shared/utils/country-flag";
import { colors } from "@/src/theme/colors";
import { useFriends } from "../hooks/useFriends";
import type { Friend, FriendRequest } from "../types/friends.types";

const SEARCH_DELAY_MS = 300;

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
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingUid, setInvitingUid] = useState<string | null>(null);

  useEffect(() => {
    const target = query.trim();
    if (!target) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      setIsSearching(true);
      void usersApi
        .search(target, { limit: 30, offset: 0 })
        .then((page) => {
          if (active) setResults(page.users);
        })
        .catch((error: unknown) => {
          console.warn("[friends-search] failed", error);
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const invite = async (profile: UserProfile) => {
    if (invitingUid) return;
    if (!hasPaidMembership(authUser)) {
      Alert.alert("付費會員限定", "升級為付費會員後，才可以發送好友邀請。");
      return;
    }
    const duplicateMessage = getExistingRelationshipMessage(
      profile.user_uid,
      friendsState.friends,
      friendsState.incoming,
      friendsState.outgoing,
    );
    if (duplicateMessage) {
      Alert.alert("無法重複邀請", duplicateMessage);
      return;
    }

    setInvitingUid(profile.user_uid);
    try {
      await friendsState.sendRequest(profile.user_uid);
      Alert.alert("已發送好友邀請", `已邀請 ${profile.user_id}`);
    } catch (error) {
      Alert.alert(
        "無法發送邀請",
        getStatus(error) === 409
          ? "已發送過好友邀請或已添加過好友。"
          : "請稍後再試一次。",
      );
    } finally {
      setInvitingUid(null);
    }
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

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.results}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {isSearching ? (
            <ActivityIndicator style={styles.loading} color={colors.brand} />
          ) : query.trim() && results.length === 0 ? (
            <Text style={styles.emptyText}>找不到符合的使用者</Text>
          ) : (
            results.map((profile) => {
              const relationship = getExistingRelationshipMessage(
                profile.user_uid,
                friendsState.friends,
                friendsState.incoming,
                friendsState.outgoing,
              );
              return (
                <View key={profile.user_uid} style={styles.userRow}>
                  {profile.avatar?.download_url ? (
                    <Image
                      source={{ uri: profile.avatar.download_url }}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <SowahAvatar width={42} height={42} />
                    </View>
                  )}
                  <Text style={styles.username} numberOfLines={1}>
                    {profile.user_id} {getCountryFlag(profile.country)}
                  </Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    disabled={Boolean(relationship) || invitingUid !== null}
                    onPress={() => void invite(profile)}
                    accessibilityLabel={`邀請 ${profile.user_id} 成為好友`}
                  >
                    {invitingUid === profile.user_uid ? (
                      <ActivityIndicator size="small" color="#111111" />
                    ) : (
                      <Text
                        style={[
                          styles.addIcon,
                          relationship && styles.addIconDisabled,
                        ]}
                      >
                        {relationship ? "✓" : "+"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getExistingRelationshipMessage(
  userUid: string,
  friends: Friend[],
  incoming: FriendRequest[],
  outgoing: FriendRequest[],
): string | null {
  if (friends.some((friend) => friend.user_uid === userUid)) {
    return "已添加過好友";
  }
  if (outgoing.some((request) => request.user_uid === userUid)) {
    return "已發送過好友邀請";
  }
  if (incoming.some((request) => request.user_uid === userUid)) {
    return "對方已邀請你，請到 Private 聊天室接受或拒絕。";
  }
  return null;
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
  results: { paddingHorizontal: 20, paddingBottom: 30 },
  loading: { marginTop: 40 },
  emptyText: { marginTop: 40, textAlign: "center", color: "#999999" },
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
