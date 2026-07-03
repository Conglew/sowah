import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { ENV } from "@/src/config/env";
import type { AuthProvider } from "@/src/features/auth/types";
import { auth } from "@/src/services/firebase/firebase";

let googleConfigured = false;

function ensureGoogleConfigured() {
  if (googleConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: ENV.google.webClientId,
    iosClientId: ENV.google.iosClientId,
  });

  googleConfigured = true;
}

/** 原生 Google 帳號選擇器 → Firebase credential → Firebase ID token */
async function signInWithGoogle(): Promise<string> {
  ensureGoogleConfigured();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // @react-native-google-signin v13+ 回傳 { type, data }
  const response = await GoogleSignin.signIn();

  if (response.type !== "success" || !response.data.idToken) {
    throw new Error("Google 登入未取得 idToken");
  }

  const credential = GoogleAuthProvider.credential(response.data.idToken);
  const result = await signInWithCredential(auth, credential);

  return result.user.getIdToken();
}

/** 原生 Apple 登入 sheet → Firebase credential → Firebase ID token */
async function signInWithApple(): Promise<string> {
  // Firebase + Apple 需要 nonce：用 rawNonce 的 SHA256 傳給 Apple，
  // Firebase credential 則帶 rawNonce，兩邊比對防重放攻擊。
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error("Apple 登入未取得 identityToken");
  }

  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });

  const result = await signInWithCredential(auth, credential);

  return result.user.getIdToken();
}

/** 依 provider 取得 Firebase ID token（後端 /auth/oidc/login 需要的 token） */
export async function getFirebaseIdToken(
  provider: AuthProvider,
): Promise<string> {
  if (provider === "google") {
    return signInWithGoogle();
  }

  return signInWithApple();
}
