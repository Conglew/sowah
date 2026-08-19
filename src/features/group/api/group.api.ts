import { apiClient } from "@/src/services/api/http-client";
import { MOCK_GROUPS, MOCK_SUGGESTED_GROUPS } from "../data/mock-groups";
import type {
  GroupsPage,
  GroupVisibility,
  SuggestedGroupsPage,
} from "../types/group.types";
import { sortGroupsByLastMessageDesc } from "../utils/group.utils";

// 後端 API 還沒準備好，先用這個開關頂著（與 private.api.ts 同一套模式）。
// 之後後端好了，把這裡改成 false，下面每支函式就會走 apiClient 那個分支；
// 呼叫端（hooks/畫面）完全不用改。
const USE_MOCK = true;

const MOCK_FETCH_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 假的「後端資料庫」。之後接到「加入群組」「接受邀請」等寫入操作時，
 * 比照 private.api.ts 的 mockDatabase 改成可變動的記憶體資料；
 * 目前只有讀取，直接引用常數即可。接上真的後端後整段可刪。
 */
const mockGroups = MOCK_GROUPS;

function countByVisibility(): Record<GroupVisibility, number> {
  return {
    public: mockGroups.filter((group) => group.visibility === "public").length,
    private: mockGroups.filter((group) => group.visibility === "private").length,
  };
}

export const groupApi = {
  /**
   * GET /groups?visibility=&cursor=&pageSize=&q=
   *
   * cursor 是「上一頁最後一筆群組的 id」，null 代表第一頁。
   * searchQuery 交給後端搜尋（依 name 篩選），理由與 private 列表相同：
   * 分頁載入後前端手上沒有「全部」群組，不能只在已載入的資料裡 filter。
   * counts 是兩個 tab 的總數，隨每一頁回傳（見 GroupsPage 註解）。
   */
  async getGroupsPage(params: {
    visibility: GroupVisibility;
    cursor: string | null;
    pageSize: number;
    searchQuery: string;
  }): Promise<GroupsPage> {
    const { visibility, cursor, pageSize, searchQuery } = params;

    if (USE_MOCK) {
      await delay(MOCK_FETCH_DELAY_MS);

      const normalizedQuery = searchQuery.trim().toLowerCase();

      const source = sortGroupsByLastMessageDesc(mockGroups).filter(
        (group) =>
          group.visibility === visibility &&
          (!normalizedQuery || group.name.toLowerCase().includes(normalizedQuery)),
      );

      const cursorIndex = cursor
        ? source.findIndex((group) => group.id === cursor)
        : -1;

      // cursor 對應的群組找不到（被搜尋條件濾掉／已退出）時 findIndex 回 -1，
      // 直接 +1 會變成 0 → 整個第一頁被當成下一頁重發，清單會出現重複項目。
      if (cursor && cursorIndex === -1) {
        return { groups: [], nextCursor: null, counts: countByVisibility() };
      }

      const startIndex = cursorIndex + 1;
      const pageItems = source.slice(startIndex, startIndex + pageSize);
      const isLastPage = startIndex + pageItems.length >= source.length;

      return {
        groups: pageItems,
        nextCursor: isLastPage ? null : (pageItems[pageItems.length - 1]?.id ?? null),
        counts: countByVisibility(),
      };
    }

    const { data } = await apiClient.get<GroupsPage>("/groups", {
      params: { visibility, cursor, pageSize, q: searchQuery || undefined },
    });

    return data;
  },

  /**
   * GET /groups/suggested?cursor=&pageSize=
   *
   * 「Suggested for you」水平列表，往右滑到底就補下一批。
   * cursor 沿用這個專案的慣例＝「上一頁最後一筆的 id」，null 代表第一頁。
   *
   * 給後端的備註：推薦清單通常是動態產生的，用 id 當 cursor 只有在
   * 「同一次瀏覽期間排序穩定」的前提下才正確。若推薦每次請求都重算，
   * 建議改回傳不透光的 cursor token（內含這次推薦的 snapshot id + offset），
   * 前端這邊完全不用改，只是 cursor 字串的內容不同。
   */
  async getSuggestedGroupsPage(params: {
    cursor: string | null;
    pageSize: number;
  }): Promise<SuggestedGroupsPage> {
    const { cursor, pageSize } = params;

    if (USE_MOCK) {
      await delay(MOCK_FETCH_DELAY_MS);

      const source = MOCK_SUGGESTED_GROUPS;

      const cursorIndex = cursor
        ? source.findIndex((group) => group.id === cursor)
        : -1;

      // 同上：cursor 失效時視為已到底，寧可少給也不要把第一頁重發一次
      if (cursor && cursorIndex === -1) {
        return { groups: [], nextCursor: null };
      }

      const startIndex = cursorIndex + 1;
      const pageItems = source.slice(startIndex, startIndex + pageSize);
      const isLastPage = startIndex + pageItems.length >= source.length;

      return {
        groups: pageItems,
        nextCursor: isLastPage
          ? null
          : (pageItems[pageItems.length - 1]?.id ?? null),
      };
    }

    const { data } = await apiClient.get<SuggestedGroupsPage>("/groups/suggested", {
      params: { cursor, pageSize },
    });

    return data;
  },
};
