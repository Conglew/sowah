import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OnboardingCarousel from "@/src/features/auth/components/OnboardingCarousel";
import SocialLoginButton from "@/src/features/auth/components/SocialLoginButton";
import type { AuthProvider } from "@/src/features/auth/types";
import { useAuthStore } from "@/src/stores/auth.store";

export default function OnboardingPage() {
  const status = useAuthStore((state) => state.status);
  const signIn = useAuthStore((state) => state.signIn);
  const error = useAuthStore((state) => state.error);

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
      <View style={styles.content}>
        <OnboardingCarousel />

        <View style={styles.actions}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // 舊：輪播吃滿上方、按鈕固定貼底（保留備用，後續可能改回這個樣式）
  // carouselArea: {
  //   flex: 1,
  // },

  // 新：logo + 文字 + dots + 按鈕整組垂直置中，按鈕緊貼 Slide 下方
  content: {
    flex: 1,
    justifyContent: "center",
    transform: [{ translateY: -70 }], // 整組（logo+文字+dots+按鈕）往上移；不想上移就移除這行
  },
  actions: {
    marginTop: 28,
    paddingHorizontal: 30,
    gap: 12,
    // 舊（貼底時使用）：
    // paddingBottom: 24,
  },
  errorText: {
    marginBottom: 4,
    fontSize: 12,
    textAlign: "center",
    color: "#E04A4A",
  },
});
