import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import AppLoadingScreen from "@/src/components/common/AppLoadingScreen";
import FadeOverlay from "@/src/components/common/FadeOverlay";
import { useAppResumeLoading } from "@/src/hooks/useAppResumeLoading";
import { useAuthStore } from "@/src/stores/auth.store";

export const unstable_settings = {
  anchor: "(tabs)",
};

// loading 畫面至少停留的時間（毫秒）
const MIN_SPLASH_MS = 2000;

// 一啟動就收掉原生 splash，改由自訂 AppLoadingScreen 接手
void SplashScreen.hideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  const isResuming = useAppResumeLoading({ minVisibleMs: 1500 });

  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // 兩個條件都滿足才進 App：bootstrap 完成（status 已定案）且至少停留 MIN_SPLASH_MS
  const isReady = status !== "idle" && minTimePassed;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          {/* App 內容永遠渲染，讓 loading 淡出後直接露出正確畫面 */}
          <Stack>
            <Stack.Protected guard={status === "unauthenticated"}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={status === "onboarding"}>
              <Stack.Screen name="(setup)" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={status === "authenticated"}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
              <Stack.Screen
                name="create-topic"
                options={{ headerShown: false }}
              />
            </Stack.Protected>
          </Stack>

          {/* 初始啟動 loading（淡出） */}
          <FadeOverlay visible={!isReady}>
            <AppLoadingScreen />
          </FadeOverlay>

          {/* 回前台 loading（共用同一套淡出） */}
          <FadeOverlay visible={isResuming}>
            <AppLoadingScreen />
          </FadeOverlay>

          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
