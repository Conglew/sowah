import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "@/src/theme/colors";
import type { SuggestedGroup } from "../types/group.types";

type Props = {
  suggestedGroups: SuggestedGroup[];
  isLoading: boolean;
};

const AVATAR_SIZE = 62;

/**
 * 「Suggested for you」推薦群組水平列表。
 * 資料量固定只有幾筆（不分頁），用 ScrollView horizontal 就夠，不需要 FlashList。
 */
export default function SuggestedGroupsSection({ suggestedGroups, isLoading }: Props) {
  const handleSeeAll = () => {
    // TODO: 推薦群組總覽頁尚未建立，先用 Alert 佔位。
    Alert.alert("Suggested Groups", "此功能尚未開放");
  };

  const handleJoinGroup = (group: SuggestedGroup) => {
    // TODO: 加入群組 API 尚未建立，先用 Alert 佔位。
    Alert.alert(group.name, "此功能尚未開放");
  };

  // 載入完發現沒有推薦群組：整個區塊（含標題）都不顯示，不留一塊空白
  if (!isLoading && suggestedGroups.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Suggested for you</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSeeAll}
          accessibilityRole="button"
          accessibilityLabel="See all suggested groups"
        >
          <Text style={styles.seeAll}>see all</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {suggestedGroups.map((group) => (
            <TouchableOpacity
              key={group.id}
              activeOpacity={0.7}
              style={styles.card}
              onPress={() => handleJoinGroup(group)}
              accessibilityRole="button"
              accessibilityLabel={`Join ${group.name}`}
            >
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: group.coverUri }}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />

                <View style={styles.joinBadge}>
                  <Text style={styles.joinBadgeText}>+</Text>
                </View>
              </View>

              <Text style={styles.name} numberOfLines={2}>
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brandStrong,
  },
  // 高度跟載入完成後的卡片列一致（頭像 + 文字兩行），載入結束時版面不跳動
  loadingWrap: {
    height: AVATAR_SIZE + 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 6,
    gap: 21,
  },
  card: {
    width: AVATAR_SIZE + 1,
    alignItems: "center",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#EEEEEE",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
  },
  joinBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#222222",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  joinBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 15,
  },
  name: {
    marginTop: 5,
    fontSize: 11,
    color: "#333333",
    textAlign: "center",
  },
});
