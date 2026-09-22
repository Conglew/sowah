import { apiClient } from "@/src/services/api/http-client";
import { assertPaidMembership } from "@/src/features/membership/membership-access";
import type {
  Friend,
  FriendListParams,
  FriendRequest,
  FriendRequestsPage,
  FriendsPage,
} from "../types/friends.types";

export const friendsApi = {
  async list(params: FriendListParams = {}): Promise<FriendsPage> {
    const { data } = await apiClient.get<FriendsPage>("/friends", { params });
    return data;
  },

  async count(): Promise<number> {
    const { data } = await apiClient.get<{ count: number }>("/friends/count");
    return data.count;
  },

  async sendRequest(to: string): Promise<FriendRequest> {
    assertPaidMembership();
    const { data } = await apiClient.post<FriendRequest>("/friends/requests", {
      to,
    });
    return data;
  },

  async listIncoming(
    params: FriendListParams = {},
  ): Promise<FriendRequestsPage> {
    const { data } = await apiClient.get<FriendRequestsPage>(
      "/friends/requests/incoming",
      { params },
    );
    return data;
  },

  async listOutgoing(
    params: FriendListParams = {},
  ): Promise<FriendRequestsPage> {
    const { data } = await apiClient.get<FriendRequestsPage>(
      "/friends/requests/outgoing",
      { params },
    );
    return data;
  },

  async accept(fromUid: string): Promise<Friend> {
    const { data } = await apiClient.post<Friend>(
      `/friends/requests/${encodeURIComponent(fromUid)}/accept`,
    );
    return data;
  },

  async decline(fromUid: string): Promise<void> {
    await apiClient.post(
      `/friends/requests/${encodeURIComponent(fromUid)}/decline`,
    );
  },

  async cancel(toUid: string): Promise<void> {
    await apiClient.delete(`/friends/requests/${encodeURIComponent(toUid)}`);
  },

  async unfriend(otherUid: string): Promise<void> {
    await apiClient.delete(`/friends/${encodeURIComponent(otherUid)}`);
  },
};
