import TencentCloudChat, { type ChatSDK, type Message } from "@tencentcloud/chat";

import { ENV } from "@/src/config/env";

/**
 * Tencent Cloud Chat（即時通訊 IM）SDK 單例與型別安全的操作封裝。
 *
 * 這支只負責「SDK 生命週期 + 低階操作」，不碰 UI、不碰 Private 分頁的 domain 型別；
 * SDK Message 與 PrivateMessage 之間的轉換交給 chat-mappers.ts，職責分開。
 *
 * SDK 用的是純 JS 版 @tencentcloud/chat（走 WebSocket，無原生模組），
 * 因此不受 New Architecture 影響，iOS / Android / Expo Go(JS 部分) 都能跑。
 */

// SDK 的預設匯出是 namespace 物件，事件名稱／訊息型別列舉都掛在上面。
// 重新導出成具名常數，呼叫端不需要各自 import 這個預設物件。
export const ChatEvent = TencentCloudChat.EVENT;
export const ChatType = TencentCloudChat.TYPES;

/** SDK 各 API 統一回傳 { code, data }，但官方型別是 any，這裡在邊界收斂成具名型別 */
type ChatResult<T> = { code: number; data: T };

export type GetMessageListResult = {
  messageList: Message[];
  /** 下一頁往前拉要帶的游標；對應 Private 分頁的 cursor */
  nextReqMessageID: string;
  /** true 代表這個對話最早的訊息都拉完了 */
  isCompleted: boolean;
};

let chat: ChatSDK | null = null;
let loggedIn = false;

/** 取得（必要時建立）SDK 單例 */
export function getChatSDK(): ChatSDK {
  if (!chat) {
    if (!ENV.chat.sdkAppId) {
      throw new Error(
        "[chat] 缺少 SDKAppID，請在 .env 設定 EXPO_PUBLIC_CHAT_SDK_APP_ID",
      );
    }
    chat = TencentCloudChat.create({ SDKAppID: ENV.chat.sdkAppId });
    // 0 = debug（開發期看得到連線 / 收發 log），1 = release
    chat.setLogLevel(__DEV__ ? 0 : 1);
  }

  return chat;
}

/**
 * login 的 Promise resolve 後，SDK 還要再等 SDK_READY 事件才能安全收發訊息，
 * 這裡把兩步包成一次 await；加 timeout 保底，避免 READY 沒進來時整個卡死。
 */
function waitForSDKReady(sdk: ChatSDK, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      sdk.off(ChatEvent.SDK_READY, finish);
      resolve();
    };

    sdk.on(ChatEvent.SDK_READY, finish);
    setTimeout(finish, timeoutMs);
  });
}

/** 登入 Chat。userSig 由 chat-usersig.ts 提供（測試期本機簽、正式期後端簽） */
export async function loginChat(userID: string, userSig: string): Promise<void> {
  if (loggedIn) return;

  const sdk = getChatSDK();
  const ready = waitForSDKReady(sdk);
  await sdk.login({ userID, userSig });
  await ready;
  loggedIn = true;
}

export async function logoutChat(): Promise<void> {
  if (!chat || !loggedIn) return;
  await chat.logout();
  loggedIn = false;
}

export function isChatLoggedIn(): boolean {
  return loggedIn;
}

/** 分頁往前拉訊息；nextReqMessageID 為 undefined 代表拉最新一批 */
export async function getMessageListPage(params: {
  conversationID: string;
  nextReqMessageID?: string;
}): Promise<GetMessageListResult> {
  const { conversationID, nextReqMessageID } = params;

  const res = (await getChatSDK().getMessageList({
    conversationID,
    nextReqMessageID,
  })) as ChatResult<GetMessageListResult>;

  return res.data;
}

/** 送出一則 C2C 文字訊息，回傳送成功後的 SDK Message */
export async function sendTextMessage(params: {
  to: string;
  text: string;
}): Promise<Message> {
  const sdk = getChatSDK();

  const message = sdk.createTextMessage({
    to: params.to,
    conversationType: ChatType.CONV_C2C,
    payload: { text: params.text },
  });

  const res = (await sdk.sendMessage(message)) as ChatResult<{ message: Message }>;
  return res.data.message;
}

/** 把某個對話標記為已讀 */
export async function setConversationRead(conversationID: string): Promise<void> {
  await getChatSDK().setMessageRead({ conversationID });
}
