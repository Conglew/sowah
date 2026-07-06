import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type FadeOverlayProps = {
  /** 是否顯示。false 時淡出後自動卸載 */
  visible: boolean;
  /** 淡入 / 淡出時長（毫秒） */
  duration?: number;
  children: ReactNode;
};

/**
 * 全螢幕覆蓋層，依 visible 淡入 / 淡出，淡出結束後才卸載。
 * 初始啟動 loading 與回前台 loading 共用同一套淡出邏輯。
 */
export default function FadeOverlay({
  visible,
  duration = 400,
  children,
}: FadeOverlayProps) {
  const [mounted, setMounted] = useState(visible);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      opacity.value = withTiming(1, { duration });
      return;
    }

    opacity.value = withTiming(0, { duration }, (finished) => {
      if (finished) {
        runOnJS(setMounted)(false);
      }
    });
  }, [visible, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, animatedStyle]}
      pointerEvents="none"
    >
      {children}
    </Animated.View>
  );
}
