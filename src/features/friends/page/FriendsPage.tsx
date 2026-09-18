import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SowahAvatar from "@/src/assets/images/sowah-avar.svg";
import { getCountryFlag } from "@/src/shared/utils/country-flag";
import { colors } from "@/src/theme/colors";
import { useFriends } from "../hooks/useFriends";
import type { Friend, FriendRequest } from "../types/friends.types";

function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: { detail?: string; message?: string };
          status?: number;
        };
      }
    ).response;
    return (
      response?.data?.detail ??
      response?.data?.message ??
      `請求失敗 (${response?.status})`
    );
  }
  return error instanceof Error ? error.message : "請求失敗，請稍後再試";
}

export default function FriendsPage() {
  const router = useRouter();
  const friendsState = useFriends();
  const [userUid, setUserUid] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const run = async (key: string, action: () => Promise<void>) => {
    if (busyKey) return;
    setBusyKey(key);
    try {
      await action();
    } catch (error) {
      Alert.alert("操作失敗", errorMessage(error));
    } finally {
      setBusyKey(null);
    }
  };

  const handleSend = () => {
    const target = userUid.trim();
    if (!target) {
      Alert.alert("請輸入使用者 UID");
      return;
    }
    void run(`send:${target}`, async () => {
      await friendsState.sendRequest(target);
      setUserUid("");
      Alert.alert("已送出好友邀請");
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Friends</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical
          refreshControl={
            <RefreshControl
              refreshing={friendsState.isRefreshing}
              onRefresh={friendsState.refresh}
              tintColor={colors.brand}
            />
          }
        >
          <Text style={styles.sectionTitle}>新增好友</Text>
          <View style={styles.addRow}>
            <TextInput
              value={userUid}
              onChangeText={setUserUid}
              placeholder="輸入對方的 user_uid"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <ActionButton
              label="送出"
              loading={busyKey === `send:${userUid.trim()}`}
              onPress={handleSend}
            />
          </View>

          {friendsState.isLoading ? (
            <ActivityIndicator style={styles.loader} color={colors.brand} />
          ) : friendsState.error ? (
            <View style={styles.messageBox}>
              <Text style={styles.errorText}>
                {errorMessage(friendsState.error)}
              </Text>
              <ActionButton
                label="重試"
                onPress={() => void friendsState.refresh()}
              />
            </View>
          ) : (
            <>
              <Section title={`收到的邀請 (${friendsState.incoming.length})`}>
                {friendsState.incoming.map((request) => (
                  <PersonRow key={request.user_uid} item={request}>
                    <ActionButton
                      label="接受"
                      loading={busyKey === `accept:${request.user_uid}`}
                      onPress={() =>
                        void run(`accept:${request.user_uid}`, () =>
                          friendsState.accept(request.user_uid),
                        )
                      }
                    />
                    <ActionButton
                      label="拒絕"
                      secondary
                      loading={busyKey === `decline:${request.user_uid}`}
                      onPress={() =>
                        void run(`decline:${request.user_uid}`, () =>
                          friendsState.decline(request.user_uid),
                        )
                      }
                    />
                  </PersonRow>
                ))}
              </Section>

              <Section title={`已送出的邀請 (${friendsState.outgoing.length})`}>
                {friendsState.outgoing.map((request) => (
                  <PersonRow key={request.user_uid} item={request}>
                    <ActionButton
                      label="取消"
                      secondary
                      loading={busyKey === `cancel:${request.user_uid}`}
                      onPress={() =>
                        void run(`cancel:${request.user_uid}`, () =>
                          friendsState.cancel(request.user_uid),
                        )
                      }
                    />
                  </PersonRow>
                ))}
              </Section>

              <Section title={`好友 (${friendsState.friends.length})`}>
                {friendsState.friends.map((friend) => (
                  <PersonRow key={friend.user_uid} item={friend}>
                    <ActionButton
                      label="刪除"
                      secondary
                      loading={busyKey === `unfriend:${friend.user_uid}`}
                      onPress={() =>
                        Alert.alert(
                          "刪除好友",
                          `確定要刪除 ${friend.profile.user_id}？`,
                          [
                            { text: "取消", style: "cancel" },
                            {
                              text: "刪除",
                              style: "destructive",
                              onPress: () =>
                                void run(`unfriend:${friend.user_uid}`, () =>
                                  friendsState.unfriend(friend.user_uid),
                                ),
                            },
                          ],
                        )
                      }
                    />
                  </PersonRow>
                ))}
              </Section>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hasItems ? children : <Text style={styles.emptyText}>目前沒有資料</Text>}
    </View>
  );
}

function PersonRow({
  item,
  children,
}: {
  item: Friend | FriendRequest;
  children: React.ReactNode;
}) {
  const avatarUri = item.profile.avatar?.download_url;
  return (
    <View style={styles.personRow}>
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <SowahAvatar width={42} height={42} />
        </View>
      )}
      <View style={styles.personInfo}>
        <Text style={styles.personName} numberOfLines={1}>
          {item.profile.user_id} {getCountryFlag(item.profile.country)}
        </Text>
        <Text style={styles.uid} numberOfLines={1}>
          {item.user_uid}
        </Text>
      </View>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  loading = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.actionButtonSecondary,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={secondary ? "#555" : "#FFF"} />
      ) : (
        <Text
          style={[styles.actionLabel, secondary && styles.actionLabelSecondary]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  flex: { flex: 1 },
  header: {
    height: 52,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 36, lineHeight: 38, color: "#222" },
  title: { fontSize: 20, fontWeight: "800", color: "#111" },
  content: { paddingHorizontal: 24, paddingBottom: 60 },
  section: { marginTop: 28 },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
  },
  addRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 42,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#CFCFCF",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#222",
  },
  loader: { marginTop: 48 },
  messageBox: { marginTop: 36, alignItems: "center", gap: 12 },
  errorText: { color: "#B42318", textAlign: "center" },
  emptyText: { paddingVertical: 14, color: "#999" },
  personRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8E8",
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#EEE" },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  personInfo: { flex: 1, minWidth: 0 },
  personName: { fontSize: 15, fontWeight: "700", color: "#222" },
  uid: { marginTop: 3, fontSize: 10, color: "#999" },
  actions: { flexDirection: "row", gap: 6 },
  actionButton: {
    minWidth: 58,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandStrong,
  },
  actionButtonSecondary: { backgroundColor: "#EFEFEF" },
  actionLabel: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  actionLabelSecondary: { color: "#555" },
  pressed: { opacity: 0.7 },
});
