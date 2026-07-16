import dayjs from "dayjs";

import type { GroupSummary, SuggestedGroup } from "../types/group.types";

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

/** 產生「未來 N 天後某個時間點」的 ISO 字串，用於活動開始時間（startsAt）。 */
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
 * Group 分頁的 mock 資料，對應 Figma 設計稿。
 * 之後接後端時，這兩份資料改由 GET /groups、GET /groups/suggested 取回，
 * 型別與畫面層用法都不需要變動。
 */
export const MOCK_SUGGESTED_GROUPS: SuggestedGroup[] = [
  {
    id: "cookkkkk-share",
    name: "cookkkkk.share",
    coverUri: "https://picsum.photos/seed/cookkkkk/200/200",
  },
  {
    id: "arch-design",
    name: "arch. design",
    coverUri: "https://picsum.photos/seed/archdesign/200/200",
  },
  {
    id: "master",
    name: "master",
    coverUri: "https://picsum.photos/seed/master/200/200",
  },
  {
    id: "travel-world-weeee",
    name: "travel-world weeee",
    coverUri: "https://picsum.photos/seed/travelworld/200/200",
  },
  {
    id: "photo-walkers",
    name: "photo walkers",
    coverUri: "https://picsum.photos/seed/photowalk/200/200",
  },
];

export const MOCK_GROUPS: GroupSummary[] = [
  {
    id: "ielts",
    name: "Ielts",
    visibility: "public",
    avatarUri: "https://picsum.photos/seed/ielts/200/200",
    isStarred: true,
    unreadCount: 11,
    lastMessageText: "u good",
    lastMessageAt: pastIso(26, 21, 10),
    upcomingEvent: {
      title: "mock test",
      startsAt: futureIso(4, 9, 0),
      participantsCount: 4,
      participantsLimit: 6,
    },
  },
  {
    id: "seetheworld",
    name: "seetheworld",
    visibility: "public",
    avatarUri: "https://picsum.photos/seed/seetheworld/200/200",
    isStarred: true,
    unreadCount: 2,
    lastMessageText: "there is a car behind u!",
    lastMessageAt: pastIso(30, 18, 42),
    upcomingEvent: {
      title: "The Most Memorable Person you know",
      startsAt: futureIso(4, 9, 0),
      participantsCount: 4,
      participantsLimit: 6,
    },
  },
  {
    id: "chillchat",
    name: "chillchat",
    visibility: "public",
    avatarUri: "https://picsum.photos/seed/chillchat/200/200",
    hasPendingInvitation: true,
    lastMessageAt: pastIso(23, 15, 5),
  },
  {
    id: "uk-international-students",
    name: "uk_international students",
    visibility: "public",
    avatarUri: "https://picsum.photos/seed/ukstudents/200/200",
    lastMessageText: "u good",
    lastMessageAt: pastIso(25, 12, 30),
    upcomingEvent: {
      title: "Weekend Plans",
      startsAt: futureIso(4, 9, 0),
      participantsCount: 4,
      participantsLimit: 6,
    },
  },
  {
    id: "flatmates",
    name: "flatmates",
    visibility: "private",
    avatarUri: "https://picsum.photos/seed/flatmates/200/200",
    isStarred: true,
    unreadCount: 3,
    lastMessageText: "rent split for next month",
    lastMessageAt: pastIso(2, 20, 15),
  },
  {
    id: "weekend-hikers",
    name: "weekend hikers",
    visibility: "private",
    avatarUri: "https://picsum.photos/seed/hikers/200/200",
    lastMessageText: "see u at the station!",
    lastMessageAt: pastIso(5, 8, 45),
    upcomingEvent: {
      title: "Snowdon day trip",
      startsAt: futureIso(6, 7, 30),
      participantsCount: 5,
      participantsLimit: 8,
    },
  },
];
