import { apiClient } from "@/src/services/api/http-client";
import { MOCK_PRIVATE_CONVERSATIONS } from "../data/mock-private-conversations";
import type {
  ConversationsPage,
  InvitationResponse,
  MessagesPage,
  PrivateConversation,
  PrivateMessage,
} from "../types/private.types";
import { sortConversationsByLastMessageDesc } from "../utils/private.utils";

// 後端 API 還沒準備好，先用這個開關頂著。
// 之後後端好了，把這裡改成 false，下面每支函式就會走 apiClient 那個分支；
// 呼叫端（store/hooks/畫面）完全不用改。
const USE_MOCK = true;

const MOCK_FETCH_DELAY_MS = 500;
const MOCK_WRITE_DELAY_MS = 200;

// GET 對話（不管是清單那頁還是查單一個）都只給「最近幾則訊息」的預覽視窗，
// 不是這個對話的完整歷史——完整歷史要透過 getMessagesPage 依需要往前補。
// 點進聊天室至少載入 10 則訊息，符合「至少載入 10 則」的需求；
// 訊息數比這個少的對話（大部分 mock 資料都只有 1 則）就是有多少給多少。
const INITIAL_MESSAGES_WINDOW_SIZE = 10;

function withInitialMessagesWindow(
  conversation: PrivateConversation,
): PrivateConversation {
  return {
    ...conversation,
    messages: conversation.messages.slice(-INITIAL_MESSAGES_WINDOW_SIZE),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 假的「後端資料庫」：整個 mock 版本共用同一份、可變動的記憶體資料（深copy 一份，不直接動到原始 mock 常數）。
 * sendMessage / respondToInvitation / markConversationRead 等寫入動作都會真的改到這裡，
 * 所以不管是分頁載入列表、分頁載入訊息、還是直接用 id 查單一對話，讀到的都是同一份、
 * 包含使用者先前操作過的內容——不會因為「重新整理時只回傳最初的假資料」而把示範操作洗掉。
 * 接上真的後端後，這個變數與下面操作它的所有函式都可以整個刪掉。
 */
let mockDatabase: PrivateConversation[] = MOCK_PRIVATE_CONVERSATIONS.map(
  (conversation) => ({
    ...conversation,
    messages: [...conversation.messages],
  }),
);

function findConversation(conversationId: string): PrivateConversation | undefined {
  return mockDatabase.find((conversation) => conversation.id === conversationId);
}

function replaceConversation(next: PrivateConversation): void {
  mockDatabase = mockDatabase.map((conversation) =>
    conversation.id === next.id ? next : conversation,
  );
}

function buildMessageId(conversationId: string, tag: string): string {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${conversationId}-${tag}-${Date.now()}-${randomSuffix}`;
}

function buildAutoReplyText(response: InvitationResponse): string {
  return response === "accepted"
    ? "Yes! Accept the Invitation!"
    : "No, maybe next time.";
}

export const privateApi = {
  /**
   * GET /private/conversations?cursor=&pageSize=&q=
   *
   * cursor 是「上一頁最後一筆對話的 id」，null 代表第一頁。
   * searchQuery 非空時視為交給後端搜尋（依 username 篩選）——這是刻意的：
   * 列表分頁載入之後，前端手上不會有「全部」對話，搜尋不能只在已載入的那幾筆裡面 filter，
   * 不然使用者想找的人可能剛好還沒被載入進來，等於搜尋壞掉。
   *
   * 已知限制（mock 版本沒有處理，真的後端建議用不透光的 cursor token 解決）：
   * 如果在使用者分頁載入到一半時，對話清單的排序因為新訊息而變動，用「id」當 cursor
   * 可能會漏看或重複看到剛好排到 cursor 前後的項目。這裡先記錄下來，不影響目前的展示情境。
   */
  async getConversationsPage(params: {
    cursor: string | null;
    pageSize: number;
    searchQuery: string;
  }): Promise<ConversationsPage> {
    const { cursor, pageSize, searchQuery } = params;

    if (USE_MOCK) {
      await delay(MOCK_FETCH_DELAY_MS);

      const normalizedQuery = searchQuery.trim().toLowerCase();

      const source = sortConversationsByLastMessageDesc(mockDatabase).filter(
        (conversation) =>
          !normalizedQuery ||
          conversation.username.toLowerCase().includes(normalizedQuery),
      );

      const startIndex = cursor
        ? source.findIndex((conversation) => conversation.id === cursor) + 1
        : 0;

      const pageItems = source.slice(startIndex, startIndex + pageSize);
      const isLastPage = startIndex + pageItems.length >= source.length;

      return {
        conversations: pageItems.map(withInitialMessagesWindow),
        nextCursor: isLastPage
          ? null
          : (pageItems[pageItems.length - 1]?.id ?? null),
      };
    }

    const { data } = await apiClient.get<ConversationsPage>(
      "/private/conversations",
      { params: { cursor, pageSize, q: searchQuery || undefined } },
    );

    return data;
  },

  /**
   * GET /private/conversations/:id
   * 不受列表分頁限制，讓聊天室可以直接開任何一個對話——即使列表還沒分頁載入到它。
   */
  async getConversationById(
    conversationId: string,
  ): Promise<PrivateConversation | null> {
    if (USE_MOCK) {
      await delay(MOCK_FETCH_DELAY_MS);
      const found = findConversation(conversationId);
      return found ? withInitialMessagesWindow(found) : null;
    }

    const { data } = await apiClient.get<PrivateConversation>(
      `/private/conversations/${conversationId}`,
    );

    return data;
  },

  /**
   * GET /private/conversations/:id/messages?cursor=&pageSize=
   * cursor 是「目前已載入、最舊那則訊息的 id」；null 代表第一次載入（拿最新的一批）。
   */
  async getMessagesPage(params: {
    conversationId: string;
    cursor: string | null;
    pageSize: number;
  }): Promise<MessagesPage> {
    const { conversationId, cursor, pageSize } = params;

    if (USE_MOCK) {
      await delay(MOCK_FETCH_DELAY_MS);

      const allMessages = findConversation(conversationId)?.messages ?? [];

      const endIndex = cursor
        ? allMessages.findIndex((message) => message.id === cursor)
        : allMessages.length;

      if (endIndex <= 0) {
        return { messages: [], nextCursor: null };
      }

      const startIndex = Math.max(0, endIndex - pageSize);
      const pageItems = allMessages.slice(startIndex, endIndex);

      return {
        messages: pageItems,
        nextCursor: startIndex > 0 ? (pageItems[0]?.id ?? null) : null,
      };
    }

    const { data } = await apiClient.get<MessagesPage>(
      `/private/conversations/${conversationId}/messages`,
      { params: { cursor, pageSize } },
    );

    return data;
  },

  /** POST /private/conversations/:id/messages */
  async sendMessage(
    conversationId: string,
    text: string,
  ): Promise<PrivateMessage> {
    const trimmedText = text.trim();

    if (USE_MOCK) {
      await delay(MOCK_WRITE_DELAY_MS);

      const message: PrivateMessage = {
        id: buildMessageId(conversationId, "msg"),
        kind: "text",
        senderId: "me",
        text: trimmedText,
        createdAt: new Date().toISOString(),
      };

      const conversation = findConversation(conversationId);
      if (conversation) {
        replaceConversation({
          ...conversation,
          messages: [...conversation.messages, message],
        });
      }

      return message;
    }

    const { data } = await apiClient.post<PrivateMessage>(
      `/private/conversations/${conversationId}/messages`,
      { text: trimmedText },
    );

    return data;
  },

  /**
   * POST /private/conversations/:id/invitations/:messageId/respond
   * 回傳自動產生的那則回覆訊息；回覆狀態沒有變化（例如已經接受過又再按一次接受）回傳 null，
   * 呼叫端看到 null 就不用再插入新訊息。
   */
  async respondToInvitation(
    conversationId: string,
    messageId: string,
    response: InvitationResponse,
  ): Promise<PrivateMessage | null> {
    if (USE_MOCK) {
      await delay(MOCK_WRITE_DELAY_MS);

      const conversation = findConversation(conversationId);
      const targetMessage = conversation?.messages.find(
        (message) => message.id === messageId,
      );

      if (
        !conversation ||
        !targetMessage?.invitation ||
        targetMessage.invitation.response === response
      ) {
        return null;
      }

      const autoReply: PrivateMessage = {
        id: buildMessageId(conversationId, "auto"),
        kind: "text",
        senderId: "me",
        text: buildAutoReplyText(response),
        isAuto: true,
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = conversation.messages.map((message) => {
        if (message.id !== messageId || !message.invitation) return message;
        return { ...message, invitation: { ...message.invitation, response } };
      });

      replaceConversation({
        ...conversation,
        messages: [...updatedMessages, autoReply],
      });

      return autoReply;
    }

    const { data } = await apiClient.post<PrivateMessage | null>(
      `/private/conversations/${conversationId}/invitations/${messageId}/respond`,
      { response },
    );

    return data;
  },

  /** POST /private/conversations/:id/read */
  async markConversationRead(conversationId: string): Promise<void> {
    if (USE_MOCK) {
      await delay(150);

      const conversation = findConversation(conversationId);
      if (conversation?.unreadCount) {
        replaceConversation({ ...conversation, unreadCount: 0 });
      }

      return;
    }

    await apiClient.post(`/private/conversations/${conversationId}/read`);
  },
};
