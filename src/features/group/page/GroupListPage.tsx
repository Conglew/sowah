import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ListFooterStatus from "@/src/components/common/ListFooterStatus";
import { colors } from "@/src/theme/colors";
import { SCREEN_HORIZONTAL_PADDING } from "@/src/theme/layout";
import GroupListHeader from "../components/GroupListHeader";
import GroupRow from "../components/GroupRow";
import GroupSearchBar from "../components/GroupSearchBar";
import GroupTabs from "../components/GroupTabs";
import SuggestedGroupsSection from "../components/SuggestedGroupsSection";
import { useGroups } from "../hooks/useGroups";
import { useSuggestedGroups } from "../hooks/useSuggestedGroups";
import type { GroupSummary, GroupVisibility } from "../types/group.types";

export default function GroupListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVisibility, setActiveVisibility] =
    useState<GroupVisibility>("public");

  const {
    groups,
    counts,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    loadMore,
  } = useGroups(activeVisibility, searchQuery);
  const { suggestedGroups, reload: reloadSuggested } = useSuggestedGroups();

  const listRef = useRef<FlashListRef<GroupSummary>>(null);

  // 搜尋字串或 tab 一變動，結果一律從最上面開始看，不要停在舊的捲動位置
  // （與 PrivateListPage 相同；之後從群組內頁返回時要保留捲動位置，所以不用 useFocusEffect）。
  useEffect(() => {
    listRef.current?.scrollToTop({ animated: true });
  }, [searchQuery, activeVisibility]);

  const handlePressGroup = (group: GroupSummary) => {
    Keyboard.dismiss();

    // TODO: 群組聊天室 / 詳情頁與對應 API 尚未建立，先用 Alert 佔位。
    // 建好後比照 private：router.push({ pathname: "/group-chat/[groupId]", params: { groupId: group.id } })
    Alert.alert(group.name, "此功能尚未開放");
  };

  const handleRefresh = () => {
    void Promise.all([refresh(), reloadSuggested()]);
  };

  return (
    <View style={styles.container}>
      {/* 固定在最上面，不隨列表滾動 */}
      <GroupListHeader />
      <View style={styles.fixedSearch}>
        <GroupSearchBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      </View>

      <FlashList
        style={styles.list}
        ref={listRef}
        data={groups}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
            progressViewOffset={8}
          />
        }
        // 搜尋欄、推薦群組、Your Group 標題 + tab 都跟著列表一起捲動；
        // 只有最上面的 Group 標題列（GroupListHeader）固定不動。
        ListHeaderComponent={
          <View>
            <SuggestedGroupsSection groups={suggestedGroups} />
            <GroupTabs
              activeVisibility={activeVisibility}
              counts={counts}
              onVisibilityChange={setActiveVisibility}
            />
          </View>
        }
        renderItem={({ item }) => (
          <GroupRow group={item} onPress={() => handlePressGroup(item)} />
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
            itemCount={groups.length}
            endMessage="沒有更多群組了"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {isLoading ? (
              <ActivityIndicator color={colors.brand} />
            ) : (
              <Text style={styles.emptyText}>找不到符合的群組</Text>
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
    // 與 PrivateListPage 相同：比 hairlineWidth 粗一階，但仍隨裝置 DPR 縮放
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "#EEEEEE",
  },
  emptyWrap: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999999",
  },
});
