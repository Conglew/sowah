import { usePrivateStore } from "../stores/private.store";
import type { PrivateConversation } from "../types/private.types";

type UsePrivateConversationResult = {
  conversation: PrivateConversation | undefined;
  isLoading: boolean;
};

/**
 * 聊天室用的單一對話資料。與 usePrivateConversations 共用同一個 store，
 * 所以在聊天室送出訊息 / 回覆邀請，列表會立刻反映最新狀態，不需要手動同步兩份資料。
 *
 * 目前資料來自本機 mock store（isLoading 恆為 false）；
 * 接後端時改成 GET /private/conversations/:id，形狀不變。
 */
export function usePrivateConversation(
  conversationId: string | undefined,
): UsePrivateConversationResult {
  const conversation = usePrivateStore((state) =>
    conversationId
      ? state.conversations.find((item) => item.id === conversationId)
      : undefined,
  );

  return { conversation, isLoading: false };
}
