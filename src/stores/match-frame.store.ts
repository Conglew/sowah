import { create } from "zustand";

/**
 * 功能總開關：之後想整個關掉「1V1 Match 橘框」功能，把這裡改成 false 即可。
 * false 時 show/toggle 皆為 no-op，覆蓋層也不會渲染。
 */
export const MATCH_FRAME_ENABLED = true;

export type MatchmakingStatus = "idle" | "matching";

/** 控制 1V1 配對狀態；橘色邊框只是 matching 狀態的全局視覺呈現。 */
type MatchFrameState = {
  status: MatchmakingStatus;
  startMatching: () => void;
  finishMatching: () => void;
};

export const useMatchFrameStore = create<MatchFrameState>((set) => ({
  status: "idle",
  startMatching: () => {
    if (MATCH_FRAME_ENABLED) {
      if (__DEV__) console.info("[matchmaking] status: idle -> matching");
      set({ status: "matching" });
    }
  },
  // 配對成功、失敗、逾時或使用者取消時都呼叫這個 action。
  finishMatching: () => {
    if (__DEV__) console.info("[matchmaking] status -> idle");
    set({ status: "idle" });
  },
}));
