import { apiClient } from "@/src/services/api/http-client";
import type { JoinEventResult } from "../types/events.types";

// 後端 API 還沒好，先用這個開關頂著（與 private.api.ts / group.api.ts 同一套模式）。
// 後端好了改成 false，下面的函式就會走 apiClient 分支，呼叫端完全不用改。
const USE_MOCK = true;

const MOCK_WRITE_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const eventsApi = {
  /**
   * POST /events/:eventId/join
   *
   * 報名活動。Email 通知由**後端**在報名交易成功後寄出，前端不參與寄信：
   * - SMTP / 郵件服務的金鑰不能進 App bundle。
   * - 收件地址必須由後端依登入者從自己的 DB 查出來；讓前端傳 email 等於
   *   開放任何人幫別人報名並寄信。
   * - 重試、退信處理、去重（連點兩下不能寄兩封）都需要伺服器端狀態。
   *
   * 因此這支只送 eventId，不送任何使用者資料（身分走 apiClient 的 Authorization header）。
   * 詳細規格見 docs/api/events-join.md。
   */
  async joinEvent(eventId: string): Promise<JoinEventResult> {
    if (USE_MOCK) {
      await delay(MOCK_WRITE_DELAY_MS);
      return { eventId, notificationQueued: true };
    }

    const { data } = await apiClient.post<JoinEventResult>(
      `/events/${eventId}/join`,
    );

    return data;
  },

  /**
   * DELETE /events/:eventId/join
   *
   * 取消報名。同 joinEvent，request body 為空，身分走 Authorization header。
   * 取消通知信一樣由後端在交易成功後寄出（見 docs/api/events-join.md）。
   *
   * 需要冪等：重複呼叫（網路重試、連點）只能寄一封取消信，
   * 第二次以後回 404 / 409 都算成功，前端不該顯示錯誤。
   */
  async cancelJoin(eventId: string): Promise<void> {
    if (USE_MOCK) {
      await delay(MOCK_WRITE_DELAY_MS);
      return;
    }

    await apiClient.delete(`/events/${eventId}/join`);
  },
};
