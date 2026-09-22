import { apiClient } from "@/src/services/api/http-client";

export type ChatCredentials = {
  sdkAppId: number;
  userID: string;
  userSig: string;
  expireSecs: number;
  issuedAt: string;
};

const toChatUserID = (userUid: string) => userUid.replaceAll("-", "");

type UserSigResponse = {
  sdk_app_id: number;
  user_id: string;
  user_sig: string;
  expire_secs: number;
  issued_at: string;
};

/**
 * 取得登入 Chat 用的 UserSig。
 *
 * ⚠️ 安全原則：UserSig 用 SECRETKEY 簽出來，SECRETKEY 絕對不能放進前端 App。
 *
 * 固定由後端 POST /chat/user-sig 使用 SECRETKEY 簽發；前端不再讀取測試 UserSig，
 * 避免過期簽章或錯誤 userID 在開發環境悄悄覆蓋正式後端結果。
 */
export async function getChatCredentials(
  userID: string,
): Promise<ChatCredentials> {
  const { data } = await apiClient.post<UserSigResponse>("/chat/user-sig");
  if (data.user_id !== toChatUserID(userID)) {
    throw new Error("[chat] 後端 UserSig 的 user_id 與目前登入者不一致");
  }

  return {
    sdkAppId: data.sdk_app_id,
    userID: data.user_id,
    userSig: data.user_sig,
    expireSecs: data.expire_secs,
    issuedAt: data.issued_at,
  };
}

export async function getUserSig(userID: string): Promise<string> {
  return (await getChatCredentials(userID)).userSig;
}
