import type {
  InitUserProfileRequest,
  UpdateUserProfileRequest,
  UserProfile,
  UserSearchPage,
  UserSearchParams,
} from "@/src/features/profile/types";
import { apiClient } from "@/src/services/api/http-client";

export const usersApi = {
  /** 目前使用者的 profile（404 代表尚未 onboarding） */
  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>("/users/me");

    return data;
  },

  /** 初始化 profile（onboarding） */
  async initMe(body: InitUserProfileRequest): Promise<UserProfile> {
    const { data } = await apiClient.post<UserProfile>("/users/me", body);

    return data;
  },

  /** 部分更新 profile */
  async updateMe(body: UpdateUserProfileRequest): Promise<UserProfile> {
    const { data } = await apiClient.patch<UserProfile>("/users/me", body);

    return data;
  },

  /** 依 user_uid 取得他人 profile */
  async getById(userUid: string): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>(
      `/users/${encodeURIComponent(userUid)}`,
    );

    return data;
  },

  /**
   * GET /users/search — 依公開 user_id 子字串搜尋（不分大小寫），分頁回傳。
   *
   * ⚠️ 這支有 rate limit（429）。呼叫端一定要 debounce，而且不要用一兩個字元去查——
   * 子字串比對幾乎等於全表掃描，額度會被打空。狀態碼的語意：
   * - 400 too-many-items：limit 超過後端上限
   * - 429：被限流，畫面必須跟「查無此人」分開顯示，否則使用者會以為對方不存在
   *
   * 分頁用 limit / offset，與 /events/public 同一套（不是 cursor）。
   * limit / offset 在這裡補預設值，避免呼叫端漏給時送出無上限的查詢。
   */
  async search(params: UserSearchParams): Promise<UserSearchPage> {
    const { data } = await apiClient.get<UserSearchPage>("/users/search", {
      params: {
        user_id: params.user_id,
        limit: params.limit ?? 10,
        offset: params.offset ?? 0,
      },
    });

    return data;
  },
};
