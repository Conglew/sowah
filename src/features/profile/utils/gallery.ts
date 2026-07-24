import type { GalleryPhoto } from "../types/profile.types";

/**
 * 為一批相片依「拍攝日期」產生序號：
 *  - 同一天拍的相片共用同一個序號
 *  - 最舊的一天為 1，往後每換一天 +1
 *
 * 序號範圍即傳入的這批相片；呼叫端以「單一月份的 photos」傳入，
 * 即達成「每個月各自從 1 開始」。
 *
 * 假設 takenAt 為 ISO 字串（YYYY-MM-DD...），以前 10 碼作為日期分組鍵。
 * 回傳以 photo.id 為 key 的序號對照表。
 */
export function getDaySequenceMap(
  photos: GalleryPhoto[],
): Record<string, number> {
  const dayOf = (p: GalleryPhoto) => p.takenAt.slice(0, 10);

  // 取出不重複日期並升冪排序（最舊在前）→ 建立 日期→序號 對照
  const dayToSeq = new Map<string, number>();
  Array.from(new Set(photos.map(dayOf)))
    .sort()
    .forEach((day, index) => dayToSeq.set(day, index + 1));

  const result: Record<string, number> = {};
  for (const photo of photos) {
    result[photo.id] = dayToSeq.get(dayOf(photo)) ?? 0;
  }

  return result;
}
