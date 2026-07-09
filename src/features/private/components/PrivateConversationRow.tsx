import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ChatStarIcon from "@/src/assets/icons/chat_star_icon.svg";
import { getCountryFlag } from "@/src/shared/utils/country-flag";
import { colors } from "@/src/theme/colors";
import type { PrivateConversation } from "../types/private.types";
import {
  formatListDate,
  getLastMessage,
  getPreviewText,
  hasPendingInvitation,
} from "../utils/private.utils";

type Props = {
  conversation: PrivateConversation;
  onPress: () => void;
};

// 邀請提示的紅色驚嘆號，不是品牌色，故不放進 theme/colors
const ALERT_BADGE_COLOR = "#FF8100";

export default function PrivateConversationRow({ conversation, onPress }: Props) {
  const lastMessage = getLastMessage(conversation);
  const isPending = hasPendingInvitation(conversation);
  const previewText = getPreviewText(lastMessage);
  const dateLabel = lastMessage ? formatListDate(lastMessage.createdAt) : "";

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={onPress}>
      <View style={styles.avatarWrap}>
        <Image
          source={{ uri: conversation.avatarUri }}
          style={[styles.avatar, isPending && styles.avatarPending]}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        {conversation.isFriend && (
          <View style={styles.friendBadge}>
            <ChatStarIcon width={16} height={15} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.username} numberOfLines={1}>
            {conversation.username}
          </Text>
          <Text style={styles.flag}>{getCountryFlag(conversation.countryCode)}</Text>
        </View>

        <Text style={styles.preview} numberOfLines={1} ellipsizeMode="tail">
          {isPending ? "Invite you!!" : previewText}
        </Text>
      </View>

      <View style={styles.meta}>
        {/* !+ 和未讀數字共用同一個位置：兩者同時存在時，!+（尚未回覆的邀請）優先顯示 */}
        {isPending ? (
          <View style={styles.inviteIndicator}>
            <Text style={styles.alertIcon}>!</Text>
            {/* 純裝飾用的 "+" 按鈕：外層 row 已經是 TouchableOpacity，點這裡等同點整列，
                都會進到同一個聊天室看邀請詳情，不做「未讀詳情就直接接受」的捷徑，比較安全。 */}
            <View style={styles.plusButton}>
              <Text style={styles.plusButtonText}>+</Text>
            </View>
          </View>
        ) : (
          !!conversation.unreadCount && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
            </View>
          )
        )}

        <Text style={styles.dateText}>{dateLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  // 不設固定寬高，讓這層直接貼合 Image 的實際大小（含邊框），橘框才會緊貼頭像不留空隙
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEEEEE",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
  },
  // 邊框直接加在頭像上（而不是外面再包一層容器），橘框才會緊貼著照片邊緣；
  // 陣列後面的 style 會覆蓋前面 avatar 的 hairline 邊框，所以有邀請時只會看到橘框
  avatarPending: {
    borderWidth: 3,
    borderColor: colors.brandStrong,
  },
  friendBadge: {
    position: "absolute",
    bottom: -1,
    right: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    flexShrink: 1,
  },
  flag: {
    fontSize: 13,
  },
  preview: {
    marginTop: 3,
    fontSize: 13,
    color: "#999999",
  },
  inviteIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  alertIcon: {
    fontSize: 15,
    fontWeight: "800",
    color: ALERT_BADGE_COLOR,
  },
  plusButton: {
    width: 44.45,
    height: 16.26,
    borderRadius: 4,
    backgroundColor: ALERT_BADGE_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 14,
  },
  meta: {
    alignItems: "flex-end",
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: "#AAAAAA",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: colors.brandStrong,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brandStrong,
  },
});
