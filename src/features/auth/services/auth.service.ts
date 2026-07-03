import type { AuthService } from "@/src/features/auth/types";

import { firebaseAuthService } from "./firebase-auth.service";

/**
 * 目前使用 Firebase 實作。
 * 若要換實作（例如測試用 stub），只改這一行的指派即可，
 * store 與 UI 完全不用動。
 */
export const authService: AuthService = firebaseAuthService;
