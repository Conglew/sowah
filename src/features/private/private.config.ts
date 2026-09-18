/**
 * Private 分頁的資料來源開關。集中放這裡，讓 api 與 hook 共用同一份判斷，不會各寫一份而不同步。
 *
 * Friend 清單與 profile 已走 App API；這個開關只控制訊息是否走 Tencent Cloud Chat。
 *
 * 正式串接固定開啟。
 */
export const USE_CHAT = true;
