import { StyleSheet, TextInput, View } from "react-native";

import ChatSearchIcon from "@/src/assets/icons/chat_search_icon.svg";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

/**
 * 搜尋欄。放在 FlashList 的 ListHeaderComponent，會跟著列表內容一起上下拖動，
 * 不像 PrivateListHeader（Private 標題 + 加好友）固定在最上面。
 */
export default function PrivateSearchBar({
  searchQuery,
  onSearchQueryChange,
}: Props) {
  return (
    <View style={styles.container}>
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
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
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
