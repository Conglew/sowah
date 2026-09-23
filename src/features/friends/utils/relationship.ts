import type { Friend, FriendRequest } from "../types/friends.types";

/**
 * 搜尋結果裡某個人跟我目前的關係。
 *
 * 搜尋 API 回的是乾淨的 UserProfile，不帶任何關係資訊——
 * 沒有這層推導，使用者會對已經是好友的人再按一次「加好友」，然後吃到後端的錯誤。
 */
export type UserRelationship =
  | "self"
  | "friend"
  | "request-sent"
  | "request-received"
  | "none";

/**
 * 用手上已載入的好友／邀請清單建一張查詢表。
 *
 * ⚠️ 這份判斷的準確度取決於 useFriends 載了幾筆（目前只抓第一頁 50 筆）。
 * 好友數超過那個量時，第 51 位以後的好友在搜尋結果裡會被判成 "none"，
 * 按下去才由後端擋。要真正解決得靠後端在搜尋結果上帶關係欄位。
 */
export function buildRelationshipLookup(params: {
  currentUserUid?: string;
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}): (userUid: string) => UserRelationship {
  const friendUids = new Set(params.friends.map((friend) => friend.user_uid));
  const incomingUids = new Set(
    params.incoming.map((request) => request.user_uid),
  );
  const outgoingUids = new Set(
    params.outgoing.map((request) => request.user_uid),
  );

  return (userUid) => {
    if (params.currentUserUid && userUid === params.currentUserUid) {
      return "self";
    }

    // 順序有意義：已成立的好友關係要蓋過殘留的邀請紀錄
    if (friendUids.has(userUid)) return "friend";
    if (incomingUids.has(userUid)) return "request-received";
    if (outgoingUids.has(userUid)) return "request-sent";

    return "none";
  };
}
