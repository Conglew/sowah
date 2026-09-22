import { apiClient } from "@/src/services/api/http-client";
import { friendsApi } from "@/src/features/friends/api/friends.api";
import { assertPaidMembership } from "@/src/features/membership/membership-access";
import { usersApi } from "@/src/features/profile/api/users.api";
import type { CountryCode } from "@/src/shared/utils/country-flag";
import {
  getConversationUnreadCounts,
  getMessageListPage,
  sendTextMessage,
  setConversationRead,
  toConversationID,
  toPrivateMessage,
} from "@/src/services/chat";
import type {
  ConversationsPage,
  InvitationResponse,
  MessagesPage,
  PrivateConversation,
  PrivateMessage,
} from "../types/private.types";
// 好友／個人資料走 App API；訊息收發走 Tencent Cloud Chat。
import { USE_CHAT } from "../private.config";

function toConversation(profile: {
  user_uid: string;
  user_id: string;
  country: string;
  avatar: { download_url: string } | null;
}): PrivateConversation {
  return {
    id: profile.user_uid,
    username: profile.user_id,
    countryCode: profile.country as CountryCode,
    avatarUri: profile.avatar?.download_url ?? "",
    isFriend: true,
    messages: [],
  };
}

function friendRequestToConversation(request: {
  user_uid: string;
  created_at: string;
  profile: {
    user_uid: string;
    user_id: string;
    country: string;
    avatar: { download_url: string } | null;
  };
}): PrivateConversation {
  return {
    ...toConversation(request.profile),
    id: request.user_uid,
    isFriend: false,
    friendRequest: {
      direction: "incoming",
      status: "pending",
      createdAt: request.created_at,
    },
  };
}

async function withLatestMessages(
  conversations: PrivateConversation[],
): Promise<PrivateConversation[]> {
  if (!USE_CHAT || conversations.length === 0) return conversations;

  const conversationIDs = conversations.map((conversation) =>
    toConversationID(conversation.id),
  );
  const unreadCounts = await getConversationUnreadCounts(conversationIDs).catch(
    (error: unknown) => {
      console.warn("[privateApi] 無法同步未讀數", error);
      return {} as Record<string, number>;
    },
  );

  const results = await Promise.allSettled(
    conversations.map(async (conversation) => {
      const page = await getMessageListPage({
        conversationID: toConversationID(conversation.id),
      });
      return {
        ...conversation,
        unreadCount: unreadCounts[toConversationID(conversation.id)] ?? 0,
        messages: page.messageList.map(toPrivateMessage),
      };
    }),
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    console.warn(
      `[privateApi] 無法同步 ${conversations[index].id} 的最新訊息`,
      result.reason,
    );
    return conversations[index];
  });
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

    const offset = cursor ? Number(cursor) : 0;
    const [page, incomingPage] = await Promise.all([
      friendsApi.list({
        sort: "newest",
        limit: pageSize,
        offset: Number.isFinite(offset) ? offset : 0,
      }),
      cursor === null
        ? friendsApi.listIncoming({ sort: "newest", limit: 50, offset: 0 })
        : Promise.resolve(null),
    ]);
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const friendConversations = page.friends
      .map((friend) => toConversation(friend.profile))
      .filter(
        (conversation) =>
          !normalizedQuery ||
          conversation.username.toLowerCase().includes(normalizedQuery),
      );
    const incomingConversations = (incomingPage?.requests ?? [])
      .map(friendRequestToConversation)
      .filter(
        (conversation) =>
          !normalizedQuery ||
          conversation.username.toLowerCase().includes(normalizedQuery),
      );
    const byId = new Map<string, PrivateConversation>();
    for (const conversation of [
      ...incomingConversations,
      ...friendConversations,
    ]) {
      const existing = byId.get(conversation.id);
      byId.set(
        conversation.id,
        existing ? { ...conversation, ...existing } : conversation,
      );
    }
    const nextOffset = page.offset + page.friends.length;

    return {
      conversations: await withLatestMessages(Array.from(byId.values())),
      nextCursor: nextOffset < page.total ? String(nextOffset) : null,
    };
  },

  /**
   * GET /private/conversations/:id
   * 不受列表分頁限制，讓聊天室可以直接開任何一個對話——即使列表還沒分頁載入到它。
   */
  async getConversationById(
    conversationId: string,
  ): Promise<PrivateConversation | null> {
    try {
      return toConversation(await usersApi.getById(conversationId));
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        return null;
      }
      throw error;
    }
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

    if (USE_CHAT) {
      // Chat 的 getMessageList 用 nextReqMessageID 當游標（就是某則訊息的 ID），
      // 語意等同這裡的 cursor＝目前已載入最舊那則訊息的 id；null 代表拉最新一批。
      // 注意：Chat 每批固定回 15 則，不吃 pageSize，這裡刻意忽略 pageSize（保留簽名不變）。
      void pageSize;

      const page = await getMessageListPage({
        conversationID: toConversationID(conversationId),
        nextReqMessageID: cursor ?? undefined,
      });

      return {
        // SDK 回傳已是舊→新排序，符合這裡「一頁訊息依時間先後」的約定
        messages: page.messageList.map(toPrivateMessage),
        nextCursor: page.isCompleted ? null : page.nextReqMessageID,
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
    assertPaidMembership();
    const trimmedText = text.trim();

    if (USE_CHAT) {
      const sent = await sendTextMessage({
        to: conversationId,
        text: trimmedText,
      });
      return toPrivateMessage(sent);
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
    const { data } = await apiClient.post<PrivateMessage | null>(
      `/private/conversations/${conversationId}/invitations/${messageId}/respond`,
      { response },
    );

    return data;
  },

  /** POST /private/conversations/:id/read */
  async markConversationRead(conversationId: string): Promise<void> {
    if (USE_CHAT) {
      await setConversationRead(toConversationID(conversationId));
      return;
    }

    await apiClient.post(`/private/conversations/${conversationId}/read`);
  },
};
