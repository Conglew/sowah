import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ChatStarIcon from "@/src/assets/icons/chat_star_icon.svg";
import { colors } from "@/src/theme/colors";
import type { GroupSummary } from "../types/group.types";
import {
  formatEventParticipants,
  formatEventSchedule,
  formatGroupListDate,
} from "../utils/group.utils";

type Props = {
  group: GroupSummary;
  onPress: () => void;
};

// 邀請提示的橘色，與 PrivateConversationRow 的 ALERT_BADGE_COLOR 一致（非品牌色，不放進 theme/colors）
const ALERT_BADGE_COLOR = "#FF8100";

export default function GroupRow({ group, onPress }: Props) {
  const isPending = !!group.hasPendingInvitation;
  const dateLabel = group.lastMessageAt ? formatGroupListDate(group.lastMessageAt) : "";

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: group.avatarUri }}
            style={[styles.avatar, isPending && styles.avatarPending]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />

          {group.isStarred && (
            <View style={styles.starBadge}>
              <ChatStarIcon width={16} height={15} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>

          <Text style={styles.preview} numberOfLines={1} ellipsizeMode="tail">
            {isPending ? "Invite you!!" : (group.lastMessageText ?? "")}
          </Text>
        </View>

        <View style={styles.meta}>
          {/* !+ 和未讀數字共用同一個位置：兩者同時存在時，!+（尚未回覆的邀請）優先顯示 */}
          {isPending ? (
            <View style={styles.inviteIndicator}>
              <Text style={styles.alertIcon}>!</Text>
              {/* 純裝飾用的 "+" 按鈕：外層已經是 TouchableOpacity，點這裡等同點整列，
                  之後都會進到同一個群組頁看邀請詳情，不做「未讀詳情就直接接受」的捷徑。 */}
              <View style={styles.plusButton}>
                <Text style={styles.plusButtonText}>+</Text>
              </View>
            </View>
          ) : (
            !!group.unreadCount && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{group.unreadCount}</Text>
              </View>
            )
          )}

          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>
      </View>

      {/* 下一場活動列：沒有活動的群組（如只有邀請的 chillchat）不顯示 */}
      {group.upcomingEvent && (
        <View style={styles.eventStrip}>
          <Text style={styles.eventText} numberOfLines={1}>
            <Text style={styles.eventSchedule}>
              {formatEventSchedule(group.upcomingEvent)}
            </Text>
            {"  "}
            {group.upcomingEvent.title}
          </Text>

          <View style={styles.eventParticipants}>
            <Text style={styles.eventParticipantsText}>
              {formatEventParticipants(group.upcomingEvent)}
            </Text>
            <Ionicons name="person" size={11} color="#555555" />
          </View>
        </View>
      )}
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
  // 邊框直接加在頭像上，橘框才會緊貼照片邊緣（與 PrivateConversationRow 同做法）
  avatarPending: {
    borderWidth: 3,
    borderColor: colors.brandStrong,
  },
  starBadge: {
    position: "absolute",
    bottom: -1,
    right: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  preview: {
    marginTop: 3,
    fontSize: 13,
    color: "#999999",
  },
  meta: {
    alignItems: "flex-end",
    gap: 6,
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
  dateText: {
    fontSize: 11,
    color: "#AAAAAA",
  },
  eventStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#ECECEC",
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  eventText: {
    flex: 1,
    fontSize: 11,
    color: "#555555",
  },
  eventSchedule: {
    fontWeight: "700",
    color: "#444444",
  },
  eventParticipants: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  eventParticipantsText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555555",
  },
});
