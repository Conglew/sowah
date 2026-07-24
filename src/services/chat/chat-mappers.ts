import { type Message } from "@tencentcloud/chat";

import type { PrivateMessage } from "@/src/features/private/types/private.types";

import { ChatType } from "./chat-sdk";

/**
 * SDK 資料 <-> Private 分頁 domain 型別的轉換。
 *
 * Private 的 conversation.id 目前等於對方的 username；Chat 的 C2C 對話 ID 是 `C2C${peerUserID}`。
 * 這裡假設「Chat userID == Private conversation.id」——如果你系統的 Chat userID 另有一套
 * （例如用 DB 內部 id），改這兩支對應函式即可，其餘程式不用動。
 */

/** Private conversation.id（對方 userID）-> Chat C2C 對話 ID */
export function toConversationID(peerUserID: string): string {
  return `C2C${peerUserID}`;
}

/** Chat C2C 對話 ID -> Private conversation.id（對方 userID） */
export function toPeerUserID(conversationID: string): string {
  return conversationID.startsWith("C2C")
    ? conversationID.slice("C2C".length)
    : conversationID;
}

/**
 * SDK Message -> PrivateMessage。
 * 目前只處理文字（MSG_TEXT）與自訂訊息（MSG_CUSTOM，預留給 invitation）。
 * flow === "out" 代表自己送的，對應 senderId "me"。
 */
export function toPrivateMessage(message: Message): PrivateMessage {
  const base = {
    id: message.ID,
    senderId: message.flow === "out" ? ("me" as const) : message.from,
    createdAt: new Date(message.time * 1000).toISOString(),
  };

  if (message.type === ChatType.MSG_CUSTOM) {
    // TODO(invitation): 之後用 createCustomMessage 承載邀請卡片，
    // 這裡把 payload.data(JSON) 解析回 kind:"invitation" + invitation 欄位。
    const payload = message.payload as { data?: string; description?: string };
    return {
      ...base,
      kind: "text",
      text: payload.description ?? "",
    };
  }

  const payload = message.payload as { text?: string };
  return {
    ...base,
    kind: "text",
    text: payload.text ?? "",
  };
}
