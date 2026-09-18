import { signOut as firebaseSignOut } from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { authApi } from "@/src/features/auth/api/auth.api";
import type {
  AuthProvider,
  AuthService,
  OidcLoginResult,
} from "@/src/features/auth/types";
import { auth } from "@/src/services/firebase/firebase";
import { getFirebaseIdToken } from "@/src/services/firebase/oidc";

class FirebaseAuthService implements AuthService {
  async signIn(provider: AuthProvider): Promise<OidcLoginResult> {
    const firebaseIdToken = await getFirebaseIdToken(provider);
    console.log("firebaseIDTOken: " + firebaseIdToken);

    return authApi.oidcLogin(firebaseIdToken);
  }

  async signOut(): Promise<void> {
    // 清掉原生 Google session，下一次登入才會重新出現帳號選擇器，而不是直接沿用上一個帳號。
    try {
      await GoogleSignin.signOut();
    } catch {
      // Apple 登入或目前沒有 Google session 時可以忽略。
    }

    try {
      await firebaseSignOut(auth);
    } catch {
      // 即使 Firebase signOut 失敗，仍要繼續清除本地 session（見 auth.store）
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
