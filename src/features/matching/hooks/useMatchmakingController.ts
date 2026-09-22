import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

import { ENV } from "@/src/config/env";
import { matchingApi } from "../api/matching.api";
import type { MatchingQueueState } from "../types";
import { useMatchFrameStore } from "@/src/stores/match-frame.store";

const POLL_INTERVAL_MS = 3000;

function getStatus(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;
}

/** 掛在 RootLayout，確保換分頁後配對輪詢仍會繼續。 */
export function useMatchmakingController(): void {
  const active = useMatchFrameStore((state) => state.status === "matching");
  const finishMatching = useMatchFrameStore((state) => state.finishMatching);
  const handledProposalRef = useRef<string | null>(null);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!active) {
      handledProposalRef.current = null;
      return;
    }

    let disposed = false;

    if (ENV.matchingMock) {
      if (__DEV__) console.info("[matchmaking][mock] searching");
      const timer = setTimeout(() => {
        if (disposed) return;
        if (__DEV__) console.info("[matchmaking][mock] connected");
        finishMatching();
        router.push({
          pathname: "/match-call/[matchUid]",
          params: {
            matchUid: "mock-match",
            otherUid: "mock-user",
            mock: "true",
          },
        });
      }, 2200);
      return () => {
        disposed = true;
        clearTimeout(timer);
      };
    }

    const handleState = async (queueState: MatchingQueueState) => {
      if (disposed) return;
      if (__DEV__) console.info("[matchmaking] poll state:", queueState.state);

      if (queueState.state === "searching") {
        handledProposalRef.current = null;
        return;
      }

      if (queueState.state === "matched") {
        finishMatching();
        router.push({
          pathname: "/match-call/[matchUid]",
          params: {
            matchUid: queueState.data.match_uid,
            otherUid: queueState.data.other_uid,
          },
        });
        return;
      }

      const proposal = queueState.data;
      if (handledProposalRef.current === proposal.match_uid) return;
      handledProposalRef.current = proposal.match_uid;

      // 本人已接受時只需繼續 poll，等待另一方接受，不重複跳確認視窗。
      if (proposal.accepted) return;

      const accept = async () => {
        try {
          const nextState = await matchingApi.accept(proposal.match_uid);
          await handleState(nextState);
        } catch (error) {
          console.warn("[matchmaking] accept failed", error);
          handledProposalRef.current = null;
          Alert.alert(
            "無法接受配對",
            getStatus(error) === 409 ? "配對邀請已逾時。" : "請稍後再試。",
          );
        }
      };

      const reject = async () => {
        try {
          await matchingApi.reject(proposal.match_uid);
          handledProposalRef.current = null;
        } catch (error) {
          console.warn("[matchmaking] reject failed", error);
          handledProposalRef.current = null;
        }
      };

      Alert.alert(
        "找到 1V1 配對",
        `請在 ${new Date(proposal.expires_at).toLocaleTimeString()} 前回覆。`,
        [
          { text: "拒絕", style: "destructive", onPress: () => void reject() },
          { text: "接受", onPress: () => void accept() },
        ],
        { cancelable: false },
      );
    };

    const poll = async () => {
      if (disposed || pollingRef.current) return;
      pollingRef.current = true;
      try {
        await handleState(await matchingApi.pollQueue());
      } catch (error) {
        const status = getStatus(error);
        console.warn("[matchmaking] poll failed", error);
        if (status === 409) finishMatching();
      } finally {
        pollingRef.current = false;
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [active, finishMatching]);
}
