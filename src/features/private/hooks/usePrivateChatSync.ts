import { useEffect } from "react";

import type { Message } from "@tencentcloud/chat";

import {
  ChatEvent,
  getChatSDK,
  toPeerUserID,
  toPrivateMessage,
} from "@/src/services/chat";
import { USE_CHAT } from "../private.config";
import { usePrivateStore } from "../stores/private.store";

/**
 * App 層級的 Chat 即時同步。
 *
 * 跟「綁在聊天室裡的 listener」最大的差別是：這支掛在 app root（見 app/_layout.tsx），
 * 整個 App 生命週期只訂閱一次，所以不管使用者現在在哪一頁，收到新訊息都會處理：
 * - append 進對應對話的快取（聊天室正開著就會即時顯示；store 內建 id 去重）
 * - 若不是「目前正開著的對話」→ 未讀 +1（列表紅點 / 預覽即時更新）
 *
 * 只在 USE_CHAT 時生效。對話不在快取（例如對方還沒出現在 mock 清單裡）時，
 * store 的 appendMessage / incrementUnread 會自行忽略，不會炸——等清單改走 Chat 後這塊會自然補齊。
 */
export function usePrivateChatSync(): void {
  useEffect(() => {
    if (!USE_CHAT) return;

    let chat;
    try {
      chat = getChatSDK();
    } catch (error) {
      // 缺 SDKAppID 之類的設定問題：不擋 App 啟動，只記一筆。
      console.warn("[usePrivateChatSync] 取得 Chat SDK 失敗，略過全域收訊訂閱", error);
      return;
    }

    const handler = (event: { data: Message[] }) => {
      const store = usePrivateStore.getState();

      for (const message of event.data) {
        const peerId = toPeerUserID(message.conversationID);
        store.appendMessage(peerId, toPrivateMessage(message));

        if (peerId !== store.activeConversationId) {
          store.incrementUnread(peerId);
        }
      }
    };

    chat.on(ChatEvent.MESSAGE_RECEIVED, handler);
    return () => chat.off(ChatEvent.MESSAGE_RECEIVED, handler);
  }, []);
}
