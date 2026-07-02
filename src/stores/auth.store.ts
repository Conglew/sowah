import { create } from "zustand";

import { authService } from "@/src/features/auth/services/auth.service";
import type { AuthProvider, AuthStatus, AuthUser } from "@/src/features/auth/types";

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  signIn: (provider: AuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "unauthenticated",
  error: null,

  signIn: async (provider) => {
    set({ status: "authenticating", error: null });

    try {
      const user = await authService.signIn(provider);
      set({ user, status: "authenticated", error: null });
    } catch (error) {
      set({
        user: null,
        status: "unauthenticated",
        error: error instanceof Error ? error.message : "Sign in failed",
      });
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, status: "unauthenticated", error: null });
  },
}));
