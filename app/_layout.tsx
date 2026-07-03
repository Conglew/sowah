import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import AppLoadingScreen from "@/src/components/common/AppLoadingScreen";
import { useAuthStore } from "@/src/stores/auth.store";

export const unstable_settings = {
  anchor: "(tabs)",
};

// loading 畫面至少停留的時間（毫秒）
const MIN_SPLASH_MS = 2000;
// 淡出動畫時長（毫秒）
const FADE_OUT_MS = 400;
void SplashScreen.hideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  const [minTimePassed, setMinTimePassed] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const loaderOpacity = useSharedValue(1);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // 兩個條件都滿足才淡出：bootstrap 完成（status 已定案）且至少停留 MIN_SPLASH_MS
  const isReady = status !== "idle" && minTimePassed;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    // 淡出 loading 覆蓋層，動畫結束後才卸載，避免硬切
    loaderOpacity.value = withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
      if (finished) {
        runOnJS(setShowLoader)(false);
      }
    });
  }, [isReady, loaderOpacity]);

  const loaderStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
  }));

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>
      </Stack>

      {/* loading 覆蓋層：疊在最上層，淡出後卸載 */}
      {showLoader && (
        <Animated.View
          style={[StyleSheet.absoluteFill, loaderStyle]}
          pointerEvents="none"
        >
          <AppLoadingScreen />
        </Animated.View>
      )}

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
