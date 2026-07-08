import { useEffect, useState } from "react";

import { useProfileStore } from "@/src/stores/profile.store";
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
  // self 的真實資料來自後端（登入 / onboarding 後存進 store）
  const backendProfile = useProfileStore((state) => state.profile);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // self：資料同步來自 store，直接組出、不做假延遲，避免 edit 返回時 spinner 閃動
    if (variant === "self") {
      const next: Profile = backendProfile
        ? {
            ...MOCK_SELF_PROFILE,
            id: backendProfile.user_uid,
            username: backendProfile.user_id,
            countryCode: backendProfile.country,
            // bio 可能為 null；統一成空字串，交給畫面層轉「No bio yet.」
            bio: backendProfile.bio ?? "",
          }
        : MOCK_SELF_PROFILE;

      setProfile(next);
      setError(null);
      setIsLoading(false);
      return;
    }

    // other：目前仍是 mock，保留假延遲
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((r) => setTimeout(r, 300)); // 模擬網路延遲

        if (!userId) {
          throw new Error("useProfile: variant 'other' 需要 userId");
        }

        if (!cancelled) setProfile(buildMockOtherProfile(userId));
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
  }, [variant, userId, backendProfile]);

  return { profile, isLoading, error };
}
