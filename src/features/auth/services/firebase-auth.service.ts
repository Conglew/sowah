import { signOut as firebaseSignOut } from "firebase/auth";

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

    return authApi.oidcLogin(firebaseIdToken);
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch {
      // 即使 Firebase signOut 失敗，仍要繼續清除本地 session（見 auth.store）
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
