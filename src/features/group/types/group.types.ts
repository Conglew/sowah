/** 群組公開性，對應列表上方 Public / Private 兩個切換 tab */
export type GroupVisibility = "public" | "private";

/**
 * 群組的下一場活動（列表 row 下方那條灰色活動列）。
 * 只放列表顯示需要的最小欄位；活動詳情等 group 聊天室 / 活動模組建立後再擴充。
 */
export type GroupUpcomingEvent = {
  title: string;
  /** 活動開始時間（ISO），畫面層用 formatEventSchedule 顯示成 "12/20 9:00" */
  startsAt: string;
  /** 已報名人數 / 名額上限，顯示成 "4/6" */
  participantsCount: number;
  participantsLimit: number;
};

/**
 * 「Your Group」列表一列需要的群組摘要。
 *
 * 注意：這裡的 lastMessageText / lastMessageAt / hasPendingInvitation 是後端直接給的「摘要欄位」，
 * 跟 private 那邊「由 messages 即時算出」的做法不同——group 聊天室模組還沒建立，
 * 列表拿不到 messages，先以摘要欄位呈現。之後 group 訊息模組建好，
 * 再比照 private.utils 的 getLastMessage / hasPendingInvitation 改成即時推導，避免兩份資料不同步。
 */
export type GroupSummary = {
  id: string;
  name: string;
  visibility: GroupVisibility;
  avatarUri: string;
  /** 頭像上的藍色星形徽章（收藏 / 常用群組） */
  isStarred?: boolean;
  /** 未讀訊息數；0 或 undefined 都不顯示徽章 */
  unreadCount?: number;
  /** 列表第二行的最後訊息預覽 */
  lastMessageText?: string;
  /** 最後一則訊息時間（ISO），右側日期與列表排序都依這個 */
  lastMessageAt?: string;
  /** 尚未回覆的群組邀請：顯示 "Invite you!!" + 橘框 + "! +" 提示 */
  hasPendingInvitation?: boolean;
  /** 下一場活動；沒有活動的群組不顯示灰色活動列 */
  upcomingEvent?: GroupUpcomingEvent;
};

/** 「Suggested for you」水平列表的推薦群組卡片 */
export type SuggestedGroup = {
  id: string;
  name: string;
  coverUri: string;
};

/** 群組清單分批載入一頁的結果 */
export type GroupsPage = {
  groups: GroupSummary[];
  /** 下一頁要帶的 cursor；null 代表已經到底 */
  nextCursor: string | null;
  /**
   * 兩個 tab 的群組總數（"Public (1)" / "Private (2)" 括號內數字）。
   * 列表是分頁載入的，前端已載入的筆數不等於總數，所以要由後端隨頁回傳。
   */
  counts: Record<GroupVisibility, number>;
};
