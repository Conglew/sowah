/**
 * 後端使用者 profile 回應（GET /users/me、GET /users/{user_uid}、PATCH 回應）。
 * 注意：回應不含 avatar，avatar 只是 PATCH 的「請求」欄位（見 UpdateUserProfileRequest）。
 */
export type UserProfile = {
  user_uid: string;
  user_id: string;
  country: string;
  /** RFC3339 full-date，例如 "2017-07-21" */
  birthday: string;
  /** 自我介紹，可能為 null */
  bio: string | null;
  created_at: string;
  updated_at: string;
};

/** POST /users/me（onboarding 初始化，三個皆必填） */
export type InitUserProfileRequest = {
  country: string;
  user_id: string;
  /** RFC3339 full-date，例如 "2017-07-21" */
  birthday: string;
};

/** PATCH /users/me（部分更新，省略的欄位保持不變） */
export type UpdateUserProfileRequest = {
  avatar?: string | null;
  bio?: string | null;
  country?: string;
  user_id?: string;
  birthday?: string;
};
