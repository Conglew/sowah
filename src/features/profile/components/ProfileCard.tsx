import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getCountryFlag } from "@/src/shared/utils/country-flag";
import { haptics } from "@/src/shared/utils/haptics";
import { colors } from "@/src/theme/colors";
import type {
  CheckInDay,
  MoreContentItem,
  Profile,
  ProfileStats,
  ProfileVariant,
} from "../types/profile.types";

type Props = {
  variant: ProfileVariant;
  profile: Profile;
  onPressPrimary?: () => void; // Edit profile / Add friends
  onPressSecondary?: () => void; // Share profile / Message
  onPressCheckIn?: () => void;
  onPressMoreContent?: (item: MoreContentItem) => void;
};

export function ProfileCard({
  variant,
  profile,
  onPressPrimary,
  onPressSecondary,
  onPressCheckIn,
  onPressMoreContent,
}: Props) {
  const isSelf = variant === "self";

  return (
    <View style={styles.root}>
      <Header profile={profile} />

      <Actions
        isSelf={isSelf}
        onPressPrimary={onPressPrimary}
        onPressSecondary={onPressSecondary}
      />

      <Stats stats={profile.stats} />

      {/* 以下只有自己看得到 */}
      {isSelf && profile.checkIn && (
        <CheckIn days={profile.checkIn} onPressCheckIn={onPressCheckIn} />
      )}

      {isSelf && profile.moreContents && profile.moreContents.length > 0 && (
        <MoreContents
          items={profile.moreContents}
          onPress={onPressMoreContent}
        />
      )}
    </View>
  );
}

function Header({ profile }: { profile: Profile }) {
  return (
    <View style={styles.header}>
      <Image
        source={{ uri: profile.avatarUri }}
        style={styles.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.headerText}>
        <View style={styles.nameRow}>
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.flag}>{getCountryFlag(profile.countryCode)}</Text>
        </View>
        <Text style={styles.bio}>{profile.bio}</Text>
      </View>
    </View>
  );
}

function Actions({
  isSelf,
  onPressPrimary,
  onPressSecondary,
}: {
  isSelf: boolean;
  onPressPrimary?: () => void;
  onPressSecondary?: () => void;
}) {
  const handlePress = (fn?: () => void) => {
    haptics.light();
    fn?.();
  };

  return (
    <View style={styles.actions}>
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          pressed && styles.actionButtonPressed,
        ]}
        android_ripple={{ color: "#00000012" }}
        onPress={() => handlePress(onPressPrimary)}
      >
        <Text style={styles.actionText}>
          {isSelf ? "Edit profile" : "Add Friends"}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          pressed && styles.actionButtonPressed,
        ]}
        android_ripple={{ color: "#00000012" }}
        onPress={() => handlePress(onPressSecondary)}
      >
        <Text style={styles.actionText}>
          {isSelf ? "Share profile" : "Message"}
        </Text>
      </Pressable>
    </View>
  );
}

function Stats({ stats }: { stats: ProfileStats }) {
  return (
    <View style={styles.stats}>
      <StatBlock
        label="Hosted"
        value={stats.hostedCount}
        rank={stats.hostedRank}
      />
      <StatBlock
        label="Attended"
        value={stats.attendedCount}
        rank={stats.attendedRank}
      />
    </View>
  );
}

function StatBlock({
  label,
  value,
  rank,
}: {
  label: string;
  value: number;
  rank: number;
}) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statRank}>Rank #{rank}</Text>
      </View>
    </View>
  );
}

function CheckIn({
  days,
  onPressCheckIn,
}: {
  days: CheckInDay[];
  onPressCheckIn?: () => void;
}) {
  return (
    <View style={styles.checkInWrap}>
      <View style={styles.checkInRow}>
        {days.map((d) => {
          const active = d.state === "today";
          const claimed = d.state === "claimed";
          return (
            <View key={d.day} style={styles.checkInCol}>
              <Text style={styles.checkInDayLabel}>Day {d.day}</Text>
              <View
                style={[
                  styles.checkInBadge,
                  claimed && styles.checkInBadgeClaimed,
                  active && styles.checkInBadgeToday,
                ]}
              >
                <Text style={styles.checkInReward}>{d.reward}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.checkInButton,
          pressed && styles.checkInButtonPressed,
        ]}
        android_ripple={{ color: "#FFFFFF22" }}
        onPress={() => {
          haptics.success();
          onPressCheckIn?.();
        }}
      >
        <Text style={styles.checkInButtonText}>Check in</Text>
      </Pressable>
    </View>
  );
}

function MoreContents({
  items,
  onPress,
}: {
  items: MoreContentItem[];
  onPress?: (item: MoreContentItem) => void;
}) {
  return (
    <View style={styles.moreWrap}>
      <Text style={styles.moreTitle}>More Contents</Text>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [
            styles.moreRow,
            pressed && styles.moreRowPressed,
          ]}
          android_ripple={{ color: "#00000010" }}
          onPress={() => {
            haptics.selection();
            onPress?.(item);
          }}
        >
          <Text style={styles.moreIcon}>{item.icon}</Text>
          <Text style={styles.moreLabel}>{item.label}</Text>
          <View style={styles.moreRight}>
            {item.reward != null && (
              <Text style={styles.moreReward}>🏆 {item.reward}</Text>
            )}
            <Text style={styles.moreChevron}>›</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EEE",
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  username: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  flag: {
    fontSize: 18,
  },
  bio: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden", // 讓 android_ripple 被圓角裁切
  },
  actionButtonPressed: {
    opacity: 0.6,
    backgroundColor: "#F5F5F5",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  stats: {
    flexDirection: "row",
    marginTop: 22,
  },
  statBlock: {
    flex: 1,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 2,
  },
  statValue: {
    fontSize: 44,
    fontWeight: "800",
    color: colors.brand,
    lineHeight: 48,
  },
  statRank: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 8,
  },
  checkInWrap: {
    marginTop: 24,
  },
  checkInRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  checkInCol: {
    alignItems: "center",
    gap: 6,
  },
  checkInDayLabel: {
    fontSize: 12,
    color: "#888888",
  },
  checkInBadge: {
    width: 40,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkInBadgeClaimed: {
    backgroundColor: "#FFE9D3",
  },
  checkInBadgeToday: {
    backgroundColor: "#FFE9D3",
    borderWidth: 2,
    borderColor: colors.brand,
  },
  checkInReward: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
  },
  checkInButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 8,
    backgroundColor: "#555555",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  checkInButtonPressed: {
    opacity: 0.85,
  },
  checkInButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  moreWrap: {
    marginTop: 24,
  },
  moreTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
  },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
  },
  moreRowPressed: {
    backgroundColor: "#FAFAFA",
  },
  moreIcon: {
    fontSize: 18,
    marginRight: 12,
    color: "#666666",
  },
  moreLabel: {
    flex: 1,
    fontSize: 15,
    color: "#333333",
  },
  moreRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moreReward: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brand,
  },
  moreChevron: {
    fontSize: 22,
    color: "#BBBBBB",
  },
});