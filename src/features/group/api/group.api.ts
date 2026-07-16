import { apiClient } from "@/src/services/api/http-client";
import { MOCK_GROUPS, MOCK_SUGGESTED_GROUPS } from "../data/mock-groups";
import type {
  GroupsPage,
  GroupVisibility,
  SuggestedGroup,
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

      const startIndex = cursor
        ? source.findIndex((group) => group.id === cursor) + 1
        : 0;

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

  /** GET /groups/suggested —「Suggested for you」水平列表 */
  async getSuggestedGroups(): Promise<SuggestedGroup[]> {
    if (USE_MOCK) {
      await delay(MOCK_FETCH_DELAY_MS);
      return MOCK_SUGGESTED_GROUPS;
    }

    const { data } = await apiClient.get<SuggestedGroup[]>("/groups/suggested");
    return data;
  },
};
