import * as Calendar from "expo-calendar";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import type { CalendarEventInput } from "../types/events.types";

/**
 * 把活動寫進裝置行事曆的結果。
 *
 * 之所以分這麼細，是因為 Android 與 iOS 給的資訊不一樣，而 UI 不該說謊：
 * Android 的系統對話框關掉後只回 `done`，OS 不告訴我們使用者到底存了沒，
 * 這種情況只能說「已開啟行事曆，請確認」，不能顯示「已加入行事曆」。
 */
export type CalendarSyncResult =
  /** 確定已存入（iOS 回報 saved） */
  | { status: "saved"; calendarEventId: string | null }
  /** 已把資料交給系統畫面，但 OS 不告訴我們最後結果（Android） */
  | { status: "handedOff" }
  /** 使用者在系統畫面上取消或刪除（iOS） */
  | { status: "dismissed" }
  /** 沒有可用的系統新增畫面，改成跳轉到行事曆 App（無法自動帶入內容） */
  | { status: "openedCalendarApp" }
  /** 兩條路都不通 */
  | { status: "unavailable"; reason: string };

/**
 * iOS 的 calshow: scheme 吃的是「自 2001-01-01 UTC 起算的秒數」（Core Foundation 的 epoch），
 * 不是 Unix epoch，差 978307200 秒。
 */
const APPLE_EPOCH_OFFSET_SECONDS = 978_307_200;

function buildCalendarAppUrl(date: Date): string | null {
  const millis = date.getTime();

  if (Platform.OS === "ios") {
    return `calshow:${Math.floor(millis / 1000) - APPLE_EPOCH_OFFSET_SECONDS}`;
  }

  if (Platform.OS === "android") {
    return `content://com.android.calendar/time/${millis}`;
  }

  return null;
}

/** 退而求其次：開啟系統行事曆 App 並定位到活動當天（無法自動帶入活動內容） */
async function openCalendarApp(date: Date): Promise<CalendarSyncResult> {
  const url = buildCalendarAppUrl(date);

  if (!url) {
    return { status: "unavailable", reason: "此平台沒有可開啟的行事曆 App" };
  }

  try {
    await Linking.openURL(url);
    return { status: "openedCalendarApp" };
  } catch (error) {
    return {
      status: "unavailable",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 把活動加進裝置行事曆。
 *
 * 優先叫出「系統原生的新增活動畫面」（createEventInCalendarAsync）：欄位預先填好，
 * 由使用者按下儲存。這條路不需要向使用者索取行事曆寫入權限，也讓使用者看得到
 * 我們要寫什麼進去，被拒絕的機率最低。
 *
 * 系統畫面不可用時（例如 Web，或裝置沒有行事曆 App）才退回跳轉。
 */
export async function addEventToDeviceCalendar(
  input: CalendarEventInput,
): Promise<CalendarSyncResult> {
  const isAvailable = await Calendar.isAvailableAsync().catch(() => false);

  if (!isAvailable) {
    return openCalendarApp(input.startDate);
  }

  try {
    const result = await Calendar.createEventInCalendarAsync({
      title: input.title,
      startDate: input.startDate,
      endDate: input.endDate,
      notes: input.notes,
      // 不指定 calendarId：交給系統畫面讓使用者自己選要寫進哪本行事曆
    });

    switch (result.action) {
      case "saved":
        return { status: "saved", calendarEventId: result.id };
      case "canceled":
      case "deleted":
        return { status: "dismissed" };
      // Android 一律回 done，且 id 永遠是 null——OS 不提供足夠資訊判斷使用者做了什麼
      case "done":
      default:
        return { status: "handedOff" };
    }
  } catch (error) {
    console.warn("[event-calendar] 系統新增畫面失敗，改為跳轉行事曆 App", error);
    return openCalendarApp(input.startDate);
  }
}
