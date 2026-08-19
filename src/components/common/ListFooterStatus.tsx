import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  /** 正在補下一頁 */
  isLoadingMore: boolean;
  /** 還有沒有下一頁 */
  hasMore: boolean;
  /** 目前清單筆數；0 筆時交給 ListEmptyComponent 處理，這裡不顯示任何東西 */
  itemCount: number;
  /** 到底時顯示的文字；不同清單想講不同話就傳這個 */
  endMessage?: string;
};

/**
 * 分頁清單底部的狀態列：載入中轉圈 / 已到底提示 / 什麼都不顯示。
 *
 * 三種狀態互斥，而且「已到底」只在真的有資料時才出現——
 * 空清單配上「沒有更多了」會讓使用者以為是載入失敗，那個情境屬於 ListEmptyComponent。
 * Private 與 Group 兩個列表共用同一支，避免兩邊的文案與間距各自漂移。
 */
export default function ListFooterStatus({
  isLoadingMore,
  hasMore,
  itemCount,
  endMessage = "沒有更多了",
}: Props) {
  if (isLoadingMore) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!hasMore && itemCount > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.endText}>{endMessage}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // 兩種狀態共用同一個高度，spinner 換成文字時版面不會跳
  container: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  endText: {
    fontSize: 12,
    color: "#AAAAAA",
  },
});
