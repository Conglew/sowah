import { useCallback, useEffect, useRef, useState } from "react";

import { groupApi } from "../api/group.api";
import type { SuggestedGroup } from "../types/group.types";

// 水平卡片一次載 10 張：畫面上大約看得到 5 張，預先多備一頁，滑起來不會等。
const SUGGESTED_PAGE_SIZE = 10;

type UseSuggestedGroupsResult = {
  suggestedGroups: SuggestedGroup[];
  /** 第一頁載入中（含下拉刷新後重新載第一頁） */
  isLoading: boolean;
  /** 往右滑到底、正在補下一頁 */
  isLoadingMore: boolean;
  /** 還有沒有下一頁；false 之後 loadMore 不會再發請求 */
  hasMore: boolean;
  /** 接給 FlashList 的 onEndReached */
  loadMore: () => Promise<void>;
  /** 下拉刷新整個 Group 頁時，讓推薦列表也從第一頁重載 */
  reload: () => Promise<void>;
};

/**
 * 「Suggested for you」推薦群組：水平無限捲動載入。
 *
 * 分頁游標與 loading 狀態放在 hook 自己管理，跟 useGroups / usePrivateConversations 同一套慣例；
 * 資料不進 zustand store —— 目前只有這一個畫面用得到，沒有跨畫面共用需求。
 * 接後端時只要把 group.api.ts 的 USE_MOCK 關掉，這支完全不用動。
 */
export function useSuggestedGroups(): UseSuggestedGroupsResult {
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // unmount 後非同步結果回來不要再 setState
  const isMountedRef = useRef(true);
  // 每次重載第一頁都 +1；結果回來時比對，過期的回應（例如刷新途中又刷新一次）直接丟棄，
  // 否則舊的第一頁會蓋掉新的、或把舊資料接到新清單後面。
  const requestTokenRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestToken = ++requestTokenRef.current;

    setIsLoading(true);

    try {
      const page = await groupApi.getSuggestedGroupsPage({
        cursor: null,
        pageSize: SUGGESTED_PAGE_SIZE,
      });

      if (!isMountedRef.current || requestToken !== requestTokenRef.current) return;

      setSuggestedGroups(page.groups);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (error) {
      console.warn("[useSuggestedGroups] load failed", error);
    } finally {
      if (isMountedRef.current && requestToken === requestTokenRef.current) {
        setIsLoading(false);
        // 失敗時也要解掉，否則 spinner 會一直轉
        setIsLoadingMore(false);
      }
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const requestToken = requestTokenRef.current;
    setIsLoadingMore(true);

    try {
      const page = await groupApi.getSuggestedGroupsPage({
        cursor,
        pageSize: SUGGESTED_PAGE_SIZE,
      });

      if (!isMountedRef.current || requestToken !== requestTokenRef.current) return;

      setSuggestedGroups((previousGroups) => {
        // 依 id 去重：推薦清單是動態產生的，翻頁途中排序若變動，同一筆可能被回傳兩次。
        // 重複的 id 會讓 FlashList 拿到重複 key，多出來那張卡片佔位卻不會 mount（破一格空白）。
        const seenIds = new Set(previousGroups.map((group) => group.id));
        const appendedGroups = page.groups.filter((group) => !seenIds.has(group.id));

        return appendedGroups.length > 0
          ? [...previousGroups, ...appendedGroups]
          : previousGroups;
      });

      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (error) {
      console.warn("[useSuggestedGroups] loadMore failed", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [cursor, hasMore, isLoading, isLoadingMore]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { suggestedGroups, isLoading, isLoadingMore, hasMore, loadMore, reload };
}
