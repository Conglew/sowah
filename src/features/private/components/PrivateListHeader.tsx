import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import ChatAddIcon from "@/src/assets/icons/chat_add_icon.svg";
import ChatSearchIcon from "@/src/assets/icons/chat_search_icon.svg";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export default function PrivateListHeader({
  searchQuery,
  onSearchQueryChange,
}: Props) {
  const handleAddFriend = () => {
    // TODO: 目前設計稿只定義了「新增好友」入口，尚未有對應 API / 流程，先用 Alert 佔位。
    Alert.alert("Add Friend", "此功能尚未開放");
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Private</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.addButton}
          onPress={handleAddFriend}
          accessibilityRole="button"
          accessibilityLabel="Add friend"
        >
          <ChatAddIcon width={30} height={19} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <ChatSearchIcon width={9} height={9} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholder=""
          placeholderTextColor="#AAAAAA"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40,
    paddingTop: 4,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    paddingHorizontal: 6,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 9,
    color: "#111111",
    padding: 0,
  },
});
