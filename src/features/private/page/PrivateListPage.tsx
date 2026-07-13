import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import PrivateConversationRow from "../components/PrivateConversationRow";
import PrivateListHeader from "../components/PrivateListHeader";
import PrivateSearchBar from "../components/PrivateSearchBar";
import { usePrivateConversations } from "../hooks/usePrivateConversations";
import type { PrivateConversation } from "../types/private.types";

export default function PrivateListPage() {
  const router = useRouter();
  const { conversations } = usePrivateConversations();
  const listRef = useRef<FlashListRef<PrivateConversation>>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return conversations;

    return conversations.filter((conversation) =>
      conversation.username.toLowerCase().includes(normalizedQuery),
    );
  }, [conversations, searchQuery]);

  // 搜尋字串一變動，結果一律從最上面開始看，不要停在舊的捲動位置。
  // 注意：這裡刻意不用 useFocusEffect 在「返回 focus」時也捲回頂部——
  // 從聊天室按返回回到列表時，要保留使用者原本的捲動位置，不要跳回最上面。
  useEffect(() => {
    listRef.current?.scrollToTop({ animated: true });
  }, [searchQuery]);

  const handlePressConversation = (conversation: PrivateConversation) => {
    // 進聊天室前先收起鍵盤，把搜尋欄的游標 blur 掉
    Keyboard.dismiss();

    router.push({
      pathname: "/private-chat/[conversationId]",
      params: { conversationId: conversation.id },
    });
  };

  return (
    // 點列表空白處（不是點在 row / 搜尋欄本身）就收起鍵盤；搜尋輸入框在拖動列表時也會跟著收起
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* 固定在最上面，不隨列表滾動 */}
        <PrivateListHeader />

        <FlashList
          ref={listRef}
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          // 搜尋欄放這裡而不是當 FlashList 的 sibling：讓它跟著列表一起上下拖動，
          // 不會固定不動；Private 標題 + 加好友則留在上面的 PrivateListHeader。
          ListHeaderComponent={
            <PrivateSearchBar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          }
          renderItem={({ item }) => (
            <PrivateConversationRow
              conversation={item}
              onPress={() => handlePressConversation(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>找不到符合的對話</Text>
            </View>
          }
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 23,
    paddingBottom: 84,
  },
  separator: {
    // 比 hairlineWidth 再粗一階（2 個實體像素），但仍隨裝置 DPR 縮放，
    // 不用寫死 1 這種 dp 數字（那樣在不同 DPR 裝置上粗細會不一致）。
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "#EEEEEE",
  },
  emptyWrap: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999999",
  },
});
