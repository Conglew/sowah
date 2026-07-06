import { useEffect, useState } from "react";

import { buildMockOtherProfile, MOCK_SELF_PROFILE } from "../data/mock-profile";
import type { Profile, ProfileVariant } from "../types/profile.types";

type UseProfileArgs = {
  variant: ProfileVariant;
  /** variant === "other" 時必填 */
  userId?: string;
};

type UseProfileResult = {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * 目前回傳 mock。接 API 時只改這支：
 *   self  -> GET /me
 *   other -> GET /users/:userId
 * 畫面層（ProfileView / ProfileCard / Gallery）完全不用動。
 */
export function useProfile({
  variant,
  userId,
}: UseProfileArgs): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: 換成真正的 API 呼叫
        await new Promise((r) => setTimeout(r, 300)); // 模擬網路延遲

        if (variant === "other" && !userId) {
          throw new Error("useProfile: variant 'other' 需要 userId");
        }

        const next =
          variant === "self"
            ? MOCK_SELF_PROFILE
            : buildMockOtherProfile(userId as string);

        if (!cancelled) setProfile(next);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [variant, userId]);

  return { profile, isLoading, error };
}
