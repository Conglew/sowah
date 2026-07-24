import { apiClient } from "@/src/services/api/http-client";

/**
 * 取得登入 Chat 用的 UserSig。
 *
 * ⚠️ 安全原則：UserSig 用 SECRETKEY 簽出來，SECRETKEY 絕對不能放進前端 App。
 *
 * - 測試期：在本機用 scripts/gen-usersig.js 產生一組 UserSig，貼進 .env 的
 *   EXPO_PUBLIC_CHAT_TEST_USERSIG，這支就直接回傳它（只在 __DEV__ 生效）。
 * - 正式期：清掉那個 env，改由「你的後端」用 SECRETKEY 簽發，這支會走 apiClient
 *   打你後端的 /chat/usersig（接在你目前還是 mock 的那層 API 上）。
 */
export async function getUserSig(userID: string): Promise<string> {
  const testSig = process.env.EXPO_PUBLIC_CHAT_TEST_USERSIG;

  if (__DEV__ && testSig) {
    return testSig;
  }

  const { data } = await apiClient.post<{ userSig: string }>("/chat/usersig", {
    userID,
  });

  return data.userSig;
}
