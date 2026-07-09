import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import PrivateConversationRow from "../components/PrivateConversationRow";
import PrivateListHeader from "../components/PrivateListHeader";
import { usePrivateConversations } from "../hooks/usePrivateConversations";
import type { PrivateConversation } from "../types/private.types";

export default function PrivateListPage() {
  const router = useRouter();
  const { conversations } = usePrivateConversations();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return conversations;

    return conversations.filter((conversation) =>
      conversation.username.toLowerCase().includes(normalizedQuery),
    );
  }, [conversations, searchQuery]);

  const handlePressConversation = (conversation: PrivateConversation) => {
    router.push({
      pathname: "/private-chat/[conversationId]",
      params: { conversationId: conversation.id },
    });
  };

  return (
    <View style={styles.container}>
      <PrivateListHeader
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <FlashList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
