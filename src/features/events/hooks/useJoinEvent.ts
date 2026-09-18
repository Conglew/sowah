import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { eventsApi } from "../api/events.api";
import { addEventToDeviceCalendar } from "../services/event-calendar";
import type { CalendarSyncResult } from "../services/event-calendar";
import { toEventTimeRange } from "../utils/event-datetime";

/** 報名流程需要的活動欄位；只列真正用到的，之後換成正式的 Event 型別也不用改這支 */
export type JoinableEvent = {
  id: string;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  startTime: string;
  discussionGuide?: string;
};

type UseJoinEventResult = {
  /** 正在報名中的活動 id；用來讓那一顆按鈕顯示 loading 並鎖住重複點擊 */
  joiningEventId: string | null;
  /** 這個 session 內已成功報名的活動 id */
  joinedEventIds: Set<string>;
  leftEventIds: Set<string>;
  joinEvent: (event: JoinableEvent) => Promise<void>;
  leavingEventId: string | null;
  leaveEvent: (event: JoinableEvent) => Promise<void>;
};

/** 行事曆各種結果對應的提示文字。Android 拿不到最終結果，所以措辭不能斷定「已加入」。 */
function buildCalendarMessage(result: CalendarSyncResult): string {
  switch (result.status) {
    case "saved":
      return "已報名，並加入你的行事曆。";
    case "handedOff":
      return "已報名。行事曆已開啟，請確認是否儲存。";
    case "dismissed":
      return "已報名（未加入行事曆）。";
    case "openedCalendarApp":
      return "已報名。已開啟行事曆 App，請手動新增這個時段。";
    case "unavailable":
      return "已報名（無法存取行事曆）。";
  }
}

/**
 * 報名活動 →（後端寄出通知信）→ 加入裝置行事曆。
 *
 * 兩件事的失敗刻意分開處理：
 * 1. 後端報名失敗 → 整個流程中止，不碰行事曆。
 * 2. 行事曆失敗 / 被取消 → **不影響報名結果**，只在提示文字上說明。
 *
 * 順序也是刻意的（先後端、後行事曆）：反過來的話，行事曆寫成功但報名失敗時，
 * 就得回頭刪掉剛剛建立的行事曆事件，而那需要寫入權限與 event id，Android 根本拿不到。
 */
export function useJoinEvent(): UseJoinEventResult {
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [joinedEventIds, setJoinedEventIds] = useState<Set<string>>(new Set());
  const [leftEventIds, setLeftEventIds] = useState<Set<string>>(new Set());
  const [leavingEventId, setLeavingEventId] = useState<string | null>(null);

  const joinEvent = useCallback(
    async (event: JoinableEvent) => {
      // 連點兩下 / 同時報名兩場都擋掉：後端的去重是最後一道防線，不是第一道
      if (joiningEventId !== null || joinedEventIds.has(event.id)) return;

      setJoiningEventId(event.id);

      try {
        await eventsApi.joinEvent(event.id);
      } catch (error) {
        console.warn("[useJoinEvent] join failed", error);
        Alert.alert("報名失敗", "請稍後再試一次。");
        setJoiningEventId(null);
        return;
      }

      setJoinedEventIds((previous) => new Set(previous).add(event.id));
      setLeftEventIds((previous) => {
        const next = new Set(previous);
        next.delete(event.id);
        return next;
      });

      const { startDate, endDate } = toEventTimeRange({
        date: event.date,
        startTime: event.startTime,
      });

      const calendarResult = await addEventToDeviceCalendar({
        title: event.title,
        startDate,
        endDate,
        notes: event.discussionGuide,
      });

      setJoiningEventId(null);
      Alert.alert(event.title, buildCalendarMessage(calendarResult));
    },
    [joinedEventIds, joiningEventId],
  );

  const leaveEvent = useCallback(
    async (event: JoinableEvent) => {
      if (leavingEventId !== null) return;
      setLeavingEventId(event.id);
      try {
        await eventsApi.leaveEvent(event.id);
        setJoinedEventIds((previous) => {
          const next = new Set(previous);
          next.delete(event.id);
          return next;
        });
        setLeftEventIds((previous) => new Set(previous).add(event.id));
        Alert.alert(event.title, "已取消參加活動。");
      } catch (error) {
        console.warn("[useJoinEvent] leave failed", error);
        Alert.alert("取消失敗", "請稍後再試一次。");
      } finally {
        setLeavingEventId(null);
      }
    },
    [leavingEventId],
  );

  return {
    joiningEventId,
    joinedEventIds,
    leftEventIds,
    joinEvent,
    leavingEventId,
    leaveEvent,
  };
}
