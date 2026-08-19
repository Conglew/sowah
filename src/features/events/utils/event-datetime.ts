import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { EVENT_DURATION_MINUTES, type EventTimeRange } from "../types/events.types";

dayjs.extend(customParseFormat);

/**
 * 由「日期字串 + 時間字串」推導出活動的起訖時間。
 *
 * ⚠️ 時區：`dayjs("2026-08-20 09:00", "YYYY-MM-DD HH:mm")` 解析出來的是「裝置本地時間」。
 * 目前 mock 資料就是以本地時間在描述活動，所以一致。但後端若改成回傳 UTC ISO 字串
 * （建議如此），這支要改成 `dayjs(event.startsAt)` 直接吃 ISO，不要再自己拼字串——
 * 拼字串會讓「使用者在台北報名、飛到東京打開 App」看到不同的時間，行事曆也會寫錯。
 */
export function toEventTimeRange(params: {
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  startTime: string;
}): EventTimeRange {
  const start = dayjs(`${params.date} ${params.startTime}`, "YYYY-MM-DD HH:mm");

  return {
    startDate: start.toDate(),
    endDate: start.add(EVENT_DURATION_MINUTES, "minute").toDate(),
  };
}
