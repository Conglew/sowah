import type { CountryCode } from "@/src/shared/utils/country-flag";

/** 訊息發送者：自己固定為 "me"，其他為對方的 conversation id（目前 id 即 username） */
export type PrivateSenderId = "me" | string;

/** 邀請的回覆狀態；undefined = 尚未回覆（列表 "Invite you!!" 提示即依此判斷） */
export type InvitationResponse = "accepted" | "declined";

export type PrivateInvitation = {
  /** Figma 上可左右切換的兩張相片，中間有交換箭頭 icon */
  beforePhotoUri: string;
  afterPhotoUri: string;
  /** 邀約的活動時間（ISO），非訊息送出時間；畫面層用 formatInvitationTime 顯示 */
  scheduledAt: string;
  response?: InvitationResponse;
};

export type PrivateMessageKind = "text" | "invitation";

export type PrivateMessage = {
  id: string;
  kind: PrivateMessageKind;
  senderId: PrivateSenderId;
  /** kind === "text" 時使用 */
  text?: string;
  /** kind === "invitation" 時使用 */
  invitation?: PrivateInvitation;
  /** 訊息送出時間（ISO），聊天室依此排序、分日期、顯示時間 */
  createdAt: string;
  /** 系統代替使用者自動送出的訊息（如按下 Yes 後的制式回覆），顯示 "Auto" 標籤 */
  isAuto?: boolean;
};

export type PrivateConversation = {
  id: string;
  username: string;
  countryCode: CountryCode;
  avatarUri: string;
  /** 頭像上的星形徽章（好友 / 常聯絡對象） */
  isFriend?: boolean;
  /** 未讀訊息數；0 或 undefined 都不顯示徽章 */
  unreadCount?: number;
  /**
   * 目前「已載入」的訊息，依時間先後排列（永遠包含到最新一則）。
   * 聊天室訊息是分批載入的，所以這裡不保證是這個對話的全部歷史紀錄，
   * 更早的訊息要另外呼叫 getMessagesPage 往前補。
   * 列表要顯示的「最後一則訊息預覽」「是否有未回覆邀請」都由這裡即時算出（見 utils/private.utils.ts），
   * 不額外存一份重複欄位，避免列表與聊天室資料不同步。
   */
  messages: PrivateMessage[];
};

/** 對話清單分批載入一頁的結果 */
export type ConversationsPage = {
  conversations: PrivateConversation[];
  /** 下一頁要帶的 cursor；null 代表已經到底，沒有更多對話了 */
  nextCursor: string | null;
};

/** 單一對話「往前」分批載入更早訊息，一頁的結果 */
export type MessagesPage = {
  /** 這一頁載到的訊息，依時間先後排列（比目前已載入的還要更早） */
  messages: PrivateMessage[];
  /** 再往前一頁要帶的 cursor；null 代表已經到這個對話最早的一則了 */
  nextCursor: string | null;
};
