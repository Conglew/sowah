import { create } from "zustand";

import { authApi } from "@/src/features/auth/api/auth.api";
import { authService } from "@/src/features/auth/services/auth.service";
import type {
  AuthProvider,
  AuthStatus,
  AuthUser,
} from "@/src/features/auth/types";
import { usersApi } from "@/src/features/profile/api/users.api";
import {
  setAccessToken,
  setOnAuthFailure,
  setTokenRefresher,
} from "@/src/services/api/http-client";
import { tokenStorage } from "@/src/services/auth/token-storage";
import { useProfileStore } from "@/src/stores/profile.store";

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  bootstrap: () => Promise<void>;
  signIn: (provider: AuthProvider) => Promise<void>;
  completeOnboarding: () => void;
  signOut: () => Promise<void>;
};

function isNotFound(error: unknown): boolean {
  return getStatusCode(error) === 404;
}

// 開發期印出 Chat 要用的 userID（就是 user_uid），方便本機用 scripts/gen-usersig.js 簽測試 sig。
// 只在 __DEV__ 生效，正式版不會印出使用者識別碼。
function logChatUserId(user: AuthUser): void {
  if (__DEV__) {
    console.log("[chat] 你的 user_uid（複製這個去 gen-usersig.js）:", user.user_uid);
  }
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }

  return undefined;
}

// 注入 http-client 的 refresh / 登出回呼，避免 http-client 反向 import store
let httpWired = false;

function wireHttpAuth() {
  if (httpWired) {
    return;
  }
  httpWired = true;

  setTokenRefresher(async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const tokens = await authApi.refresh(refreshToken);
    await tokenStorage.setRefreshToken(tokens.refresh_token);
    setAccessToken(tokens.access_token);

    return tokens.access_token;
  });

  setOnAuthFailure(() => {
    void useAuthStore.getState().signOut();
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,

  // App 啟動時呼叫：用 SecureStore 的 refresh_token 還原 session
  bootstrap: async () => {
    wireHttpAuth();
    set({ status: "idle", error: null });

    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      set({ status: "unauthenticated" });
      return;
    }

    try {
      const tokens = await authApi.refresh(refreshToken);
      await tokenStorage.setRefreshToken(tokens.refresh_token);
      setAccessToken(tokens.access_token);

      const user = await authApi.whoami();
      set({ user });
      logChatUserId(user);

      await resolvePostAuth(set);
    } catch {
      await tokenStorage.clear();
      setAccessToken(null);
      set({ user: null, status: "unauthenticated" });
    }
  },

  signIn: async (provider) => {
    wireHttpAuth();
    set({ status: "authenticating", error: null });

    try {
      const result = await authService.signIn(provider);

      await tokenStorage.setRefreshToken(result.tokens.refresh_token);
      setAccessToken(result.tokens.access_token);
      set({ user: result.user });
      logChatUserId(result.user);

      await resolvePostAuth(set);
    } catch (error) {
      // 印出完整錯誤物件到 Metro console，方便定位（原生登入錯誤常帶 code / message）
      console.error("[auth] signIn failed", error);

      await tokenStorage.clear();
      setAccessToken(null);
      set({
        user: null,
        status: "unauthenticated",
        error: error instanceof Error ? error.message : "Sign in failed",
      });
    }
  },

  // profile onboarding（POST /users/me）成功後由畫面呼叫
  completeOnboarding: () => {
    set({ status: "authenticated" });
  },

  signOut: async () => {
    await authService.signOut();
    await tokenStorage.clear();
    setAccessToken(null);
    useProfileStore.getState().clearProfile();
    set({ user: null, status: "unauthenticated", error: null });
  },
}));

// 登入 / 還原成功後：抓 profile 決定進主畫面還是 onboarding
async function resolvePostAuth(
  set: (partial: Partial<AuthState>) => void,
): Promise<void> {
  try {
    const profile = await usersApi.getMe();
    useProfileStore.getState().setProfile(profile);
    set({ status: "authenticated" });
  } catch (error) {
    if (isNotFound(error)) {
      set({ status: "onboarding" });
      return;
    }

    throw error;
  }
}
