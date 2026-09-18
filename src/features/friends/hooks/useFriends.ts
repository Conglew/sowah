import { useCallback, useEffect, useState } from "react";

import { friendsApi } from "../api/friends.api";
import type { Friend, FriendRequest } from "../types/friends.types";

const PAGE_SIZE = 50;

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const params = { sort: "newest" as const, limit: PAGE_SIZE, offset: 0 };
      const [friendsPage, incomingPage, outgoingPage] = await Promise.all([
        friendsApi.list(params),
        friendsApi.listIncoming(params),
        friendsApi.listOutgoing(params),
      ]);
      setFriends(friendsPage.friends);
      setIncoming(incomingPage.requests);
      setOutgoing(outgoingPage.requests);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const accept = useCallback(async (userUid: string) => {
    const friend = await friendsApi.accept(userUid);
    setIncoming((items) => items.filter((item) => item.user_uid !== userUid));
    setFriends((items) => [friend, ...items]);
  }, []);

  const decline = useCallback(async (userUid: string) => {
    await friendsApi.decline(userUid);
    setIncoming((items) => items.filter((item) => item.user_uid !== userUid));
  }, []);

  const cancel = useCallback(async (userUid: string) => {
    await friendsApi.cancel(userUid);
    setOutgoing((items) => items.filter((item) => item.user_uid !== userUid));
  }, []);

  const unfriend = useCallback(async (userUid: string) => {
    await friendsApi.unfriend(userUid);
    setFriends((items) => items.filter((item) => item.user_uid !== userUid));
  }, []);

  const sendRequest = useCallback(async (userUid: string) => {
    const request = await friendsApi.sendRequest(userUid);
    setOutgoing((items) => [request, ...items]);
  }, []);

  return {
    friends,
    incoming,
    outgoing,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load(true),
    accept,
    decline,
    cancel,
    unfriend,
    sendRequest,
  };
}
