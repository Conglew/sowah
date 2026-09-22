import { ENV } from "@/src/config/env";
import type { AuthUser } from "@/src/features/auth/types";
import { useAuthStore } from "@/src/stores/auth.store";

export class MembershipRequiredError extends Error {
  constructor() {
    super("PAID_MEMBERSHIP_REQUIRED");
    this.name = "MembershipRequiredError";
  }
}

/**
 * 會員判斷的唯一入口。
 *
 * 後端尚未提供欄位時預設為 free（fail closed）。開發環境可以用
 * EXPO_PUBLIC_MEMBERSHIP_TIER=paid 模擬付費會員；後端完成後則直接使用
 * AuthUser.membership_tier，不需要改動各功能頁。
 */
export function hasPaidMembership(user: AuthUser | null): boolean {
  if (__DEV__ && ENV.membershipTier === "paid") return true;
  if (__DEV__ && ENV.membershipTier === "free") return false;

  return user?.membership_tier === "paid";
}

/** 防止非 UI 呼叫（例如其他分享入口）繞過會員限制。 */
export function assertPaidMembership(): void {
  if (!hasPaidMembership(useAuthStore.getState().user)) {
    throw new MembershipRequiredError();
  }
}
