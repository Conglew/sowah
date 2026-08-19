# API 規格：報名活動 + Email 通知

> 給後端的實作規格。前端（`src/features/events/api/events.api.ts`）已按此介面寫好，
> 目前 `USE_MOCK = true`；後端完成後把該常數改為 `false` 即可切換，前端其餘程式碼不需異動。

---

## 1. Endpoint

```
POST /events/{eventId}/join
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request body：無。**

這一點是刻意的，不是漏寫：

- **不接受前端傳 email。** 通知信的收件地址必須由後端依 access token 解出的 `user_uid`
  從自己的 DB 查出來。若允許前端指定 email，任何人都能構造請求，幫別人報名並把通知信
  寄到自己指定的信箱（或拿來當免費的寄信管道濫發）。
- **不接受前端傳使用者資料。** 同上，身分一律由 token 決定。

### Response `200 OK`

```json
{
  "eventId": "event-2",
  "notificationQueued": true
}
```

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `eventId` | `string` | 回傳報名成功的活動 id |
| `notificationQueued` | `boolean` | 通知信是否已排入寄送佇列。**純提示用**，前端不依賴它做流程判斷——寄信失敗不應該讓報名失敗 |

### 錯誤

| HTTP | code | 情境 | 前端行為 |
| --- | --- | --- | --- |
| `401` | `unauthorized` | token 無效／過期 | 走既有的 refresh / 重新登入流程 |
| `404` | `event_not_found` | 活動不存在 | 顯示「報名失敗」 |
| `409` | `already_joined` | 已報名過 | 視為成功（見下方冪等性） |
| `409` | `event_full` | 名額已滿 | 顯示「This event is full.」 |
| `410` | `event_expired` | 活動已開始／結束 | 顯示「This event has already started.」 |

錯誤格式沿用專案既有的 API 錯誤慣例。

---

## 2. 冪等性

同一個使用者對同一場活動重複呼叫，**必須**是安全的：

- 第二次以後回 `409 already_joined`（或直接回 `200`，兩者擇一但要一致）。
- **不論如何都不能寄第二封通知信。**

前端已經在 `useJoinEvent` 擋掉連點與並行報名，但那只是 UX 上的第一道防線；
網路重試、App 被殺掉後重開、使用者換裝置都可能造成重送，去重必須在後端。

建議在 `event_participants` 上放 `UNIQUE (event_id, user_id)`，並用
`INSERT ... ON CONFLICT DO NOTHING` 的回傳筆數判斷「這次是不是真的新報名」——
只有真的新報名才丟寄信任務。

---

## 3. Email 通知

### 觸發時機

**在報名交易 commit 之後**，把寄信丟進 queue（不要在交易內同步寄信）：

```
BEGIN;
  INSERT INTO event_participants (event_id, user_id) ... ON CONFLICT DO NOTHING;
  -- 影響 0 筆 => 已報名過，直接 return，不排信
COMMIT;

-- commit 成功後才 enqueue
enqueue(SendJoinConfirmationEmail, { eventId, userId });
```

交易內同步寄信有兩個問題：SMTP 慢會拖長交易時間吃掉連線池；交易若之後 rollback，
信已經寄出去了收不回來。

### 信件內容

| 項目 | 內容 |
| --- | --- |
| 收件者 | 由 `user_id` 查出的 email（DB 為準） |
| 主旨 | `You're in — {event.title}` |
| 內文 | 活動標題、開始時間（**含時區**）、時長、討論指引、參加者人數 |
| 建議附件 | `.ics` 行事曆邀請檔 —— 見下節 |

### 時區

活動時間在信中必須標明時區，或直接用使用者的 profile 時區換算後顯示。
只寫「09:00」而不說是哪個時區，跨國使用者（這個 App 的主要情境）一定會出錯。

DB 一律存 UTC，API 一律回 ISO 8601 字串（例：`2026-08-20T01:00:00Z`）。

### 建議：信件附上 .ics

若信中附一份 `.ics`（`METHOD:REQUEST`），使用者在任何裝置上點開信件都能一鍵加入行事曆，
可以涵蓋「App 內加入行事曆被使用者取消」的情況。這是 email 通道相對於 App 內行事曆
最大的加分項，成本很低（一個純文字附件），建議做。

`UID` 用 `{eventId}@sowah`，重寄時 `SEQUENCE` 遞增，行事曆才會更新既有事件而不是新增一筆。

---

## 4. 活動時間欄位（需要後端配合調整）

目前前端 mock 的活動是 `date: "2026-08-20"` + `startTime: "09:00"` 兩個字串，
沒有結束時間，時長由前端常數 `EVENT_DURATION_MINUTES = 30` 補上。

**後端請直接提供 UTC 的 ISO 字串**：

```json
{
  "id": "event-2",
  "title": "Language Exchange: Travel English",
  "startsAt": "2026-08-20T01:00:00Z",
  "endsAt": "2026-08-20T01:30:00Z"
}
```

理由：拼接本地日期字串會讓「使用者在台北報名、飛到東京打開 App」看到不同的時間，
寫進裝置行事曆的時間也會跟著錯。前端 `src/features/events/utils/event-datetime.ts`
已註記這個切換點，改動範圍只有那一支。

若之後活動時長要可自訂，回傳 `endsAt` 就已經涵蓋，前端不用再改。

---

## 5. 取消報名（下一階段）

前端目前尚未實作，但介面建議先留：

```
DELETE /events/{eventId}/join
```

需要一併考慮的是：使用者按 Join 時我們把事件寫進了他的**裝置**行事曆，
取消報名時 App 應該把那筆刪掉。這需要保存 `calendarEventId`——
但 **Android 拿不到這個 id**（`createEventInCalendarAsync` 在 Android 一律回 `null`），
所以「自動清除行事曆」在 Android 上做不到，只能在取消報名時提示使用者自行刪除。
這是平台限制，規格上先寫明，避免之後被當成 bug。
