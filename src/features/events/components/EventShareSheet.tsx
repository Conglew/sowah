import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SowahAvatar from "@/src/assets/images/sowah-avar.svg";
import { friendsApi } from "@/src/features/friends/api/friends.api";
import type { Friend } from "@/src/features/friends/types/friends.types";
import { privateApi } from "@/src/features/private/api/private.api";
import { usePrivateStore } from "@/src/features/private/stores/private.store";
import { getCountryFlag } from "@/src/shared/utils/country-flag";

type ShareableEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
};

type EventShareSheetProps = {
  event: ShareableEvent | null;
  onClose: () => void;
};

export default function EventShareSheet({
  event,
  onClose,
}: EventShareSheetProps) {
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendingUid, setSendingUid] = useState<string | null>(null);
  const [sentUids, setSentUids] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!event) return;
    let active = true;
    setQuery("");
    setSentUids(new Set());
    setIsLoading(true);
    void friendsApi
      .list({ sort: "newest", limit: 50, offset: 0 })
      .then((page) => {
        if (active) setFriends(page.friends);
      })
      .catch((error: unknown) => {
        console.warn("[event-share] friends load failed", error);
        if (active) Alert.alert("無法載入好友", "請稍後再試一次。");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [event]);

  const filteredFriends = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return friends;
    return friends.filter((friend) =>
      friend.profile.user_id.toLocaleLowerCase().includes(normalized),
    );
  }, [friends, query]);

  if (!event) return null;

  const deepLink = Linking.createURL(`events/${event.id}`);
  const message = `一起參加「${event.title}」\n${event.date} ${event.startTime}\n${deepLink}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(deepLink);
    Alert.alert("已複製活動連結");
  };

  const shareNative = async () => {
    await Share.share({ message, url: deepLink, title: event.title });
  };

  const shareToFriend = async (friend: Friend) => {
    if (sendingUid || sentUids.has(friend.user_uid)) return;
    setSendingUid(friend.user_uid);
    try {
      const sent = await privateApi.sendMessage(friend.user_uid, message);
      usePrivateStore.getState().appendMessage(friend.user_uid, sent);
      setSentUids((current) => new Set(current).add(friend.user_uid));
    } catch (error) {
      console.warn("[event-share] message send failed", error);
      Alert.alert("分享失敗", "活動連結無法傳送到聊天室，請稍後再試。");
    } finally {
      setSendingUid(null);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>分享活動</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋好友"
            autoCorrect={false}
            style={styles.searchInput}
          />

          <ScrollView
            style={styles.friendList}
            contentContainerStyle={styles.friendListContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : filteredFriends.length === 0 ? (
              <Text style={styles.emptyText}>找不到可分享的好友</Text>
            ) : (
              filteredFriends.map((friend) => {
                const avatarUri = friend.profile.avatar?.download_url;
                const isSending = sendingUid === friend.user_uid;
                const isSent = sentUids.has(friend.user_uid);
                return (
                  <View key={friend.user_uid} style={styles.friendRow}>
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <SowahAvatar width={40} height={40} />
                      </View>
                    )}
                    <Text style={styles.friendName} numberOfLines={1}>
                      {friend.profile.user_id}{" "}
                      {getCountryFlag(friend.profile.country)}
                    </Text>
                    <TouchableOpacity
                      style={styles.sendButton}
                      disabled={isSending || isSent}
                      onPress={() => void shareToFriend(friend)}
                      accessibilityRole="button"
                      accessibilityLabel={`分享給 ${friend.profile.user_id}`}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color="#111111" />
                      ) : (
                        <Text
                          style={[styles.sendIcon, isSent && styles.sentIcon]}
                        >
                          {isSent ? "✓" : "➤"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => void copyLink()}
            >
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionText}>Copy link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => void shareNative()}
            >
              <Text style={styles.actionIcon}>⇧</Text>
              <Text style={styles.actionText}>Share to…</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: "rgba(0,0,0,0.22)",
  },
  sheet: {
    maxHeight: "76%",
    minHeight: 430,
    paddingHorizontal: 24,
    paddingTop: 10,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 24,
  },
  handle: {
    alignSelf: "center",
    width: 64,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#999999",
  },
  title: { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#111111" },
  searchInput: {
    height: 38,
    marginTop: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#CFCFCF",
    borderRadius: 9,
    color: "#111111",
  },
  friendList: { flexShrink: 1, marginTop: 12 },
  friendListContent: { flexGrow: 1 },
  loader: { marginVertical: 40 },
  emptyText: { marginVertical: 40, textAlign: "center", color: "#999999" },
  friendRow: { height: 58, flexDirection: "row", alignItems: "center" },
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
  friendName: { flex: 1, marginLeft: 12, fontSize: 15, color: "#222222" },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    fontSize: 25,
    color: "#111111",
    transform: [{ rotate: "-12deg" }],
  },
  sentIcon: { color: "#2DBE62", transform: [] },
  bottomActions: {
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E3E3E3",
  },
  actionButton: {
    minWidth: 138,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8E8E8",
  },
  actionIcon: { fontSize: 20, color: "#111111" },
  actionText: { fontSize: 14, color: "#222222" },
});
