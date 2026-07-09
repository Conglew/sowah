import { create } from "zustand";

import { MOCK_PRIVATE_CONVERSATIONS } from "../data/mock-private-conversations";
import type {
  InvitationResponse,
  PrivateConversation,
} from "../types/private.types";

type PrivateStoreState = {
  conversations: PrivateConversation[];

  /** 使用者在聊天室輸入框送出一則文字訊息 */
  sendMessage: (conversationId: string, text: string) => void;

  /** 使用者在邀請卡片按下 Yes / No，會更新該則邀請的回覆狀態，並附帶插入一則自動回覆訊息 */
  respondToInvitation: (
    conversationId: string,
    messageId: string,
    response: InvitationResponse,
  ) => void;

  /** 進入聊天室時呼叫，清空該對話的未讀數字 */
  markConversationRead: (conversationId: string) => void;
};

function buildAutoReplyText(response: InvitationResponse): string {
  return response === "accepted"
    ? "Yes! Accept the Invitation!"
    : "No, maybe next time.";
}

/** 產生訊息 id：時間戳 + 隨機字串，避免同一毫秒內快速連續操作時 id 撞在一起 */
function buildMessageId(conversationId: string, tag: string): string {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${conversationId}-${tag}-${Date.now()}-${randomSuffix}`;
}

/**
 * Private 分頁的單一資料來源。
 * 列表（PrivateListPage）與聊天室（PrivateChatPage）都只讀這裡的 conversations，
 * 不各自維護一份訊息/未讀狀態，避免兩邊資料不同步。
 *
 * 目前資料是本機 mock；接後端時把這三個 action 換成打 API + 重新整理 conversations 即可，
 * 呼叫端（hooks/usePrivateConversations、usePrivateConversation）用法完全不變。
 */
export const usePrivateStore = create<PrivateStoreState>((set) => ({
  conversations: MOCK_PRIVATE_CONVERSATIONS,

  sendMessage: (conversationId, text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    set((state) => ({
      conversations: state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              id: buildMessageId(conversationId, "msg"),
              kind: "text",
              senderId: "me",
              text: trimmedText,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),
    }));
  },

  respondToInvitation: (conversationId, messageId, response) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const targetMessage = conversation.messages.find(
          (message) => message.id === messageId,
        );

        // 回覆沒有變化就不重複插入自動訊息（例如已經按過 Yes 又再按一次 Yes）
        if (!targetMessage?.invitation || targetMessage.invitation.response === response) {
          return conversation;
        }

        const updatedMessages = conversation.messages.map((message) => {
          if (message.id !== messageId || !message.invitation) return message;

          return {
            ...message,
            invitation: { ...message.invitation, response },
          };
        });

        return {
          ...conversation,
          messages: [
            ...updatedMessages,
            {
              id: buildMessageId(conversationId, "auto"),
              kind: "text",
              senderId: "me",
              text: buildAutoReplyText(response),
              isAuto: true,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),
    }));
  },

  markConversationRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) => {
        if (conversation.id !== conversationId || !conversation.unreadCount) {
          return conversation;
        }

        return { ...conversation, unreadCount: 0 };
      }),
    }));
  },
}));
