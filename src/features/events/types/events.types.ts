import type { UserProfile } from "@/src/features/profile/types";

/**
 * 建立 Topic 相關的 domain 型別。
 * 用字串 union 而不是 boolean（isPublic）：之後若要加 "friends_only" 之類的第三種可見度，
 * 只要擴充這個 union，呼叫端會被 TypeScript 逼著補齊分支，不用把 boolean 全面改掉。
 */
export type TopicPrivacy = "public" | "private";

export const TOPIC_PRIVACY_LABELS: Record<TopicPrivacy, string> = {
  public: "Public",
  private: "Private",
};

/**
 * 活動時長（分鐘）。目前全站固定 30 分鐘，對應 Create Topic 的 "Time (30min)"。
 *
 * 寫成常數而不是散在各處的 30：原生行事曆一定要有結束時間，而「時長」遲早會變成
 * 每場活動可自訂的欄位。到時候只要把 EventTimeRange 的來源從這個常數換成 event 上的欄位，
 * 呼叫端不用動。
 */
export const EVENT_DURATION_MINUTES = 30;

/** 一場活動的起訖時間；行事曆與 UI 共用同一組推導結果，不各算各的 */
export type EventTimeRange = {
  startDate: Date;
  endDate: Date;
};

/** 寫入原生行事曆需要的最小資料 */
export type CalendarEventInput = {
  title: string;
  startDate: Date;
  endDate: Date;
  /** 行事曆事件的備註，目前放討論指引 */
  notes?: string;
};

/**
 * 報名活動的結果。
 *
 * 注意這裡沒有「email」欄位可以由前端指定——通知信的收件地址一律由後端從自己的 DB
 * 依登入者查出來。前端傳 email 給後端寄信等於開放任何人幫別人報名並寄信。
 */
export type JoinEventResult = {
  eventId: string;
  /** 後端是否已排入通知信（純提示用，前端不依賴它做流程判斷） */
  notificationQueued: boolean;
};
export type EventKind = "one-on-one" | "multiple";
export type EventVisibility = "public" | "private";

export type EventResource = {
  event_uid: string;
  creator_uid: string;
  title: string;
  description: string;
  start: string;
  end: string;
  duration_minutes: number;
  kind: EventKind;
  visibility: EventVisibility;
  capacity: number;
  participant_count: number;
  created_at: string;
  updated_at: string;
};

export type CreateEventRequest = {
  title: string;
  description?: string;
  start: string;
  duration_minutes: number;
  kind: EventKind;
  visibility: EventVisibility;
};

export type UpdateEventRequest = Partial<
  Pick<
    CreateEventRequest,
    "title" | "description" | "start" | "duration_minutes" | "visibility"
  >
>;

export type EventParticipant = {
  user_uid: string;
  joined_at: string;
  profile: UserProfile;
};

export type EventParticipantPage = {
  participants: EventParticipant[];
  limit: number;
  offset: number;
  total: number;
};
