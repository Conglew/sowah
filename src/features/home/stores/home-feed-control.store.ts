import { create } from "zustand";

type HomeFeedControlState = {
  resetFeedToken: number;
  requestHomeFeedReset: () => void;
};

export const useHomeFeedControlStore = create<HomeFeedControlState>((set) => ({
  resetFeedToken: 0,

  requestHomeFeedReset: () => {
    set((state) => ({
      resetFeedToken: state.resetFeedToken + 1,
    }));
  },
}));