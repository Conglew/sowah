import TencentCloudChat, {
  type ChatSDK,
  type Conversation,
  type Message,
} from "@tencentcloud/chat";

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
/** 進行中的 login；讓同時發生的多次 loginChat 共用同一個請求，不會送出兩次 sdk.login */
let loginPromise: Promise<void> | null = null;

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

    // 被踢下線（同帳號在別裝置登入 / UserSig 失效）後 SDK 已非登入狀態，
    // loggedIn 要同步歸位，否則 isChatLoggedIn() 永遠停在 true，
    // 之後的 loginChat 會被 early return 擋掉而永遠連不回來。
    chat.on(TencentCloudChat.EVENT.KICKED_OUT, () => {
      loggedIn = false;
    });
  }

  return chat;
}

/**
 * login 的 Promise resolve 後，SDK 還要再等 SDK_READY 事件才能安全收發訊息，
 * 這裡把兩步包成一次 await；加 timeout 保底，避免 READY 沒進來時整個卡死。
 */
function waitForSDKReady(sdk: ChatSDK, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    // timeout 要 reject 而不是 resolve：resolve 等於謊報「已就緒」，
    // 呼叫端會把 loggedIn 標成 true，之後 sendMessage / getMessageList 對著沒 ready 的 SDK 發，
    // 錯誤會在很遠的地方才浮現，很難回推原因。
    const timer = setTimeout(() => {
      sdk.off(ChatEvent.SDK_READY, onReady);
      reject(new Error("[chat] 等待 SDK_READY 逾時，連線未就緒"));
    }, timeoutMs);

    const onReady = () => {
      clearTimeout(timer);
      sdk.off(ChatEvent.SDK_READY, onReady);
      resolve();
    };

    sdk.on(ChatEvent.SDK_READY, onReady);
  });
}

/** 登入 Chat。userSig 由 chat-usersig.ts 提供（測試期本機簽、正式期後端簽） */
export async function loginChat(
  userID: string,
  userSig: string,
): Promise<void> {
  const sdk = getChatSDK();
  const currentUserID = sdk.getLoginUser();

  // Metro reload / Fast Refresh 會保留 SDK singleton，但模組內的 loggedIn 可能已重設。
  // 若 Firebase/App 帳號已切換，Tencent Chat 不允許在舊帳號仍登入時直接 login 新帳號，
  // 必須先清掉舊帳號與記憶體中的對話資料。
  if (currentUserID && currentUserID !== userID) {
    await sdk.logout();
    loggedIn = false;
  } else if (currentUserID === userID && sdk.isReady()) {
    loggedIn = true;
    return;
  }

  if (loggedIn) return;
  // auth.store 的 restore / login 兩條路徑都會 fire-and-forget 呼叫這支，
  // 只靠 loggedIn 這個 boolean 擋不住「兩邊幾乎同時進來、當下還是 false」的競態，
  // 所以把進行中的 promise 存起來共用。
  if (loginPromise) return loginPromise;

  loginPromise = (async () => {
    const ready = sdk.isReady() ? Promise.resolve() : waitForSDKReady(sdk);
    await sdk.login({ userID, userSig });
    await ready;
    loggedIn = true;
  })().finally(() => {
    loginPromise = null;
  });

  return loginPromise;
}

export async function logoutChat(): Promise<void> {
  if (!chat || (!loggedIn && !chat.getLoginUser())) return;
  try {
    await chat.logout();
  } finally {
    // 即使 logout 失敗（例如網路斷線）也要把本地狀態歸位，否則下次登入會被 loggedIn 擋住。
    loggedIn = false;
  }
}

export function isChatLoggedIn(): boolean {
  return loggedIn;
}

/** 等待 Chat 完成登入並進入可呼叫訊息 API 的 ready 狀態。 */
export async function waitForChatReady(timeoutMs = 8000): Promise<void> {
  const sdk = getChatSDK();
  if (sdk.isReady()) return;
  await waitForSDKReady(sdk, timeoutMs);
}

/** 取得指定對話在 Tencent 雲端同步後的未讀數。 */
export async function getConversationUnreadCounts(
  conversationIDs: string[],
): Promise<Record<string, number>> {
  if (conversationIDs.length === 0) return {};
  await waitForChatReady();

  const result = (await getChatSDK().getConversationList(
    conversationIDs,
  )) as ChatResult<{ conversationList: Conversation[] }>;

  return Object.fromEntries(
    result.data.conversationList.map((conversation) => [
      conversation.conversationID,
      conversation.unreadCount,
    ]),
  );
}

/** 分頁往前拉訊息；nextReqMessageID 為 undefined 代表拉最新一批 */
export async function getMessageListPage(params: {
  conversationID: string;
  nextReqMessageID?: string;
}): Promise<GetMessageListResult> {
  const { conversationID, nextReqMessageID } = params;

  await waitForChatReady();

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
  await waitForChatReady();
  const sdk = getChatSDK();

  const message = sdk.createTextMessage({
    to: params.to,
    conversationType: ChatType.CONV_C2C,
    payload: { text: params.text },
  });

  const res = (await sdk.sendMessage(message)) as ChatResult<{
    message: Message;
  }>;
  return res.data.message;
}

/** 把某個對話標記為已讀 */
export async function setConversationRead(
  conversationID: string,
): Promise<void> {
  await waitForChatReady();
  await getChatSDK().setMessageRead({ conversationID });
}
