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
  /**
   * @deprecated 原為 tile 顯示的當月日期；grid 現改由 takenAt 動態計算「每日序號」顯示
   * （見 utils/gallery.ts 的 getDaySequenceMap），此欄位已不用於顯示，保留以維持相容。
   */
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
  /** null = 尚未設定頭像；畫面層（ProfileCard、AppFooter…）要 fallback 到預設圖 sowah-avar.svg */
  avatarUri: string | null;
  bio: string;
  stats: ProfileStats;
  gallery: GalleryMonth[];

  // 以下僅 self 會有；other 不回傳，用 optional 而非空陣列，
  // 讓「沒有這段」與「有但為空」在型別上可區分。
  checkIn?: CheckInDay[];
  moreContents?: MoreContentItem[];
};
