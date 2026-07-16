import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * 固定在畫面最上面、不隨列表滾動的標題列（Group 標題 + 建立群組按鈕）。
 * 搜尋欄以下的內容都交給 FlashList 的 ListHeaderComponent，跟著列表一起捲動。
 */
export default function GroupListHeader() {
  const handleCreateGroup = () => {
    // TODO: 設計稿只定義了「建立群組」入口，group 建立流程 / API 尚未建立，先用 Alert 佔位。
    Alert.alert("Create Group", "此功能尚未開放");
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Group</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.createButton}
          onPress={handleCreateGroup}
          accessibilityRole="button"
          accessibilityLabel="Create group"
        >
          <Text style={styles.createButtonText}>+</Text>
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
  createButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#111111",
    lineHeight: 34,
  },
});
