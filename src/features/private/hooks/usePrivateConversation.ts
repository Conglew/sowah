import { useCallback, useEffect, useState } from "react";

import type { Message } from "@tencentcloud/chat";

import {
  ChatEvent,
  getChatSDK,
  toPeerUserID,
  toPrivateMessage,
} from "@/src/services/chat";
import { privateApi } from "../api/private.api";
import { USE_CHAT } from "../private.config";
import { usePrivateStore } from "../stores/private.store";
import type { InvitationResponse, PrivateConversation } from "../types/private.types";

// 示範用故意設小一點：samijma_184 的 mock 資料有 5 則訊息，這樣往上滑至少能觸發一次「載入更早訊息」。
const MESSAGES_PAGE_SIZE = 10;

type UsePrivateConversationResult = {
  conversation: PrivateConversation | undefined;
  isLoading: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  /** 接給聊天室「往上滑到頂」時呼叫，載入更早的一批訊息 */
  loadMoreMessages: () => Promise<void>;
  /** 送出一則文字訊息 */
  sendMessage: (text: string) => Promise<void>;
  /** 在邀請卡片按下 Yes / No */
  respondToInvitation: (
    messageId: string,
    response: InvitationResponse,
  ) => Promise<void>;
  /** 進聊天室時呼叫，清空未讀數字 */
  markRead: () => void;
};

/**
 * 聊天室用的單一對話資料 + 訊息分頁 + 寫入動作。
 * 跟 usePrivateConversations 共用同一個 store（conversationsById），
 * 所以送出訊息 / 回覆邀請後，列表會立刻反映最新狀態，不需要手動同步兩份資料。
 *
 * 找不到快取（例如列表分頁還沒載到這個對話）時會直接用 id 查一次，不受列表分頁進度限制；
 * 訊息本身也是分頁的，一開始只給最近幾則，往上滑再呼叫 loadMoreMessages 補更早的。
 */
export function usePrivateConversation(
  conversationId: string | undefined,
): UsePrivateConversationResult {
  const conversation = usePrivateStore((state) =>
    conversationId ? state.conversationsById[conversationId] : undefined,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // 快取裡沒有這個對話時（列表分頁還沒載到它、或直接深連結進來），直接用 id 查一次補進快取。
  useEffect(() => {
    if (!conversationId) {
      setIsLoading(false);
      return;
    }

    const alreadyCached =
      usePrivateStore.getState().conversationsById[conversationId];

    if (alreadyCached) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    privateApi
      .getConversationById(conversationId)
      .then((found) => {
        if (cancelled || !found) return;
        usePrivateStore.getState().upsertConversations([found]);
      })
      .catch((error) => {
        console.warn("[usePrivateConversation] load failed", error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // 即時收訊：這是原本 mock 架構沒有的一塊。訂閱 Chat 的 MESSAGE_RECEIVED，
  // 只挑屬於這個對話的訊息，map 後丟進既有的 appendMessage，列表 / 聊天室會一起更新。
  useEffect(() => {
    if (!USE_CHAT || !conversationId) return;

    const chat = getChatSDK();

    const handler = (event: { data: Message[] }) => {
      const incoming = event.data
        .filter((message) => toPeerUserID(message.conversationID) === conversationId)
        .map(toPrivateMessage);

      for (const message of incoming) {
        usePrivateStore.getState().appendMessage(conversationId, message);
      }
    };

    chat.on(ChatEvent.MESSAGE_RECEIVED, handler);
    return () => chat.off(ChatEvent.MESSAGE_RECEIVED, handler);
  }, [conversationId]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMoreMessages || isLoadingMoreMessages) return;

    const currentConversation =
      usePrivateStore.getState().conversationsById[conversationId];
    const oldestLoadedMessageId = currentConversation?.messages[0]?.id ?? null;

    setIsLoadingMoreMessages(true);

    try {
      const page = await privateApi.getMessagesPage({
        conversationId,
        cursor: oldestLoadedMessageId,
        pageSize: MESSAGES_PAGE_SIZE,
      });

      usePrivateStore.getState().prependMessages(conversationId, page.messages);
      setHasMoreMessages(page.nextCursor !== null);
    } catch (error) {
      console.warn("[usePrivateConversation] loadMoreMessages failed", error);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [conversationId, hasMoreMessages, isLoadingMoreMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!conversationId || !trimmedText) return;

      try {
        const message = await privateApi.sendMessage(conversationId, trimmedText);
        usePrivateStore.getState().appendMessage(conversationId, message);
      } catch (error) {
        console.warn("[usePrivateConversation] sendMessage failed", error);
      }
    },
    [conversationId],
  );

  const respondToInvitation = useCallback(
    async (messageId: string, response: InvitationResponse) => {
      if (!conversationId) return;

      try {
        const autoReply = await privateApi.respondToInvitation(
          conversationId,
          messageId,
          response,
        );

        // null 代表回覆狀態沒變（例如已經接受過又按一次接受），不用插入新訊息
        if (autoReply) {
          usePrivateStore
            .getState()
            .applyInvitationResponse(conversationId, messageId, response, autoReply);
        }
      } catch (error) {
        console.warn("[usePrivateConversation] respondToInvitation failed", error);
      }
    },
    [conversationId],
  );

  const markRead = useCallback(() => {
    if (!conversationId) return;

    // 先樂觀地在畫面上清掉未讀數字，API 呼叫失敗也不影響閱讀體驗，只在背景記錄
    usePrivateStore.getState().clearUnreadCount(conversationId);

    privateApi.markConversationRead(conversationId).catch((error) => {
      console.warn("[usePrivateConversation] markRead failed", error);
    });
  }, [conversationId]);

  return {
    conversation,
    isLoading,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
    respondToInvitation,
    markRead,
  };
}
