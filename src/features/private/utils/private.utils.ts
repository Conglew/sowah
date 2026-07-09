import dayjs from "dayjs";

import type { PrivateConversation, PrivateMessage } from "../types/private.types";

/** 對話中最後一則訊息；空對話回傳 undefined，畫面層需自行處理空狀態 */
export function getLastMessage(
  conversation: PrivateConversation,
): PrivateMessage | undefined {
  return conversation.messages[conversation.messages.length - 1];
}

/**
 * 是否存在「尚未回覆」的邀請。
 * 這是列表顯示「Invite you!! + 橘框」與否的唯一依據，
 * 用當下的 messages 即時算出，不額外存 hasPendingInvitation 欄位，避免兩處資料兜不起來。
 */
export function hasPendingInvitation(conversation: PrivateConversation): boolean {
  return conversation.messages.some(
    (message) => message.kind === "invitation" && !message.invitation?.response,
  );
}

/** 列表列要顯示的最後訊息預覽文字 */
export function getPreviewText(message: PrivateMessage | undefined): string {
  if (!message) return "";
  if (message.kind === "invitation") return "Invitation!!";
  return message.text ?? "";
}

/** 列表右側日期，如 "5/20" */
export function formatListDate(iso: string): string {
  return dayjs(iso).format("M/D");
}

/** 聊天室訊息時間，如 "12:52" */
export function formatMessageTime(iso: string): string {
  return dayjs(iso).format("HH:mm");
}

/** 聊天室日期分隔線文字："Today" / "Yesterday" / "6/10/2026" */
export function formatDateSeparatorLabel(iso: string): string {
  const date = dayjs(iso);

  if (date.isSame(dayjs(), "day")) return "Today";
  if (date.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";

  return date.format("M/D/YYYY");
}

/** 邀請卡片時間文字："Time: 6/10/2026 18:00" */
export function formatInvitationTime(iso: string): string {
  return `Time: ${dayjs(iso).format("M/D/YYYY HH:mm")}`;
}
