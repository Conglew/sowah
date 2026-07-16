import dayjs from "dayjs";

import type { GroupSummary, GroupUpcomingEvent } from "../types/group.types";

/** 列表右側日期，如 "12/20"（與 private.utils 的 formatListDate 同格式，feature 之間不互相 import，各自維護） */
export function formatGroupListDate(iso: string): string {
  return dayjs(iso).format("M/D");
}

/** 活動列左側的時間文字，如 "12/20 9:00" */
export function formatEventSchedule(event: GroupUpcomingEvent): string {
  return dayjs(event.startsAt).format("M/D H:mm");
}

/** 活動列右側的人數文字，如 "4/6" */
export function formatEventParticipants(event: GroupUpcomingEvent): string {
  return `${event.participantsCount}/${event.participantsLimit}`;
}

/**
 * 依「最後訊息時間」新到舊排序。
 * 列表畫面跟 mock API 的分頁邏輯要用同一套排序，拆出來共用（比照 private.utils 的做法）。
 */
export function sortGroupsByLastMessageDesc(groups: GroupSummary[]): GroupSummary[] {
  return [...groups].sort((a, b) =>
    (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""),
  );
}
