import axios from "axios";

import type {
  AuthTokens,
  AuthUser,
  OidcLoginResult,
} from "@/src/features/auth/types";
import { API_BASE_URL, apiClient } from "@/src/services/api/http-client";

export const authApi = {
  /** 用 Firebase ID token 換後端 JWT */
  async oidcLogin(firebaseIdToken: string): Promise<OidcLoginResult> {
    const { data } = await apiClient.post<OidcLoginResult>("/auth/oidc/login", {
      provider: "firebase",
      token: firebaseIdToken,
    });

    return data;
  },

  /**
   * 換新的 token 組。
   * 刻意用未攔截的 axios（非 apiClient），避免 401 interceptor 遞迴呼叫自己。
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await axios.post<{ tokens: AuthTokens }>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );

    return data.tokens;
  },

  /** 目前使用者的 auth profile */
  async whoami(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>("/auth/whoami");

    return data;
  },
};
