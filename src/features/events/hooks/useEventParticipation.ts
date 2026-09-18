import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { eventsApi } from "../api/events.api";
import {
  addEventToDeviceCalendar,
  removeEventFromDeviceCalendar,
  type CalendarRemoveResult,
  type CalendarSyncResult,
} from "../services/event-calendar";
import {
  forgetCalendarEventId,
  getCalendarEventId,
  saveCalendarEventId,
} from "../services/joined-calendar-events";
import { toEventTimeRange } from "../utils/event-datetime";

/** 報名 / 取消需要的活動欄位；只列真正用到的，之後換成正式 Event 型別也不用改這支 */
export type ParticipatableEvent = {
  id: string;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  startTime: string;
  discussionGuide?: string;
};

export type ParticipationAction = "join" | "cancel";

type UseEventParticipationResult = {
  /** 目前正在處理的活動與動作；用來鎖住按鈕並顯示 loading */
  pending: { eventId: string; action: ParticipationAction } | null;
  /**
   * 這個 session 內被改動過的報名狀態（活動 id → 是否已報名）。
   * 疊在 mock 資料的 isJoinedByMe 之上；接後端後改成 refetch / store 即可。
   */
  participationOverrides: Record<string, boolean>;
  joinEvent: (event: ParticipatableEvent) => Promise<void>;
  cancelEvent: (event: ParticipatableEvent) => Promise<void>;
};

/** 行事曆寫入結果對應的提示文字。Android 拿不到最終結果，措辭不能斷定「已加入」。 */
function buildJoinMessage(result: CalendarSyncResult): string {
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
 * 取消結果對應的提示文字。
 * 每一種「沒真的刪掉」的情況都要老實講，不能一律說「已移除」——
 * 使用者信了訊息就不會自己去清，行事曆上會留著一筆早就取消的活動。
 */
function buildCancelMessage(result: CalendarRemoveResult): string {
  switch (result.status) {
    case "removed":
      return "已取消報名，行事曆上的事件也一併移除了";
    case "alreadyGone":
      // 使用者自己先在行事曆刪掉了。結果與預期一致，不用特別提。
      return "已取消報名。";
    case "noEventId":
      return "已取消報名。行事曆上的事件請自行刪除";
    case "noPermission":
      return "已取消報名。App 目前沒有行事曆權限，那筆事件請自行刪除";
    case "mismatched":
      return "已取消報名。行事曆上找不到對應的事件，請自行確認";
    case "failed":
      return "已取消報名，但行事曆上的事件移除失敗，請自行刪除";
  }
}

/** 把 Alert 的兩顆按鈕包成 Promise<boolean>，讓呼叫端可以直接 await */
function confirm(params: {
  title: string;
  message: string;
  confirmText: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(params.title, params.message, [
      { text: "再想想", style: "cancel", onPress: () => resolve(false) },
      {
        text: params.confirmText,
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

/**
 * 活動的報名與取消，含裝置行事曆同步。
 *
 * 兩個流程的失敗都刻意分層處理：
 * - 後端失敗 → 中止，不碰行事曆（狀態才不會前後端不一致）。
 * - 行事曆失敗 → 不影響報名/取消結果，只反映在提示文字上。
 *
 * 順序也是刻意的：報名是「先後端、後行事曆」，取消是「先後端、後行事曆」。
 * 兩者都以後端為準，行事曆是衍生資料，衍生資料失敗不該回滾主資料。
 */
export function useEventParticipation(): UseEventParticipationResult {
  const [pending, setPending] = useState<UseEventParticipationResult["pending"]>(
    null,
  );
  const [participationOverrides, setParticipationOverrides] = useState<
    Record<string, boolean>
  >({});

  const joinEvent = useCallback(
    async (event: ParticipatableEvent) => {
      if (pending !== null) return;

      setPending({ eventId: event.id, action: "join" });

      try {
        await eventsApi.joinEvent(event.id);
      } catch (error) {
        console.warn("[useEventParticipation] join failed", error);
        setPending(null);
        Alert.alert("報名失敗", "請稍後再試一次。");
        return;
      }

      setParticipationOverrides((previous) => ({ ...previous, [event.id]: true }));

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

      // 只有拿得到 id 才記下來——取消時就是靠這個 id 把行事曆事件刪掉
      if (
        (calendarResult.status === "saved" ||
          calendarResult.status === "handedOff") &&
        calendarResult.calendarEventId
      ) {
        await saveCalendarEventId(event.id, calendarResult.calendarEventId);
      }

      setPending(null);
      Alert.alert(event.title, buildJoinMessage(calendarResult));
    },
    [pending],
  );

  const cancelEvent = useCallback(
    async (event: ParticipatableEvent) => {
      if (pending !== null) return;

      // 取消是破壞性操作（名額會被別人補走），先確認再送出
      const confirmed = await confirm({
        title: event.title,
        message: "確定要取消報名嗎？名額會釋出給其他人。",
        confirmText: "取消報名",
      });

      if (!confirmed) return;

      setPending({ eventId: event.id, action: "cancel" });

      try {
        await eventsApi.cancelJoin(event.id);
      } catch (error) {
        console.warn("[useEventParticipation] cancel failed", error);
        setPending(null);
        Alert.alert("取消失敗", "請稍後再試一次。");
        return;
      }

      setParticipationOverrides((previous) => ({ ...previous, [event.id]: false }));

      const calendarEventId = await getCalendarEventId(event.id);
      const { startDate } = toEventTimeRange({
        date: event.date,
        startTime: event.startTime,
      });

      const removeResult = await removeEventFromDeviceCalendar(calendarEventId, {
        title: event.title,
        startDate,
      });

      // 已刪除、早就不在、或抓到的根本不是同一筆 —— 這三種情況這筆對照都沒有意義了。
      // failed / noPermission 才保留，使用者之後補權限或重試時還有 id 可用。
      if (
        removeResult.status !== "failed" &&
        removeResult.status !== "noPermission"
      ) {
        await forgetCalendarEventId(event.id);
      }

      setPending(null);
      Alert.alert(event.title, buildCancelMessage(removeResult));
    },
    [pending],
  );

  return { pending, participationOverrides, joinEvent, cancelEvent };
}
