import type { AuthProvider, AuthUser } from "@/src/features/auth/types";

/**
 * Auth service 介面。
 * UI 與 store 只依賴這個 interface，不直接碰 Firebase / OAuth SDK。
 *
 * 之後接真的登入時：新增 firebase-auth.service.ts（或放在
 * src/services/firebase/）實作同一個 AuthService，再把檔尾的
 * `authService` export 換成該實作即可，store 與 UI 完全不用動。
 */
export interface AuthService {
  signIn(provider: AuthProvider): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Stub 實作：先讓路由 gating 與 UI 可以完整運作。
 * 回傳假 user，不做任何真實驗證。
 */
class StubAuthService implements AuthService {
  async signIn(provider: AuthProvider): Promise<AuthUser> {
    await delay(600);

    return {
      id: `stub-${provider}-user`,
      displayName: provider === "google" ? "Google User" : "Apple User",
      email: `${provider}.user@example.com`,
      photoURL: null,
      provider,
    };
  }

  async signOut(): Promise<void> {
    await delay(200);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return null;
  }
}

export const authService: AuthService = new StubAuthService();
