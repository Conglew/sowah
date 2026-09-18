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

## 5. 取消報名

```
DELETE /events/{eventId}/join
Authorization: Bearer <access_token>
```

**Request body：無**（理由同 join）。

### Response `204 No Content`

### 錯誤

| HTTP | code | 情境 | 前端行為 |
| --- | --- | --- | --- |
| `401` | `unauthorized` | token 無效／過期 | 走既有的 refresh / 重新登入流程 |
| `404` | `not_joined` | 本來就沒報名 | **視為成功**（見冪等性） |
| `409` | `event_started` | 活動已開始 | 顯示「已開始的活動無法取消」 |

前端已在 `canCancelEvent()` 擋掉已開始的活動（按鈕反灰），但後端仍必須自己驗一次——
使用者的裝置時間可能是錯的，而且前端的檢查任何人都能繞過。

### 冪等性

同 join：重複呼叫必須安全，且**只能寄一封取消信**。

建議用 `DELETE FROM event_participants WHERE ... RETURNING *` 的回傳筆數判斷
「這次是不是真的取消掉了」——有回傳才丟寄信任務，0 筆代表本來就沒報名，直接回 204。

同時記得把活動的已報名人數 -1，讓釋出的名額能被別人補上。

### 取消通知信

| 項目 | 內容 |
| --- | --- |
| 收件者 | 由 `user_id` 查出的 email（DB 為準） |
| 主旨 | `Cancelled — {event.title}` |
| 內文 | 活動標題、原定時間（含時區）、提示可重新報名 |
| 建議附件 | `.ics` 且 `METHOD:CANCEL`，`UID` 與當初的邀請相同、`SEQUENCE` 遞增 |

`METHOD:CANCEL` 的 `.ics` 能讓使用者的郵件行事曆自動把那筆標成已取消，
這是純 email 通道能做到、而 App 做不到的事（App 只能動這台裝置上的行事曆）。

---

## 6. 裝置行事曆的清理（前端，僅供後端了解）

App 在使用者按 Join 時會把活動寫進**他這台裝置**的行事曆，並把
`活動 id → 行事曆事件 id` 存在裝置本機（AsyncStorage）。取消報名時 App 會據此刪除。

兩件事後端需要知道：

- 這份對照表**只存在那台裝置上**。使用者換裝置後，新裝置的行事曆本來就沒有那筆事件，
  所以「取消報名但舊裝置的行事曆還留著」是預期行為，不是 bug。真正要解決這個，
  靠的是上面說的 `METHOD:CANCEL` 郵件。
- App 優先請求行事曆寫入權限並靜默寫入（這樣才拿得到事件 id）；權限被拒時退回
  系統的新增畫面，那條路在 Android 拿不到 id，取消時只能提示使用者自行刪除。
