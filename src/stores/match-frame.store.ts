import { create } from "zustand";

/**
 * 功能總開關：之後想整個關掉「1V1 Match 橘框」功能，把這裡改成 false 即可。
 * false 時 show/toggle 皆為 no-op，覆蓋層也不會渲染。
 */
export const MATCH_FRAME_ENABLED = true;

/** 控制「1V1 Match」全螢幕橘色邊框是否顯示 */
type MatchFrameState = {
  active: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
};

export const useMatchFrameStore = create<MatchFrameState>((set) => ({
  active: false,
  show: () => {
    if (MATCH_FRAME_ENABLED) {
      set({ active: true });
    }
  },
  hide: () => set({ active: false }),
  toggle: () =>
    set((state) => ({
      active: MATCH_FRAME_ENABLED ? !state.active : false,
    })),
}));
