import { useCallback, useEffect, useRef, useState } from "react";

import { usersApi } from "@/src/features/profile/api/users.api";
import type { UserProfile } from "@/src/features/profile/types";

const PAGE_SIZE = 20;

/**
 * 既有的 useGroups / usePrivateConversations 用 300ms，這支刻意放寬。
 * 那兩支查的是使用者自己的資料（他的群組、他的對話），這支查的是全站使用者，
 * 成本與被限流的機率都高一個量級，而後端對這支明確掛了 429。
 */
const SEARCH_DEBOUNCE_MS = 450;

/**
 * 少於兩個字不送查詢。單字元的子字串比對幾乎等於全表掃描，
 * 回來的結果對使用者也沒有意義，只是平白把 rate limit 的額度吃掉。
 */
export const MIN_QUERY_LENGTH = 2;

/**
 * 限流與一般失敗一定要分開。兩者都退化成空陣列的話，畫面會對被限流的使用者
 * 說「查無此人」——那是假話，對方可能就在那裡。
 */
export type UserSearchError = "rate-limited" | "failed";

function toSearchError(error: unknown): UserSearchError {
  const status =
    typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;

  return status === 429 ? "rate-limited" : "failed";
}

type UseUserSearchResult = {
  results: UserProfile[];
  /** 後端回報的總筆數；用來判斷還有沒有下一頁 */
  total: number;
  /**
   * debounce 後「真的送出去查過」的字串。
   * 畫面要靠它來判斷該不該顯示「查無使用者」——使用者還在打字時不該看到那句話。
   */
  appliedQuery: string;
  isSearching: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: UserSearchError | null;
  loadMore: () => Promise<void>;
};

/**
 * 依公開 user_id 搜尋使用者。debounce 後才送出，並丟棄過期回應。
 *
 * 分頁是 limit / offset。offset 分頁在資料變動時本來就可能重複或漏掉，
 * 所以附加下一頁時用 user_uid 去重，至少不會出現重複的 key。
 */
export function useUserSearch(query: string): UseUserSearchResult {
  const trimmedQuery = query.trim();
  const isQueryable = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const [results, setResults] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [appliedQuery, setAppliedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<UserSearchError | null>(null);

  // 每次重新查第一頁都 +1；使用者又多打了幾個字時，舊那次的回應直接作廢。
  const requestTokenRef = useRef(0);
  // 目前真正在分頁的那個字串。loadMore 要照它繼續查，不能用 trimmedQuery
  // （那可能是使用者還在打、debounce 還沒送出的最新值）。
  const appliedQueryRef = useRef("");

  useEffect(() => {
    if (!isQueryable) {
      // 清空輸入框要立刻反映，不能等 debounce——否則框已經空了，底下還掛著上一次的結果。
      // token +1 同時讓還在路上的回應作廢。
      requestTokenRef.current += 1;
      appliedQueryRef.current = "";
      setResults([]);
      setTotal(0);
      setAppliedQuery("");
      setIsSearching(false);
      setError(null);
      return;
    }

    // 一打字就先轉圈，不要等 450ms 後才有反應
    setIsSearching(true);
    setError(null);

    const timer = setTimeout(() => {
      const requestToken = ++requestTokenRef.current;

      usersApi
        .search({ user_id: trimmedQuery, limit: PAGE_SIZE, offset: 0 })
        .then((page) => {
          if (requestToken !== requestTokenRef.current) return;

          appliedQueryRef.current = trimmedQuery;
          setResults(page.users);
          setTotal(page.total);
          setAppliedQuery(trimmedQuery);
        })
        .catch((searchError: unknown) => {
          if (requestToken !== requestTokenRef.current) return;

          console.warn("[useUserSearch] search failed", searchError);
          appliedQueryRef.current = "";
          setResults([]);
          setTotal(0);
          setAppliedQuery(trimmedQuery);
          setError(toSearchError(searchError));
        })
        .finally(() => {
          if (requestToken === requestTokenRef.current) setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [isQueryable, trimmedQuery]);

  const loadMore = useCallback(async () => {
    const searchQuery = appliedQueryRef.current;

    if (!searchQuery || isSearching || isLoadingMore || error !== null) return;
    if (results.length >= total) return;

    const requestToken = requestTokenRef.current;
    setIsLoadingMore(true);

    try {
      const page = await usersApi.search({
        user_id: searchQuery,
        limit: PAGE_SIZE,
        offset: results.length,
      });

      // 這期間搜尋字串換了，這頁已經不屬於畫面上那次搜尋，不接了
      if (requestToken !== requestTokenRef.current) return;

      setResults((previous) => {
        const seen = new Set(previous.map((user) => user.user_uid));
        return [
          ...previous,
          ...page.users.filter((user) => !seen.has(user.user_uid)),
        ];
      });
      setTotal(page.total);
    } catch (loadMoreError) {
      if (requestToken !== requestTokenRef.current) return;

      console.warn("[useUserSearch] loadMore failed", loadMoreError);
      setError(toSearchError(loadMoreError));
    } finally {
      setIsLoadingMore(false);
    }
  }, [error, isLoadingMore, isSearching, results.length, total]);

  return {
    results,
    total,
    appliedQuery,
    isSearching,
    isLoadingMore,
    hasMore: results.length < total,
    error,
    loadMore,
  };
}
