import { useCallback, useEffect, useRef, useState } from "react";

import { groupApi } from "../api/group.api";
import { useGroupStore } from "../stores/group.store";
import type { GroupSummary, GroupVisibility } from "../types/group.types";

const LIST_PAGE_SIZE = 10;

// 搜尋交給後端查（見 group.api.ts 的註解），每打一個字都送一次請求太浪費，
// 停下來 300ms 沒再打字才真的送出（與 usePrivateConversations 一致）。
const SEARCH_DEBOUNCE_MS = 300;

type UseGroupsResult = {
  groups: GroupSummary[];
  /**
   * 兩個 tab 的群組總數（"Public (1)" / "Private (2)"）。
   * 第一頁還沒回來前是 null，畫面層此時先不顯示括號數字。
   */
  counts: Record<GroupVisibility, number> | null;
  /** 第一次載入 / 換搜尋字串或切 tab 重新查詢時的 loading */
  isLoading: boolean;
  /** 下拉刷新中，接給 RefreshControl 的 refreshing */
  isRefreshing: boolean;
  /** 捲到底載入下一頁中 */
  isLoadingMore: boolean;
  /** 還有沒有下一頁 */
  hasMore: boolean;
  /** 接給 RefreshControl 的 onRefresh */
  refresh: () => Promise<void>;
  /** 接給 FlashList 的 onEndReached */
  loadMore: () => Promise<void>;
};

/**
 * Group 列表用的群組清單：依 visibility（Public / Private tab）分頁載入，
 * 搜尋字串交給後端查（debounce 過）。
 *
 * 分頁游標／loading 狀態放在 hook 自己管理，store（groupsById）只當純資料快取，
 * 與 usePrivateConversations 同一套慣例；接後端時只需要改 api/group.api.ts。
 */
export function useGroups(
  visibility: GroupVisibility,
  searchQuery: string,
): UseGroupsResult {
  const groupsById = useGroupStore((state) => state.groupsById);
  const upsertGroups = useGroupStore((state) => state.upsertGroups);

  const [listOrder, setListOrder] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<GroupVisibility, number> | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 目前「真的已經送出查詢」的條件（debounce 後），refresh / loadMore 都要照這組條件繼續查，
  // 不能直接用 searchQuery（可能是使用者還在打、debounce 還沒觸發的最新值）。
  const appliedQueryRef = useRef<{ visibility: GroupVisibility; searchQuery: string }>({
    visibility,
    searchQuery: "",
  });
  // 每次重新查第一頁都 +1；過期的非同步回應（例如又更快地切了 tab / 換搜尋字串）直接丟棄。
  const requestTokenRef = useRef(0);
  const isFirstRunRef = useRef(true);

  const loadFirstPage = useCallback(
    async (
      query: { visibility: GroupVisibility; searchQuery: string },
      mode: "initial" | "refresh",
    ) => {
      const requestToken = ++requestTokenRef.current;

      if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const page = await groupApi.getGroupsPage({
          visibility: query.visibility,
          cursor: null,
          pageSize: LIST_PAGE_SIZE,
          searchQuery: query.searchQuery,
        });

        if (requestToken !== requestTokenRef.current) return; // 已經有更新的查詢，這次結果作廢

        appliedQueryRef.current = query;
        upsertGroups(page.groups);
        setListOrder(page.groups.map((group) => group.id));
        setCounts(page.counts);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      } catch (error) {
        console.warn("[useGroups] load failed", error);
      } finally {
        if (requestToken === requestTokenRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [upsertGroups],
  );

  // 搜尋字串或 tab 變動：debounce 後重新查第一頁（分頁狀態全部重置）。
  // 第一次進畫面、以及「只切 tab（搜尋字串沒變）」不用等 debounce——切 tab 是點擊，不會連續觸發。
  useEffect(() => {
    const query = { visibility, searchQuery };

    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      void loadFirstPage(query, "initial");
      return;
    }

    if (searchQuery === appliedQueryRef.current.searchQuery) {
      void loadFirstPage(query, "initial");
      return;
    }

    const timer = setTimeout(() => {
      void loadFirstPage(query, "initial");
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [visibility, searchQuery, loadFirstPage]);

  const refresh = useCallback(async () => {
    await loadFirstPage(appliedQueryRef.current, "refresh");
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading || isRefreshing) return;

    const requestToken = requestTokenRef.current;
    setIsLoadingMore(true);

    try {
      const page = await groupApi.getGroupsPage({
        visibility: appliedQueryRef.current.visibility,
        cursor,
        pageSize: LIST_PAGE_SIZE,
        searchQuery: appliedQueryRef.current.searchQuery,
      });

      if (requestToken !== requestTokenRef.current) return; // 這期間查詢條件換了，這頁不接了

      upsertGroups(page.groups);
      setListOrder((previousOrder) => [
        ...previousOrder,
        ...page.groups.map((group) => group.id),
      ]);
      setCounts(page.counts);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (error) {
      console.warn("[useGroups] loadMore failed", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoading, isLoadingMore, isRefreshing, upsertGroups]);

  const groups = listOrder
    .map((id) => groupsById[id])
    .filter((group): group is GroupSummary => group != null);

  return {
    groups,
    counts,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    loadMore,
  };
}
