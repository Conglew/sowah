import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "@/src/theme/colors";
import { SCREEN_HORIZONTAL_PADDING } from "@/src/theme/layout";
import type { SuggestedGroup } from "../types/group.types";

type Props = {
  suggestedGroups: SuggestedGroup[];
  isLoading: boolean;
  isLoadingMore: boolean;
  onEndReached: () => void;
};

const AVATAR_SIZE = 62;
const CARD_WIDTH = AVATAR_SIZE + 1;
const CARD_GAP = 21;
/** 這個區塊相對於外層清單內距，再往內縮的距離（標題 / see all 的位置） */
const SECTION_HORIZONTAL_PADDING = 20;
/**
 * 捲動區本身滿版（靠 marginHorizontal 抵銷外層內距），改由內容的左右 padding 讓
 * 「捲到最前面時第一張卡片對齊標題」。這樣卡片是滑出螢幕邊緣，而不是被容器切掉。
 */
const LIST_EDGE_INSET = SCREEN_HORIZONTAL_PADDING + SECTION_HORIZONTAL_PADDING;
// 頭像 + 兩行群組名稱。寫成固定高度是必要的：橫向 FlashList 需要一個確定的高度才能量測，
// 而且載入中 / 載入完成共用同一個高度，資料進來時版面不會跳。
const LIST_HEIGHT = AVATAR_SIZE + 40;

/**
 * 「Suggested for you」推薦群組水平列表。
 *
 * 推薦是「沒有明確總數」的清單，所以做成往右滑到底自動補下一頁（無限捲動），
 * 而不是一次全拿。用 FlashList 而非 ScrollView：卡片會被回收，
 * 滑幾百張也只維持畫面上那幾個 view。
 */
export default function SuggestedGroupsSection({
  suggestedGroups,
  isLoading,
  isLoadingMore,
  onEndReached,
}: Props) {
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

      <View style={styles.listWrap}>
        {isLoading ? (
          <View style={styles.centeredFill}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : (
          <FlashList
            horizontal
            data={suggestedGroups}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
            // 剩半個畫面寬時就先去要下一頁，滑到底時通常已經接上了
            onEndReachedThreshold={0.5}
            onEndReached={onEndReached}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator color={colors.brand} />
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.card}
                onPress={() => handleJoinGroup(item)}
                accessibilityRole="button"
                accessibilityLabel={`Join ${item.name}`}
              >
                <View style={styles.avatarWrap}>
                  <Image
                    source={{ uri: item.coverUri }}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />

                  <View style={styles.joinBadge}>
                    <Text style={styles.joinBadgeText}>+</Text>
                  </View>
                </View>

                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  // 只有標題列吃這個內距；捲動區要滿版，所以內距不放在 container 上
  headerRow: {
    paddingHorizontal: SECTION_HORIZONTAL_PADDING,
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
  listWrap: {
    height: LIST_HEIGHT,
    marginTop: 10,
    marginBottom: 6,
    // 抵銷外層 FlashList contentContainerStyle 的左右內距，讓捲動區跟螢幕同寬
    marginHorizontal: -SCREEN_HORIZONTAL_PADDING,
  },
  listContent: {
    paddingHorizontal: LIST_EDGE_INSET,
  },
  centeredFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // 注意：FlashList 的 contentContainerStyle 只吃 padding、不支援 gap，
  // 卡片間距改用 ItemSeparatorComponent（原本 ScrollView 版本 gap: 21 的等價物）。
  cardSeparator: {
    width: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: "center",
  },
  footerLoading: {
    width: AVATAR_SIZE,
    height: LIST_HEIGHT,
    marginLeft: CARD_GAP,
    alignItems: "center",
    justifyContent: "center",
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
