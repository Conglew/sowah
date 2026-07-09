import { useMemo } from "react";

import { usePrivateStore } from "../stores/private.store";
import type { PrivateConversation } from "../types/private.types";
import { getLastMessage } from "../utils/private.utils";

type UsePrivateConversationsResult = {
  conversations: PrivateConversation[];
  isLoading: boolean;
};

/**
 * Private 列表用的對話清單，依「最後一則訊息時間」新到舊排序。
 *
 * 目前資料來自本機 mock store，永遠同步載入（isLoading 恆為 false）；
 * 接後端時改成 GET /private/conversations，這裡回傳的形狀（conversations/isLoading）不需要變動，
 * 畫面層（PrivateListPage）完全不用改。
 */
export function usePrivateConversations(): UsePrivateConversationsResult {
  const conversations = usePrivateStore((state) => state.conversations);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aLastMessageAt = getLastMessage(a)?.createdAt ?? "";
      const bLastMessageAt = getLastMessage(b)?.createdAt ?? "";
      return bLastMessageAt.localeCompare(aLastMessageAt);
    });
  }, [conversations]);

  return { conversations: sortedConversations, isLoading: false };
}
