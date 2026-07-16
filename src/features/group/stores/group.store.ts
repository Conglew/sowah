import { create } from "zustand";

import type { GroupSummary } from "../types/group.types";

type GroupStoreState = {
  /** group id -> 目前已知的群組摘要 */
  groupsById: Record<string, GroupSummary>;

  /** 用一批新載入 / 更新的群組覆蓋或新增進快取（列表分頁、refresh 共用這支） */
  upsertGroups: (groups: GroupSummary[]) => void;
};

/**
 * Group 分頁的群組快取：key 是 group id，只負責「資料本身」。
 * 分頁游標／loading 狀態交給 useGroups hook 自己管理，與 private.store 同一套慣例。
 * GroupSummary 目前是扁平的摘要欄位（沒有 messages 視窗），
 * 所以 upsert 直接整筆覆蓋即可，不需要 private.store 那種訊息合併邏輯；
 * 之後 group 聊天室模組建立、摘要改成由 messages 推導時，再比照 mergeConversation 處理。
 */
export const useGroupStore = create<GroupStoreState>((set) => ({
  groupsById: {},

  upsertGroups: (groups) => {
    if (groups.length === 0) return;

    set((state) => {
      const next = { ...state.groupsById };

      for (const group of groups) {
        next[group.id] = group;
      }

      return { groupsById: next };
    });
  },
}));
