/**
 * Private 分頁的資料來源開關。集中放這裡，讓 api 與 hook 共用同一份判斷，不會各寫一份而不同步。
 *
 * - USE_MOCK：後端還沒好時用記憶體假資料頂著（清單 + 訊息都走 mock）。
 * - USE_CHAT：訊息收發改走 Tencent Cloud Chat（IM），優先權高於 USE_MOCK，
 *   但目前只切「單一對話內的訊息」（send / getMessagesPage / markRead ＋ 即時收訊），
 *   對話清單仍走 mock（清單需要 App 自己的 profile 欄位，Chat 沒有，屬下一步）。
 *
 * 測試流程：先確認 loginChat 成功 → 再把 USE_CHAT 設為 true。
 */
export const USE_MOCK = true;
export const USE_CHAT = false;
