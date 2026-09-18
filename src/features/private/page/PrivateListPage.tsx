import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ListFooterStatus from "@/src/components/common/ListFooterStatus";
import { colors } from "@/src/theme/colors";
import { SCREEN_HORIZONTAL_PADDING } from "@/src/theme/layout";
import PrivateConversationRow from "../components/PrivateConversationRow";
import PrivateListHeader from "../components/PrivateListHeader";
import PrivateSearchBar from "../components/PrivateSearchBar";
import { usePrivateConversations } from "../hooks/usePrivateConversations";
import type { PrivateConversation } from "../types/private.types";

export default function PrivateListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    conversations,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    loadMore,
  } = usePrivateConversations(searchQuery);

  const listRef = useRef<FlashListRef<PrivateConversation>>(null);
  const hasFocusedOnceRef = useRef(false);

  // Tabs 會保留已掛載畫面；從聊天室或其他 tab 回來時不會重新 mount，
  // 因此在再次 focus 時主動同步好友清單與每個對話的最新一頁歷史。
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return;
      }
      void refresh();
    }, [refresh]),
  );

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
    <View style={styles.container}>
      {/* 固定在最上面，不隨列表滾動 */}
      <PrivateListHeader />
      <View style={styles.fixedSearch}>
        <PrivateSearchBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      </View>

      <FlashList
        style={styles.list}
        ref={listRef}
        data={conversations}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
            progressViewOffset={8}
          />
        }
        renderItem={({ item }) => (
          <PrivateConversationRow
            conversation={item}
            onPress={() => handlePressConversation(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        // 分批載入：捲到接近底部（剩 40% 一個畫面高度時）就補下一頁
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          void loadMore();
        }}
        ListFooterComponent={
          <ListFooterStatus
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            itemCount={conversations.length}
            endMessage="沒有更多對話了"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {isLoading ? (
              <ActivityIndicator color={colors.brand} />
            ) : (
              <Text style={styles.emptyText}>找不到符合的對話</Text>
            )}
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
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingBottom: 84,
  },
  list: {
    flex: 1,
  },
  fixedSearch: {
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
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
