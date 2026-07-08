import type { CountryCode } from "@/src/shared/utils/country-flag";

// 讓其他檔案也能從 profile.types 取用 CountryCode（可選，維持相容）
export type { CountryCode };

export type ProfileVariant = "self" | "other";

export type ProfileStats = {
  hostedCount: number;
  hostedRank: number;
  attendedCount: number;
  attendedRank: number;
};

export type CheckInState = "claimed" | "today" | "locked";

export type CheckInDay = {
  day: number; // 1..7
  reward: number;
  state: CheckInState;
};

export type MoreContentItem = {
  id: string;
  label: string;
  /** 先用 emoji / 文字佔位，之後可換成 svg component */
  icon: string;
  reward?: number;
};

export type GalleryPhoto = {
  id: string;
  uri: string;
  /** tile 上顯示的數字（此處為當月日期，依你截圖為降冪） */
  dayLabel: number;
  takenAt: string; // ISO
};

export type GalleryMonth = {
  key: string; // "2026-05"，用來當 list key
  year: number;
  month: number; // 1..12
  monthLabel: string; // "May"
  photos: GalleryPhoto[];
};

export type Profile = {
  id: string;
  username: string;
  /** 國家碼字串（來自後端 country）；顯示時交給 getCountryFlag 轉旗 */
  countryCode: string;
  avatarUri: string;
  bio: string;
  stats: ProfileStats;
  gallery: GalleryMonth[];

  // 以下僅 self 會有；other 不回傳，用 optional 而非空陣列，
  // 讓「沒有這段」與「有但為空」在型別上可區分。
  checkIn?: CheckInDay[];
  moreContents?: MoreContentItem[];
};
