/**
 * 用 Expo 原生支援的 EXPO_PUBLIC_* 讀取設定（不需 babel plugin）。
 * 這些都是「公開識別碼」（Firebase web config、OAuth client id），非機密，
 * 可安全放在前端。真正機密（refresh token）走 expo-secure-store。
 */
export const ENV = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",

  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
  },

  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  },

  chat: {
    // Tencent Cloud Chat 的 SDKAppID 是公開識別碼，可放前端。
    // ⚠️ SECRETKEY 不在這裡：它只給後端 / 本機 scripts 簽 UserSig 用（見 chat-usersig.ts）。
    sdkAppId: Number(process.env.EXPO_PUBLIC_CHAT_SDK_APP_ID ?? 0),
  },
} as const;
