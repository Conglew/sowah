import type { UserProfile } from "@/src/features/profile/types";

export type FriendSort = "newest" | "oldest";

export type Friend = {
  user_uid: string;
  friends_since: string;
  profile: UserProfile;
};

export type FriendRequestDirection = "incoming" | "outgoing";
export type FriendRequestStatus = "pending";

export type FriendRequest = {
  user_uid: string;
  created_at: string;
  direction: FriendRequestDirection;
  status: FriendRequestStatus;
  profile: UserProfile;
};

export type FriendsPage = {
  friends: Friend[];
  limit: number;
  offset: number;
  total: number;
};

export type FriendRequestsPage = {
  requests: FriendRequest[];
  limit: number;
  offset: number;
  total: number;
};

export type FriendListParams = {
  sort?: FriendSort;
  limit?: number;
  offset?: number;
};
