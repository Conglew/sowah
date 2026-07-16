/**
 * 使用者頭像檔案資訊（GET /users/me、GET /users/{user_uid}、PATCH、POST 回應內的 avatar 欄位）。
 * 尚未上傳過頭像時，UserProfile.avatar 整體會是 null，不會是這個型別的「空殼」物件。
 */
export type UserAvatar = {
  created_at: string;
  /** 可直接拿來顯示圖片的簽名網址 */
  download_url: string;
  /** download_url 的過期時間，過期後要重新打 GET 拿新的網址，不能快取太久 */
  download_url_expiry_at: string;
  file_uid: string;
  filename: string;
  filesize_bytes: number;
  mime_type: string;
  updated_at: string;
};

/**
 * 後端使用者 profile 回應（GET /users/me、GET /users/{user_uid}、PATCH、POST 回應）。
 * 注意：avatar 這裡是「完整檔案物件（或 null）」，跟 UpdateUserProfileRequest.avatar（PATCH 請求裡的
 * file_uid 字串）不是同一種形狀，不要搞混。
 */
export type UserProfile = {
  user_uid: string;
  user_id: string;
  country: string;
  /** RFC3339 full-date，例如 "2017-07-21" */
  birthday: string;
  /** 自我介紹，可能為 null */
  bio: string | null;
  /** 尚未上傳頭像時為 null */
  avatar: UserAvatar | null;
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
