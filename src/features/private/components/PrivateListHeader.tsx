import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ChatAddIcon from "@/src/assets/icons/chat_add_icon.svg";

/**
 * 固定在畫面最上面、不隨列表滾動的標題列（Private 標題 + 加好友按鈕）。
 * 搜尋欄拆到 PrivateSearchBar，交給 FlashList 的 ListHeaderComponent，
 * 才會跟著列表一起上下拖動。
 */
export default function PrivateListHeader() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Private</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.addButton}
          onPress={() => router.push("/friends")}
          accessibilityRole="button"
          accessibilityLabel="Add friend"
        >
          <ChatAddIcon width={30} height={19} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40,
    paddingTop: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111111",
  },
  addButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
