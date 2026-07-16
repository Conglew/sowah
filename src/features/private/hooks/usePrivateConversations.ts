import { useCallback, useEffect, useRef, useState } from "react";

import { privateApi } from "../api/private.api";
import { usePrivateStore } from "../stores/private.store";
import type { PrivateConversation } from "../types/private.types";

// 一開始至少載入 10 筆對話（15 筆 mock 資料會切成 10 + 5 兩頁），符合「至少載入 10 筆」的需求。
const LIST_PAGE_SIZE = 10;

// 搜尋改成交給後端查（見 private.api.ts 的註解），每打一個字都真的送一次請求太浪費，
// 停下來 300ms 沒再打字才真的送出。
const SEARCH_DEBOUNCE_MS = 300;

type UsePrivateConversationsResult = {
  conversations: PrivateConversation[];
  /** 第一次載入 / 換搜尋字串重新查詢時的 loading */
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
 * Private 列表用的對話清單：分頁載入，搜尋字串交給後端查（debounce 過）。
 *
 * 分頁游標／各種 loading 狀態放在這個 hook 自己管理（不放進 zustand store），
 * store（conversationsById）只當純資料快取，跟 useProfile 的慣例一致；
 * 接後端時只需要改 api/private.api.ts 裡面的實作，這裡完全不用動。
 */
export function usePrivateConversations(
  searchQuery: string,
): UsePrivateConversationsResult {
  const conversationsById = usePrivateStore((state) => state.conversationsById);
  const upsertConversations = usePrivateStore((state) => state.upsertConversations);

  const [listOrder, setListOrder] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 目前「真的已經送出查詢」的搜尋字串（debounce 後），refresh / loadMore 都要照這個字串繼續查，
  // 不能直接用 searchQuery（那個可能是使用者還在打、debounce 還沒觸發的最新值）。
  const appliedSearchQueryRef = useRef("");
  // 每次重新查第一頁都 +1；非同步結果回來時比對這個 token，過期的回應（例如又更快地換了搜尋字串）直接丟棄。
  const requestTokenRef = useRef(0);
  const isFirstRunRef = useRef(true);

  const loadFirstPage = useCallback(
    async (query: string, mode: "initial" | "refresh") => {
      const requestToken = ++requestTokenRef.current;

      if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const page = await privateApi.getConversationsPage({
          cursor: null,
          pageSize: LIST_PAGE_SIZE,
          searchQuery: query,
        });

        if (requestToken !== requestTokenRef.current) return; // 已經有更新的查詢，這次結果作廢

        appliedSearchQueryRef.current = query;
        upsertConversations(page.conversations);
        setListOrder(page.conversations.map((conversation) => conversation.id));
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      } catch (error) {
        console.warn("[usePrivateConversations] load failed", error);
      } finally {
        if (requestToken === requestTokenRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [upsertConversations],
  );

  // 搜尋字串變動：debounce 後重新查第一頁（列表分頁狀態全部重置）；第一次進畫面不用等 debounce。
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      void loadFirstPage(searchQuery, "initial");
      return;
    }

    const timer = setTimeout(() => {
      void loadFirstPage(searchQuery, "initial");
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery, loadFirstPage]);

  const refresh = useCallback(async () => {
    await loadFirstPage(appliedSearchQueryRef.current, "refresh");
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading || isRefreshing) return;

    const requestToken = requestTokenRef.current;
    setIsLoadingMore(true);

    try {
      const page = await privateApi.getConversationsPage({
        cursor,
        pageSize: LIST_PAGE_SIZE,
        searchQuery: appliedSearchQueryRef.current,
      });

      if (requestToken !== requestTokenRef.current) return; // 這期間搜尋字串換了，這頁不接了

      upsertConversations(page.conversations);
      setListOrder((previousOrder) => [
        ...previousOrder,
        ...page.conversations.map((conversation) => conversation.id),
      ]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (error) {
      console.warn("[usePrivateConversations] loadMore failed", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoading, isLoadingMore, isRefreshing, upsertConversations]);

  const conversations = listOrder
    .map((id) => conversationsById[id])
    .filter((conversation): conversation is PrivateConversation => conversation != null);

  return {
    conversations,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    refresh,
    loadMore,
  };
}
