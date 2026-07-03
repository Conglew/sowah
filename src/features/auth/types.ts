export type AuthProvider = "google" | "apple";

export type AuthStatus =
  | "idle" // App 啟動、bootstrap 進行中
  | "authenticating" // 登入流程進行中
  | "authenticated" // 已登入且已完成 profile onboarding
  | "onboarding" // 已登入但尚未建立 profile（/users/me 404）
  | "unauthenticated"; // 未登入

/** 後端 JWT token 組（/auth/oidc/login、/auth/refresh 回傳） */
export type AuthTokens = {
  access_token: string;
  access_exp: number;
  refresh_token: string;
  refresh_exp: number;
};

/** 後端的 auth profile（/auth/whoami、login.user） */
export type AuthUser = {
  user_uid: string;
  role: string;
  oidc_provider: string | null;
  oidc_sub: string | null;
  created_at: string;
  updated_at: string;
};

/** POST /auth/oidc/login 回傳 */
export type OidcLoginResult = {
  is_new: boolean;
  tokens: AuthTokens;
  user: AuthUser;
};

/**
 * Auth service 介面：UI / store 只依賴這個抽象，
 * 底層可換成 Firebase 實作或（測試用）stub。
 */
export interface AuthService {
  signIn(provider: AuthProvider): Promise<OidcLoginResult>;
  signOut(): Promise<void>;
}
