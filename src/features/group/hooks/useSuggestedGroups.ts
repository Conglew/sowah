import { useCallback, useEffect, useState } from "react";

import { FALLBACK_SUGGESTED_GROUPS } from "../data/fallback-groups";
import type { SuggestedGroup } from "../types/group.types";

/** 推薦 endpoint 尚未提供，目前明確使用 fallback 展示資料。 */
export function useSuggestedGroups() {
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setSuggestedGroups(FALLBACK_SUGGESTED_GROUPS);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { suggestedGroups, isLoading, reload };
}
