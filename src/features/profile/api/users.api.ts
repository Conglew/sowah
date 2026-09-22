import type {
  InitUserProfileRequest,
  UpdateUserProfileRequest,
  UserProfile,
} from "@/src/features/profile/types";
import { apiClient } from "@/src/services/api/http-client";

export type UserSearchPage = {
  limit: number;
  offset: number;
  total: number;
  users: UserProfile[];
};

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

  /** 依公開 user_id 搜尋；後端為不分大小寫的 substring match */
  async search(
    userId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<UserSearchPage> {
    const { data } = await apiClient.get<UserSearchPage>("/users/search", {
      params: {
        user_id: userId,
        limit: params.limit ?? 10,
        offset: params.offset ?? 0,
      },
    });

    return data;
  },
};
