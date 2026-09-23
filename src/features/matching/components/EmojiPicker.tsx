import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/** 通話中可以送出的表情。順序就是畫面上由左到右的順序。 */
export const CALL_REACTIONS = [
  "❤️",
  "😂",
  "👍",
  "🔥",
  "😮",
  "🎉",
  "😢",
  "👏",
] as const;

const SPRING = { damping: 18, stiffness: 260, mass: 0.6 } as const;

type EmojiPickerProps = {
  open: boolean;
  onSelect: (emoji: string) => void;
  /** 距離容器底部多高（通常是控制列高度 + 間距）。 */
  bottom: number;
};

/**
 * 表情選單。刻意常駐掛載、用 opacity/scale 控制顯隱，
 * 而不是條件式 mount —— 避免關閉時動畫還沒跑完就被卸載。
 */
export function EmojiPicker({ open, onSelect, bottom }: EmojiPickerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(open ? 1 : 0, SPRING);
  }, [open, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 10 },
      { scale: 0.88 + progress.value * 0.12 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={open ? "auto" : "none"}
      style={[styles.panel, { bottom }, animatedStyle]}
    >
      {CALL_REACTIONS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onSelect(emoji)}
          style={styles.item}
          accessibilityRole="button"
          accessibilityLabel={`傳送 ${emoji}`}
          hitSlop={4}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 18,
    right: 18,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DCDCDC",
    backgroundColor: "#FFFFFF",
  },
  item: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 24, lineHeight: 30 },
});
