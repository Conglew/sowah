import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OnboardingCarousel from "@/src/features/auth/components/OnboardingCarousel";
import SocialLoginButton from "@/src/features/auth/components/SocialLoginButton";
import type { AuthProvider } from "@/src/features/auth/types";
import { useAuthStore } from "@/src/stores/auth.store";

export default function OnboardingPage() {
  const status = useAuthStore((state) => state.status);
  const signIn = useAuthStore((state) => state.signIn);

  const [pendingProvider, setPendingProvider] = useState<AuthProvider | null>(
    null,
  );

  const isAuthenticating = status === "authenticating";

  const handleSignIn = async (provider: AuthProvider) => {
    if (isAuthenticating) {
      return;
    }

    setPendingProvider(provider);

    try {
      await signIn(provider);
      // 成功後不需手動導頁：status 轉為 "authenticated" 後，
      // root _layout 的 Stack.Protected 會自動移除 (auth) 並進入 (tabs)。
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.carouselArea}>
        <OnboardingCarousel />
      </View>

      <View style={styles.actions}>
        <SocialLoginButton
          label="Continue with Google"
          onPress={() => handleSignIn("google")}
          disabled={isAuthenticating}
          loading={pendingProvider === "google"}
        />

        {/* Apple 原生登入僅 iOS 支援；如需在 Android 開發時也顯示，移除此 Platform 判斷即可 */}
        {Platform.OS === "ios" && (
          <SocialLoginButton
            label="Continue with Apple"
            onPress={() => handleSignIn("apple")}
            disabled={isAuthenticating}
            loading={pendingProvider === "apple"}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  carouselArea: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: 30,
    paddingBottom: 24,
    gap: 12,
  },
});
