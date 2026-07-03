import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";

import { ENV } from "@/src/config/env";

/**
 * Firebase 在這個專案只當「換 token 的中介」：
 * 用它拿到 Firebase ID token 丟給後端 /auth/oidc/login，換成後端自己的 JWT。
 * 因此不需要 Firebase 的持久化 → 用 inMemoryPersistence，避免 AsyncStorage 警告。
 */
const app = getApps().length > 0 ? getApp() : initializeApp(ENV.firebase);

let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: inMemoryPersistence });
} catch {
  // initializeAuth 每個 app 只能呼叫一次；hot reload 後 fallback 到 getAuth
  auth = getAuth(app);
}

export { app, auth };
