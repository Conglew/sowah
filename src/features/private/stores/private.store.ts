import { create } from "zustand";

import type {
  InvitationResponse,
  PrivateConversation,
  PrivateMessage,
} from "../types/private.types";

type PrivateStoreState = {
  /** conversation id -> 目前已知的資料（.messages 可能只是「目前已載入的訊息視窗」，不保證是完整歷史） */
  conversationsById: Record<string, PrivateConversation>;

  /**
   * 使用者目前正開著的聊天室 conversation id（沒開任何聊天室時為 null）。
   * 全域收訊 listener（usePrivateChatSync）用這個判斷：收到的訊息若不是當前對話，才累加未讀。
   */
  activeConversationId: string | null;

  /** 進 / 離開聊天室時登記目前開著的對話（見 usePrivateConversation） */
  setActiveConversationId: (conversationId: string | null) => void;

  /** 用一批新載入 / 更新的對話覆蓋或新增進快取（列表分頁、refresh、getConversationById 都共用這支） */
  upsertConversations: (conversations: PrivateConversation[]) => void;

  /** 把「更早的一批訊息」接到某個對話目前已載入訊息的最前面（聊天室往上滑載入更多用） */
  prependMessages: (
    conversationId: string,
    olderMessages: PrivateMessage[],
  ) => void;

  /** 送出一則新訊息，接到某個對話目前已載入訊息的最後面 */
  appendMessage: (conversationId: string, message: PrivateMessage) => void;

  /** 未讀數字 +1（全域 listener 收到「非當前對話」的新訊息時用；對話不在快取則忽略） */
  incrementUnread: (conversationId: string) => void;

  /** 以 Tencent conversation 的雲端值覆蓋未讀數。 */
  setUnreadCount: (conversationId: string, unreadCount: number) => void;

  /** 更新某則邀請訊息的回覆狀態，並在後面接一則自動回覆訊息 */
  applyInvitationResponse: (
    conversationId: string,
    messageId: string,
    response: InvitationResponse,
    autoReply: PrivateMessage,
  ) => void;

  /** 清空某個對話的未讀數字 */
  clearUnreadCount: (conversationId: string) => void;
  resolveFriendRequest: (conversationId: string, accepted: boolean) => void;
};

/**
 * 合併「快取裡已有的對話」跟「剛從 API 拿到的對話」。
 *
 * 不能直接用 incoming 整個覆蓋過去：incoming 常常只是「訊息視窗」（例如列表分頁 / getConversationById
 * 只給最近幾則），如果聊天室已經往上滑、多載入了更早的訊息，直接覆蓋會把那些訊息憑空弄丟。
 * 所以這裡把新舊訊息依 id 合併（id 相同以 incoming 為準，例如邀請回覆狀態），
 * 再依 createdAt 重新排序，其餘欄位（unreadCount、username...）才直接用 incoming 的最新值。
 */
/** 依 createdAt 由舊到新排序（穩定排序，同一秒的多則維持原本相對順序） */
function sortMessagesByCreatedAt(messages: PrivateMessage[]): PrivateMessage[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** 依 id 去重（後出現的以最新為準，例如邀請回覆狀態更新） */
function dedupeMessagesById(messages: PrivateMessage[]): PrivateMessage[] {
  const byId = new Map<string, PrivateMessage>();
  for (const message of messages) byId.set(message.id, message);
  return Array.from(byId.values());
}

function mergeConversation(
  existing: PrivateConversation | undefined,
  incoming: PrivateConversation,
): PrivateConversation {
  if (!existing) return incoming;

  const messageById = new Map(
    existing.messages.map((message) => [message.id, message]),
  );

  for (const message of incoming.messages) {
    messageById.set(message.id, message);
  }

  const mergedMessages = Array.from(messageById.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  return { ...incoming, messages: mergedMessages };
}

/**
 * Private 分頁的對話快取：key 是 conversation id。
 * 列表分頁、單一對話直接查詢（getConversationById）、聊天室訊息分頁都寫進同一份快取，
 * 不管從哪個畫面先看到某個對話，資料都會合併在這裡，彼此不會各存一份不同步的版本——
 * 這也是為什麼聊天室能開「列表分頁還沒載到」的對話：直接用 id 查、寫進這裡就好，不受列表分頁進度限制。
 *
 * 分頁游標／各種 loading 狀態刻意不放這裡：那是「畫面怎麼分批要資料」的展示邏輯，
 * 交給 usePrivateConversations / usePrivateConversation 這兩個 hook 自己管理（跟 useProfile 同一套慣例），
 * 這支 store 只負責「資料本身」這一件事。
 */
export const usePrivateStore = create<PrivateStoreState>((set) => ({
  conversationsById: {},
  activeConversationId: null,

  setActiveConversationId: (conversationId) => {
    set({ activeConversationId: conversationId });
  },

  upsertConversations: (conversations) => {
    if (conversations.length === 0) return;

    set((state) => {
      const next = { ...state.conversationsById };

      for (const conversation of conversations) {
        next[conversation.id] = mergeConversation(
          next[conversation.id],
          conversation,
        );
      }

      return { conversationsById: next };
    });
  },

  prependMessages: (conversationId, olderMessages) => {
    if (olderMessages.length === 0) return;

    set((state) => {
      const conversation = state.conversationsById[conversationId];
      if (!conversation) return state;

      // 去重 + 依時間排序：olderMessages 理論上比較舊，但仍統一收斂，
      // 避免跟已載入 / 即時收到的訊息時間交錯時亂序（聊天室日期分隔線會因此重複）。
      return {
        conversationsById: {
          ...state.conversationsById,
          [conversationId]: {
            ...conversation,
            messages: sortMessagesByCreatedAt(
              dedupeMessagesById([...olderMessages, ...conversation.messages]),
            ),
          },
        },
      };
    });
  },

  appendMessage: (conversationId, message) => {
    set((state) => {
      const conversation = state.conversationsById[conversationId];
      if (!conversation) return state;

      // 依 id 去重：斷線重連 / 同一則被多處觸發時，避免同一則訊息被塞兩次。
      if (
        conversation.messages.some((existing) => existing.id === message.id)
      ) {
        return state;
      }

      // 接在最後後仍重新排序：即時收到的訊息時間有可能比某些已載入訊息還早
      // （斷線補送、對方時鐘差），不排序的話聊天室的日期分隔線會被切成兩段而重複。
      return {
        conversationsById: {
          ...state.conversationsById,
          [conversationId]: {
            ...conversation,
            messages: sortMessagesByCreatedAt([
              ...conversation.messages,
              message,
            ]),
          },
        },
      };
    });
  },

  incrementUnread: (conversationId) => {
    set((state) => {
      const conversation = state.conversationsById[conversationId];
      if (!conversation) return state;

      return {
        conversationsById: {
          ...state.conversationsById,
          [conversationId]: {
            ...conversation,
            unreadCount: (conversation.unreadCount ?? 0) + 1,
          },
        },
      };
    });
  },

  setUnreadCount: (conversationId, unreadCount) => {
    set((state) => {
      const conversation = state.conversationsById[conversationId];
      if (!conversation || conversation.unreadCount === unreadCount)
        return state;

      return {
        conversationsById: {
          ...state.conversationsById,
          [conversationId]: { ...conversation, unreadCount },
        },
      };
    });
  },

  applyInvitationResponse: (conversationId, messageId, response, autoReply) => {
    set((state) => {
      const conversation = state.conversationsById[conversationId];
      if (!conversation) return state;

      const updatedMessages = conversation.messages.map((message) => {
        if (message.id !== messageId || !message.invitation) return message;
        return { ...message, invitation: { ...message.invitation, response } };
      });

      return {
        conversationsById: {
          ...state.conversationsById,
          [conversationId]: {
            ...conversation,
            messages: [...updatedMessages, autoReply],
          },
        },
      };
    });
  },

  clearUnreadCount: (conversationId) => {
    set((state) => {
      const conversation = state.conversationsById[conversationId];
      if (!conversation || !conversation.unreadCount) return state;

      return {
        conversationsById: {
          ...state.conversationsById,
          [conversationId]: { ...conversation, unreadCount: 0 },
        },
      };
    });
  },

  resolveFriendRequest: (conversationId, accepted) => {
    set((state) => {
      const conversation = state.conversationsById[conversationId];
      if (!conversation) return state;
      return {
        conversationsById: {
          ...state.conversationsById,
          [conversationId]: {
            ...conversation,
            friendRequest: undefined,
            isFriend: accepted,
          },
        },
      };
    });
  },
}));
