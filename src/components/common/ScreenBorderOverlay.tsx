import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  MATCH_FRAME_ENABLED,
  useMatchFrameStore,
} from "@/src/stores/match-frame.store";
import { colors } from "@/src/theme/colors";

/**
 * 依 safe-area 上緣高度推估螢幕圓角。
 * RN 無法直接取得裝置實際圓角，故用瀏海/動態島高度分級近似（Android 較粗略）。
 */
function estimateCornerRadius(topInset: number) {
  if (topInset >= 51) return 55; // Dynamic Island（iPhone 14 Pro 以後）
  if (topInset >= 40) return 47; // 一般瀏海
  if (topInset >= 20) return 38; // 較小瀏海 / 舊全螢幕
  return 0; // Home 鍵老機 / 方角
}

/**
 * 全螢幕橘色邊框：root 最上層、絕對定位填滿整個螢幕（無視 safe area）。
 * pointerEvents="none" → 只是視覺框；帶呼吸閃爍動畫。
 */
export default function ScreenBorderOverlay() {
  const active = useMatchFrameStore((state) => state.active);
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(1);

  // useEffect(() => {
  //   if (active) {
  //     opacity.value = 1;
  //     opacity.value = withRepeat(
  //       withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.ease) }),
  //       -1,
  //       true,
  //     );
  //   } else {
  //     cancelAnimation(opacity);
  //     opacity.value = 1;
  //   }

  //   return () => cancelAnimation(opacity);
  // }, [active, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!MATCH_FRAME_ENABLED || !active) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.frame,
        { borderRadius: estimateCornerRadius(insets.top) },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 8,
    borderColor: "#FF8100",
  },
});
