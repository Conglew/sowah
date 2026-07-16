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
    // 這個對話刻意放了 12 則訊息（其他對話大多只有 1 則）：
    // 聊天室一開始只載入最近 10 則（INITIAL_MESSAGES_WINDOW_SIZE），
    // 往上滑可以再觸發一次「載入更早訊息」把剩下 2 則補回來，用來示範訊息的分批載入。
    messages: [
      {
        id: "samijma_184-1",
        kind: "text",
        senderId: "samijma_184",
        text: "hey! long time no chat",
        createdAt: pastIso(32, 10, 0),
      },
      {
        id: "samijma_184-2",
        kind: "text",
        senderId: "me",
        text: "haha yeah, it's been a while",
        createdAt: pastIso(32, 10, 3),
      },
      {
        id: "samijma_184-3",
        kind: "text",
        senderId: "samijma_184",
        text: "how's the new job going?",
        createdAt: pastIso(30, 19, 0),
      },
      {
        id: "samijma_184-4",
        kind: "text",
        senderId: "me",
        text: "pretty good, still settling in",
        createdAt: pastIso(30, 19, 5),
      },
      {
        id: "samijma_184-5",
        kind: "text",
        senderId: "samijma_184",
        text: "nice, let's catch up soon",
        createdAt: pastIso(28, 8, 30),
      },
      {
        id: "samijma_184-6",
        kind: "text",
        senderId: "me",
        text: "for sure!",
        createdAt: pastIso(28, 8, 32),
      },
      {
        id: "samijma_184-7",
        kind: "text",
        senderId: "samijma_184",
        text: "hey, you around this weekend?",
        createdAt: pastIso(25, 18, 10),
      },
      {
        id: "samijma_184-8",
        kind: "text",
        senderId: "me",
        text: "yeah! what's up",
        createdAt: pastIso(25, 18, 12),
      },
      {
        id: "samijma_184-9",
        kind: "text",
        senderId: "samijma_184",
        text: "thinking of checking out that new cafe",
        createdAt: pastIso(23, 9, 0),
      },
      {
        id: "samijma_184-10",
        kind: "text",
        senderId: "me",
        text: "sounds good, count me in",
        createdAt: pastIso(23, 9, 5),
      },
      {
        id: "samijma_184-11",
        kind: "text",
        senderId: "samijma_184",
        text: "did you see the photos I sent?",
        createdAt: pastIso(22, 14, 0),
      },
      {
        id: "samijma_184-12",
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
  // 以下 6 筆純粹是為了讓對話清單超過一頁（LIST_PAGE_SIZE = 10），
  // 才看得出「一開始至少載入 10 筆、往下滑再載入下一頁」的效果。
  {
    id: "usopp_sniper",
    username: "usopp_sniper",
    countryCode: "JP",
    avatarUri: "https://picsum.photos/seed/usopp_sniper/200/200",
    messages: [
      {
        id: "usopp_sniper-1",
        kind: "text",
        senderId: "usopp_sniper",
        text: "did you bring the snacks?",
        createdAt: pastIso(26, 12, 0),
      },
    ],
  },
  {
    id: "franky_cyborg",
    username: "franky_cyborg",
    countryCode: "US",
    avatarUri: "https://picsum.photos/seed/franky_cyborg/200/200",
    messages: [
      {
        id: "franky_cyborg-1",
        kind: "text",
        senderId: "franky_cyborg",
        text: "SUPER! see you there",
        createdAt: pastIso(21, 17, 0),
      },
    ],
  },
  {
    id: "brook_soul",
    username: "brook_soul",
    countryCode: "GB",
    avatarUri: "https://picsum.photos/seed/brook_soul/200/200",
    messages: [
      {
        id: "brook_soul-1",
        kind: "text",
        senderId: "brook_soul",
        text: "yohoho, don't forget your coat",
        createdAt: pastIso(17, 21, 0),
      },
    ],
  },
  {
    id: "ace_fire",
    username: "ace_fire",
    countryCode: "KR",
    avatarUri: "https://picsum.photos/seed/ace_fire/200/200",
    messages: [
      {
        id: "ace_fire-1",
        kind: "text",
        senderId: "ace_fire",
        text: "let's grab food later",
        createdAt: pastIso(14, 13, 0),
      },
    ],
  },
  {
    id: "luffy_strawhat",
    username: "luffy_strawhat",
    countryCode: "JP",
    avatarUri: "https://picsum.photos/seed/luffy_strawhat/200/200",
    messages: [
      {
        id: "luffy_strawhat-1",
        kind: "text",
        senderId: "luffy_strawhat",
        text: "meat!! lol",
        createdAt: pastIso(12, 12, 30),
      },
    ],
  },
  {
    id: "shanks_red",
    username: "shanks_red",
    countryCode: "FR",
    avatarUri: "https://picsum.photos/seed/shanks_red/200/200",
    messages: [
      {
        id: "shanks_red-1",
        kind: "text",
        senderId: "shanks_red",
        text: "safe travels",
        createdAt: pastIso(9, 10, 0),
      },
    ],
  },
];
