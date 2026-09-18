import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "sowah.joinedCalendarEventIds";

type CalendarEventIdMap = Record<string, string>;

/**
 * 「活動 id → 裝置行事曆事件 id」的對照表。
 *
 * 必須落地保存而不是放在 React state：使用者今天報名、明天重開 App 才取消，
 * 記憶體裡的對照表早就沒了，那筆行事曆事件會變成刪不掉的孤兒。
 *
 * 用單一 key 存整張表（而不是一個活動一個 key）：這張表很小，而且刪除時
 * 只要重寫一次，不用煩惱要列舉哪些 key。
 *
 * ⚠️ 這是「這台裝置上的行事曆狀態」，跟後端的報名狀態是兩回事，不要混用。
 * 使用者換裝置後這張表是空的 —— 那台新裝置本來就沒有那筆行事曆事件，語意正確。
 */

// 讀出來後放記憶體，避免每次都打一次 AsyncStorage
let cachedMap: CalendarEventIdMap | null = null;
// 所有寫入排成一條鏈：read-modify-write 若併發執行（例如同時取消兩場）會互相覆蓋
let writeQueue: Promise<void> = Promise.resolve();

async function readMap(): Promise<CalendarEventIdMap> {
  if (cachedMap) return cachedMap;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cachedMap = raw ? (JSON.parse(raw) as CalendarEventIdMap) : {};
  } catch (error) {
    // 內容壞掉（例如被手動改過）不該讓整個報名流程炸掉，重置成空表即可
    console.warn("[joined-calendar-events] 讀取失敗，重置對照表", error);
    cachedMap = {};
  }

  return cachedMap;
}

function enqueueWrite(mutate: (map: CalendarEventIdMap) => void): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const map = { ...(await readMap()) };
    mutate(map);
    cachedMap = map;

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (error) {
      console.warn("[joined-calendar-events] 寫入失敗", error);
    }
  });

  return writeQueue;
}

/** 取得某場活動對應的行事曆事件 id；沒有（或當初沒拿到 id）回 null */
export async function getCalendarEventId(eventId: string): Promise<string | null> {
  const map = await readMap();
  return map[eventId] ?? null;
}

export function saveCalendarEventId(
  eventId: string,
  calendarEventId: string,
): Promise<void> {
  return enqueueWrite((map) => {
    map[eventId] = calendarEventId;
  });
}

export function forgetCalendarEventId(eventId: string): Promise<void> {
  return enqueueWrite((map) => {
    delete map[eventId];
  });
}
