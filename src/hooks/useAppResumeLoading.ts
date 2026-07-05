import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

type Options = {
  /** 最短顯示時間，避免畫面一閃而過 */
  minVisibleMs?: number;
  /** 回前台要做的非同步工作（重新驗 token、refetch 等），可選 */
  onResume?: () => Promise<void>;
};

export function useAppResumeLoading({
  minVisibleMs = 800,
  onResume,
}: Options = {}) {
  const [isResuming, setIsResuming] = useState(false);
  const hasBeenBackground = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleChange = async (next: AppStateStatus) => {
      if (next === "background") {
        hasBeenBackground.current = true;
        return;
      }

      // 只在「真的離開過背景」再回到 active 時才觸發
      if (next !== "active" || !hasBeenBackground.current) return;
      hasBeenBackground.current = false;

      setIsResuming(true);
      const startedAt = Date.now();

      try {
        await onResume?.();
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, minVisibleMs - elapsed);
        timeoutRef.current = setTimeout(() => setIsResuming(false), remaining);
      }
    };

    const sub = AppState.addEventListener("change", handleChange);
    return () => {
      sub.remove();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [minVisibleMs, onResume]);

  return isResuming;
}