import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { ENV } from "@/src/config/env";

export const API_BASE_URL = ENV.apiBaseUrl;

// access_token 只放記憶體，由 auth.store 於登入 / refresh 後設定
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// 以下兩個 injection point 由 auth.store 注入，避免 http-client 反向 import store（循環依賴）
type TokenRefresher = () => Promise<string>;
let tokenRefresher: TokenRefresher | null = null;

export function setTokenRefresher(fn: TokenRefresher | null) {
  tokenRefresher = fn;
}

type AuthFailureHandler = () => void;
let onAuthFailure: AuthFailureHandler | null = null;

export function setOnAuthFailure(fn: AuthFailureHandler | null) {
  onAuthFailure = fn;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    // 401 → 嘗試 refresh 一次 → 重試原請求；refresh 也失敗則觸發登出
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      tokenRefresher
    ) {
      original._retry = true;

      try {
        const newAccessToken = await tokenRefresher();
        original.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return apiClient(original);
      } catch (refreshError) {
        onAuthFailure?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
