import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors } from "@/src/theme/colors";

const TRACK_WIDTH = 96;
const TRACK_HEIGHT = 42;
const KNOB_SIZE = 36;
const TRACK_PADDING = 3;
const TRAVEL = TRACK_WIDTH - KNOB_SIZE - TRACK_PADDING * 2;

/**
 * knob 的兩個停靠位置：左 = 開麥、右 = 靜音。
 * 要改成相反只需把這兩個常數對調，其餘邏輯都以 progress（= 開麥程度）表示，不受影響。
 */
const LIVE_X = 0;
const MUTED_X = TRAVEL;

/** 拖曳方向係數：右移代表 progress 增加時為 1，反之為 -1。 */
const DRAG_DIRECTION = LIVE_X > MUTED_X ? 1 : -1;

const SPRING = { damping: 18, stiffness: 240, mass: 0.6 } as const;

/** 放開時把殘餘速度也算進去，快速甩動即使沒過半也會切到底。 */
const VELOCITY_PROJECTION = 0.08;

type MicSwitchProps = {
  muted: boolean;
  onChange: (muted: boolean) => void;
  disabled?: boolean;
};

/**
 * 可左右滑動（也可點擊）的麥克風開關。
 *
 * progress 一律代表「開麥程度」：0 = 靜音、1 = 開麥，與 knob 實際在左或在右無關。
 */
export function MicSwitch({
  muted,
  onChange,
  disabled = false,
}: MicSwitchProps) {
  const progress = useSharedValue(muted ? 0 : 1);
  const startProgress = useSharedValue(0);

  // 外部改變 muted（例如通話結束強制靜音）時也要跟著動，不只有手勢會改。
  useEffect(() => {
    progress.value = withSpring(muted ? 0 : 1, SPRING);
  }, [muted, progress]);

  const commit = useCallback(
    (nextMuted: boolean) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (nextMuted !== muted) onChange(nextMuted);
    },
    [muted, onChange],
  );

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(!disabled)
      .onBegin(() => {
        startProgress.value = progress.value;
      })
      .onUpdate((event) => {
        const next =
          startProgress.value + (DRAG_DIRECTION * event.translationX) / TRAVEL;
        progress.value = Math.min(1, Math.max(0, next));
      })
      .onEnd((event) => {
        const projected =
          progress.value +
          (DRAG_DIRECTION * event.velocityX * VELOCITY_PROJECTION) / TRAVEL;
        const target = projected > 0.5 ? 1 : 0;
        progress.value = withSpring(target, SPRING);
        // 只在放開、位置確定後回報一次，不在 onUpdate 裡跟著拖曳連續觸發。
        runOnJS(commit)(target === 0);
      });

    const tap = Gesture.Tap()
      .enabled(!disabled)
      .onEnd((_event, success) => {
        if (!success) return;
        const target = progress.value > 0.5 ? 0 : 1;
        progress.value = withSpring(target, SPRING);
        runOnJS(commit)(target === 0);
      });

    return Gesture.Exclusive(pan, tap);
  }, [commit, disabled, progress, startProgress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [MUTED_X, LIVE_X]) },
    ],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.brand, "#F4F4F4"],
    ),
  }));

  const micStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const micOffStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[styles.track, disabled && styles.trackDisabled]}
        accessibilityRole="switch"
        accessibilityState={{ checked: !muted, disabled }}
        accessibilityLabel={muted ? "麥克風已靜音" : "麥克風開啟中"}
        accessibilityHint="左右滑動或點擊以切換麥克風"
      >
        <Animated.View style={[styles.knob, knobStyle]}>
          <Animated.View style={[styles.icon, micOffStyle]}>
            <Ionicons name="mic-off" size={18} color="#FFFFFF" />
          </Animated.View>
          <Animated.View style={[styles.icon, micStyle]}>
            <Ionicons name="mic" size={18} color="#555555" />
          </Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    padding: TRACK_PADDING,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "#CFCFCF",
    justifyContent: "center",
  },
  trackDisabled: { opacity: 0.5 },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
