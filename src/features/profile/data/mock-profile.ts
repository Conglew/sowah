import type { GalleryMonth, Profile } from "../types/profile.types";

/** 依「當月日期降冪」產生一個月份的假相片 */
function buildMonth(
  key: string,
  year: number,
  month: number,
  monthLabel: string,
  days: number[],
): GalleryMonth {
  return {
    key,
    year,
    month,
    monthLabel,
    photos: days.map((day) => ({
      id: `${key}-${day}`,
      // 佔位圖：用 key+day 當 seed 讓每張穩定不同
      uri: `https://picsum.photos/seed/${key}-${day}/400/400`,
      dayLabel: day,
      takenAt: `${key}-${String(day).padStart(2, "0")}T12:00:00.000Z`,
    })),
  };
}

const gallery: GalleryMonth[] = [
  buildMonth("2026-05", 2026, 5, "May", [7, 6, 5, 4, 3, 2, 1]),
  buildMonth(
    "2026-04",
    2026,
    4,
    "April",
    [30, 29, 26, 25, 22, 21, 20, 19, 14, 13, 10, 9],
  ),
];

/** 自己的完整 profile */
export const MOCK_SELF_PROFILE: Profile = {
  id: "me",
  username: "samijma_184",
  countryCode: "TW",
  avatarUri: "https://picsum.photos/seed/samijma-avatar/200/200",
  bio: "Hi, I'm 24 years old and from Taiwan. I'm currently studying in London and have a background in architecture. Nice to meet you!",
  stats: {
    hostedCount: 14,
    hostedRank: 2,
    attendedCount: 96,
    attendedRank: 28,
  },
  gallery,
  checkIn: [
    { day: 1, reward: 10, state: "claimed" },
    { day: 2, reward: 10, state: "claimed" },
    { day: 3, reward: 20, state: "today" },
    { day: 4, reward: 10, state: "locked" },
    { day: 5, reward: 10, state: "locked" },
    { day: 6, reward: 10, state: "locked" },
    { day: 7, reward: 30, state: "locked" },
  ],
  moreContents: [
    { id: "invite", label: "Friend Invitation Event", icon: "✉", reward: 200 },
    { id: "history", label: "History Record", icon: "🕐" },
  ],
};

/** 別人的 profile：不含 checkIn / moreContents */
export function buildMockOtherProfile(userId: string): Profile {
  return {
    id: userId,
    username: "samijma_184",
    countryCode: "TW",
    avatarUri: "https://picsum.photos/seed/samijma-avatar/200/200",
    bio: "Hi, I'm 24 years old and from Taiwan. I'm currently studying in London and have a background in architecture. Nice to meet you!",
    stats: {
      hostedCount: 14,
      hostedRank: 2,
      attendedCount: 96,
      attendedRank: 28,
    },
    gallery,
    // 刻意不給 checkIn / moreContents
  };
}