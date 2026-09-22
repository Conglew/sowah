import { apiClient } from "@/src/services/api/http-client";
import type { MatchingQueueState } from "../types";

const matchPath = (matchUid: string, action: "accept" | "reject") =>
  `/matching/matches/${encodeURIComponent(matchUid)}/${action}`;

export const matchingApi = {
  async enterQueue(): Promise<void> {
    await apiClient.post("/matching/queue");
  },

  async pollQueue(): Promise<MatchingQueueState> {
    const { data } = await apiClient.get<MatchingQueueState>("/matching/queue");
    return data;
  },

  async leaveQueue(): Promise<void> {
    await apiClient.delete("/matching/queue");
  },

  async accept(matchUid: string): Promise<MatchingQueueState> {
    const { data } = await apiClient.post<MatchingQueueState>(
      matchPath(matchUid, "accept"),
    );
    return data;
  },

  async reject(matchUid: string): Promise<void> {
    await apiClient.post(matchPath(matchUid, "reject"));
  },
};
