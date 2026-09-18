import * as Calendar from "expo-calendar";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import type { CalendarEventInput } from "../types/events.types";

/**
 * 把活動寫進裝置行事曆的結果。
 *
 * `calendarEventId` 是能不能「之後自動刪掉」的關鍵：
 * - 靜默寫入（createEventAsync）一定拿得到 → 取消報名時可自動移除。
 * - 系統對話框（createEventInCalendarAsync）在 Android **永遠回 null**，
 *   OS 連使用者到底存了沒都不告訴呼叫端 → 那種情況只能請使用者自己刪。
 */
export type CalendarSyncResult =
  /** 已寫入，且握有 id（可自動移除） */
  | { status: "saved"; calendarEventId: string }
  /** 已交給系統畫面處理，但拿不到 id（無法自動移除） */
  | { status: "handedOff"; calendarEventId: string | null }
  /** 使用者在系統畫面上取消 */
  | { status: "dismissed" }
  /** 沒有可用的系統新增畫面，改成跳轉到行事曆 App（無法自動帶入內容） */
  | { status: "openedCalendarApp" }
  /** 完全不可用 */
  | { status: "unavailable"; reason: string };

export type CalendarRemoveResult =
  | { status: "removed" }
  /** 那筆事件已經不在行事曆裡（使用者自己刪過了），視同成功 */
  | { status: "alreadyGone" }
  /** 沒有 id 可刪 —— 當初是走系統對話框寫入的（Android） */
  | { status: "noEventId" }
  /** 目前沒有行事曆權限，無法確認也無法刪除 */
  | { status: "noPermission" }
  /** 用 id 抓到的事件跟我們當初建立的對不起來，為了安全不刪 */
  | { status: "mismatched" }
  | { status: "failed"; reason: string };

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

/** 最後手段：開啟系統行事曆 App 並定位到活動當天（無法自動帶入活動內容） */
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
 * 找一本「可以寫入」的行事曆。
 *
 * iOS 有明確的預設行事曆概念，直接用 getDefaultCalendarAsync；
 * Android 沒有，要自己從清單挑：優先主帳號（isPrimary），再退而求其次挑任何
 * allowsModifications 的本機行事曆。挑到唯讀的那本會在寫入時才失敗，所以先過濾掉。
 */
async function findWritableCalendarId(): Promise<string | null> {
  if (Platform.OS === "ios") {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar?.allowsModifications ? defaultCalendar.id : null;
  }

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );
  const writable = calendars.filter((calendar) => calendar.allowsModifications);

  return (
    (writable.find((calendar) => calendar.isPrimary) ?? writable[0])?.id ?? null
  );
}

/** 走系統的「新增活動」畫面（不需要權限），使用者自己按儲存 */
async function addViaSystemDialog(
  input: CalendarEventInput,
): Promise<CalendarSyncResult> {
  const result = await Calendar.createEventInCalendarAsync({
    title: input.title,
    startDate: input.startDate,
    endDate: input.endDate,
    notes: input.notes,
  });

  switch (result.action) {
    case "saved":
      return result.id
        ? { status: "saved", calendarEventId: result.id }
        : { status: "handedOff", calendarEventId: null };
    case "canceled":
    case "deleted":
      return { status: "dismissed" };
    // Android 一律回 done 且 id 為 null：OS 不提供足夠資訊判斷使用者做了什麼
    case "done":
    default:
      return { status: "handedOff", calendarEventId: result.id };
  }
}

/**
 * 把活動加進裝置行事曆。
 *
 * 主要路徑是「取得寫入權限後靜默寫入」，因為只有這條路一定拿得到 calendarEventId，
 * 之後使用者取消報名時才能自動把那筆行事曆事件刪掉（Android 的系統對話框永遠不給 id）。
 *
 * 權限被拒時退回系統新增畫面：至少活動還是進得了行事曆，只是之後要靠使用者自己刪。
 */
export async function addEventToDeviceCalendar(
  input: CalendarEventInput,
): Promise<CalendarSyncResult> {
  const isAvailable = await Calendar.isAvailableAsync().catch(() => false);

  if (!isAvailable) {
    return openCalendarApp(input.startDate);
  }

  try {
    const permission = await Calendar.requestCalendarPermissionsAsync();

    if (permission.granted) {
      const calendarId = await findWritableCalendarId();

      if (calendarId) {
        const calendarEventId = await Calendar.createEventAsync(calendarId, {
          title: input.title,
          startDate: input.startDate,
          endDate: input.endDate,
          notes: input.notes,
        });

        return { status: "saved", calendarEventId };
      }
    }

    // 權限被拒、或找不到可寫入的行事曆：退回系統畫面（不需要權限）
    return await addViaSystemDialog(input);
  } catch (error) {
    console.warn("[event-calendar] 寫入行事曆失敗，改為跳轉行事曆 App", error);
    return openCalendarApp(input.startDate);
  }
}

function toTimestamp(value: string | Date | undefined): number | null {
  if (!value) return null;

  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * 確認用 id 抓回來的事件，真的是我們當初建立的那一筆。
 *
 * 為什麼需要這一步：**Android 的行事曆事件 id 是 content provider 的 row id，
 * 會在事件被刪除後被回收給新事件**。使用者若在行事曆裡刪掉我們建的活動、之後又自己
 * 新增別的事件，那個 id 有機會落到別人身上——這時直接 delete 就是誤刪使用者的資料。
 *
 * 判斷放寬到「標題或開始時間其中一項對得上」：使用者在行事曆裡改標題或挪時間都是
 * 正常操作，不該因此就不敢刪；但兩項都對不上，就幾乎不可能是同一筆。
 */
function isSameEvent(
  fetched: { title?: string; startDate?: string | Date },
  expected: { title: string; startDate: Date },
): boolean {
  const titleMatches = fetched.title === expected.title;

  const fetchedTime = toTimestamp(fetched.startDate);
  // 容許一分鐘誤差：不同來源對秒數的處理不一定一致
  const startMatches =
    fetchedTime !== null &&
    Math.abs(fetchedTime - expected.startDate.getTime()) < 60_000;

  return titleMatches || startMatches;
}

/**
 * 從裝置行事曆移除先前建立的活動。
 *
 * `expected` 用來比對抓回來的是不是同一筆（見 isSameEvent）。
 */
export async function removeEventFromDeviceCalendar(
  calendarEventId: string | null,
  expected: { title: string; startDate: Date },
): Promise<CalendarRemoveResult> {
  if (!calendarEventId) {
    return { status: "noEventId" };
  }

  // 先確認權限。沒有權限時 getEventAsync 也會丟錯，但那個錯不能跟「事件不存在」
  // 混為一談——把沒權限當成「已經不在了」會讓 App 對使用者說謊（宣稱已移除，其實沒有）。
  const permission = await Calendar.getCalendarPermissionsAsync().catch(
    () => null,
  );

  if (!permission?.granted) {
    return { status: "noPermission" };
  }

  let existingEvent: Calendar.Event;

  try {
    existingEvent = await Calendar.getEventAsync(calendarEventId);
  } catch {
    // 使用者自己在行事曆刪掉了。結果與預期一致（行事曆上已經沒有這筆），視同成功。
    return { status: "alreadyGone" };
  }

  if (!isSameEvent(existingEvent, expected)) {
    return { status: "mismatched" };
  }

  try {
    await Calendar.deleteEventAsync(calendarEventId);
    return { status: "removed" };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
