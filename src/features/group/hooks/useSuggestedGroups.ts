import { useCallback, useEffect, useRef, useState } from "react";

import { groupApi } from "../api/group.api";
import type { SuggestedGroup } from "../types/group.types";

type UseSuggestedGroupsResult = {
  suggestedGroups: SuggestedGroup[];
  isLoading: boolean;
  /** 下拉刷新整個 Group 頁時，讓推薦列表也一起重載 */
  reload: () => Promise<void>;
};

/**
 * 「Suggested for you」推薦群組列表。一次拿全部（數量少、水平捲動），不分頁。
 * 資料不放 zustand store：目前只有這一個畫面用到，沒有跨畫面共用需求。
 */
export function useSuggestedGroups(): UseSuggestedGroupsResult {
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // unmount 後非同步結果回來不要再 setState
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      const groups = await groupApi.getSuggestedGroups();
      if (!isMountedRef.current) return;

      setSuggestedGroups(groups);
    } catch (error) {
      console.warn("[useSuggestedGroups] load failed", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { suggestedGroups, isLoading, reload };
}
