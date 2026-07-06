/** 後端使用者 profile（/users/me、/users/{user_uid}） */
export type UserProfile = {
  user_uid: string;
  user_id: string;
  country: string;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
};

/** POST /users/me（onboarding 初始化） */
export type InitUserProfileRequest = {
  country: string;
  user_id: string;
};

/** PATCH /users/me（部分更新，省略的欄位保持不變） */
export type UpdateUserProfileRequest = {
  avatar?: string | null;
  country?: string;
  user_id?: string;
};
