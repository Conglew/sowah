import dayjs from "dayjs";

import type { PrivateConversation } from "../types/private.types";

const now = dayjs();

/** 產生「N 天前的某個時間點」的 ISO 字串。用相對日期而非寫死日期，避免 mock 資料隨時間變得不合理。 */
function pastIso(daysAgo: number, hour: number, minute: number): string {
  return now
    .subtract(daysAgo, "day")
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .toISOString();
}

/** 產生「今天某個時間點」的 ISO 字串，用於今天才發生的訊息（如 terryhou.007 的示範對話）。 */
function todayIso(hour: number, minute: number): string {
  return pastIso(0, hour, minute);
}

/** 產生「未來 N 天後某個時間點」的 ISO 字串，用於邀請的活動時間（scheduledAt）。 */
function futureIso(daysAhead: number, hour: number, minute: number): string {
  return now
    .add(daysAhead, "day")
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .toISOString();
}

/**
 * Private 分頁的 mock 對話清單，對應 Figma 設計稿。
 * 之後接後端時，這份資料改由 GET /private/conversations 取回，
 * 型別（PrivateConversation）與畫面層用法都不需要變動。
 */
export const MOCK_PRIVATE_CONVERSATIONS: PrivateConversation[] = [
  {
    id: "samijma_184",
    username: "samijma_184",
    countryCode: "NL",
    avatarUri: "https://picsum.photos/seed/samijma_184/200/200",
    isFriend: true,
    unreadCount: 11,
    messages: [
      {
        id: "samijma_184-1",
        kind: "text",
        senderId: "samijma_184",
        text: "u good",
        createdAt: pastIso(20, 9, 30),
      },
    ],
  },
  {
    id: "cutty_fram",
    username: "cutty_fram",
    countryCode: "TW",
    avatarUri: "https://picsum.photos/seed/cutty_fram/200/200",
    isFriend: true,
    unreadCount: 2,
    messages: [
      {
        id: "cutty_fram-1",
        kind: "text",
        senderId: "cutty_fram",
        text: "there is a car behind u!",
        createdAt: pastIso(24, 15, 2),
      },
    ],
  },
  {
    id: "terryhou.007",
    username: "terryhou.007",
    countryCode: "BE",
    avatarUri: "https://picsum.photos/seed/terryhou007/200/200",
    messages: [
      {
        id: "terryhou.007-invite-1",
        kind: "invitation",
        senderId: "terryhou.007",
        invitation: {
          beforePhotoUri: "https://picsum.photos/seed/terryhou-tower/300/400",
          afterPhotoUri: "https://picsum.photos/seed/terryhou-cathedral/300/400",
          scheduledAt: futureIso(1, 18, 0),
          // 刻意保持 undefined（尚未回覆）：列表會顯示 "Invite you!!"，
          // 進聊天室按下 Yes/No 後才會即時產生下面兩則示範中的自動回覆訊息。
        },
        createdAt: todayIso(12, 52),
      },
    ],
  },
  {
    id: "vinsmoke_sanji",
    username: "vinsmoke_sanji",
    countryCode: "JP",
    avatarUri: "https://picsum.photos/seed/vinsmoke_sanji/200/200",
    messages: [
      {
        id: "vinsmoke_sanji-1",
        kind: "text",
        senderId: "vinsmoke_sanji",
        text: "u good",
        createdAt: pastIso(19, 11, 10),
      },
    ],
  },
  {
    id: "tonytony_chopperaaaa",
    username: "tonytony_chopperaaaa",
    countryCode: "FR",
    avatarUri: "https://picsum.photos/seed/tonytony_chopperaaaa/200/200",
    messages: [
      {
        id: "tonytony_chopperaaaa-invite-1",
        kind: "invitation",
        senderId: "tonytony_chopperaaaa",
        invitation: {
          beforePhotoUri: "https://picsum.photos/seed/chopper-before/300/400",
          afterPhotoUri: "https://picsum.photos/seed/chopper-after/300/400",
          scheduledAt: futureIso(3, 14, 0),
        },
        createdAt: pastIso(22, 10, 0),
      },
    ],
  },
  {
    id: "nico_robin",
    username: "nico_robin",
    countryCode: "VN",
    avatarUri: "https://picsum.photos/seed/nico_robin/200/200",
    messages: [
      {
        id: "nico_robin-invite-1",
        kind: "invitation",
        senderId: "nico_robin",
        invitation: {
          beforePhotoUri: "https://picsum.photos/seed/robin-before/300/400",
          afterPhotoUri: "https://picsum.photos/seed/robin-after/300/400",
          scheduledAt: futureIso(5, 19, 30),
        },
        createdAt: pastIso(23, 8, 45),
      },
    ],
  },
  {
    id: "jinbe_sea",
    username: "jinbe_sea",
    countryCode: "JP",
    avatarUri: "https://picsum.photos/seed/jinbe_sea/200/200",
    messages: [
      {
        id: "jinbe_sea-1",
        kind: "text",
        senderId: "jinbe_sea",
        text: "Hey! how's going?",
        createdAt: pastIso(24, 20, 0),
      },
    ],
  },
  {
    id: "roronoa_zoro",
    username: "roronoa_zoro",
    countryCode: "BR",
    avatarUri: "https://picsum.photos/seed/roronoa_zoro/200/200",
    unreadCount: 1,
    messages: [
      {
        id: "roronoa_zoro-1",
        kind: "text",
        senderId: "roronoa_zoro",
        text: "let's do it at 13:00",
        createdAt: pastIso(33, 13, 0),
      },
    ],
  },
  {
    id: "nami",
    username: "nami",
    countryCode: "TW",
    avatarUri: "https://picsum.photos/seed/nami/200/200",
    messages: [
      {
        id: "nami-1",
        kind: "text",
        senderId: "nami",
        text: "there is a car behind u!there is a car behind u!there is a car behind u!there is a car behind u!",
        createdAt: pastIso(24, 16, 30),
      },
    ],
  },
];
