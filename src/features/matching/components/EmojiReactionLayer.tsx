import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * 同時存在的上限。表情可能來自對方且不受我們控制頻率，
 * 沒有上限的話被連點就會累積出上百個 view。超過就丟掉最舊的。
 */
const MAX_CONCURRENT = 24;

const RISE_MIN = 150;
const RISE_MAX = 230;
const DRIFT_MIN = 18;
const DRIFT_MAX = 44;
const SCALE_MIN = 0.85;
const SCALE_MAX = 1.25;
const ROTATE_MAX_DEG = 22;
const DURATION_MIN_MS = 1500;
const DURATION_MAX_MS = 2200;

type Reaction = {
  id: string;
  emoji: string;
  /** 每一顆的參數在生成時就決定好，之後不再改變，動畫才能純粹由 progress 驅動。 */
  rise: number;
  drift: number;
  scale: number;
  rotate: number;
  duration: number;
};

export type EmojiReactionLayerHandle = {
  /** 放一顆表情出去。自己發的和對方送來的都走這裡。 */
  spawn: (emoji: string) => void;
};

type EmojiReactionLayerProps = {
  /** 表情從哪個 x 座標冒出來（通常是表情按鈕的中心）。 */
  anchorX: number;
  /** 距離容器底部多高開始上升（通常是控制列的高度）。 */
  bottom: number;
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

let reactionSeq = 0;

/**
 * 浮空表情層。用 imperative handle 而不是 props 傳陣列，
 * 是為了讓每次 spawn 只重繪這一層，不會把整個通話頁一起重繪。
 */
export const EmojiReactionLayer = forwardRef<
  EmojiReactionLayerHandle,
  EmojiReactionLayerProps
>(function EmojiReactionLayer({ anchorX, bottom }, ref) {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const remove = useCallback((id: string) => {
    setReactions((previous) => previous.filter((item) => item.id !== id));
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      spawn: (emoji: string) => {
        reactionSeq += 1;
        const next: Reaction = {
          id: `reaction-${reactionSeq}`,
          emoji,
          rise: randomBetween(RISE_MIN, RISE_MAX),
          drift:
            randomBetween(DRIFT_MIN, DRIFT_MAX) *
            (Math.random() < 0.5 ? -1 : 1),
          scale: randomBetween(SCALE_MIN, SCALE_MAX),
          rotate: randomBetween(-ROTATE_MAX_DEG, ROTATE_MAX_DEG),
          duration: randomBetween(DURATION_MIN_MS, DURATION_MAX_MS),
        };
        setReactions((previous) =>
          previous.length >= MAX_CONCURRENT
            ? [...previous.slice(1), next]
            : [...previous, next],
        );
      },
    }),
    [],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {reactions.map((reaction) => (
        <FloatingEmoji
          key={reaction.id}
          reaction={reaction}
          anchorX={anchorX}
          bottom={bottom}
          onFinish={remove}
        />
      ))}
    </View>
  );
});

function FloatingEmoji({
  reaction,
  anchorX,
  bottom,
  onFinish,
}: {
  reaction: Reaction;
  anchorX: number;
  bottom: number;
  onFinish: (id: string) => void;
}) {
  const progress = useSharedValue(0);

  // reaction / onFinish 在這顆的生命週期內都不會變，所以這個 effect 只跑一次。
  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: reaction.duration, easing: Easing.out(Easing.quad) },
      (finished) => {
        // withTiming 的 callback 跑在 UI thread，要回 JS thread 才能改 state。
        if (finished) runOnJS(onFinish)(reaction.id);
      },
    );
  }, [onFinish, progress, reaction]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;

    return {
      transform: [
        { translateY: interpolate(p, [0, 1], [0, -reaction.rise]) },
        {
          // 左右擺盪，讓多顆同時上升時不會疊成一條直線。
          translateX: interpolate(
            p,
            [0, 0.25, 0.5, 0.75, 1],
            [0, reaction.drift, -reaction.drift, reaction.drift * 0.5, 0],
          ),
        },
        {
          scale: interpolate(
            p,
            [0, 0.12, 0.85, 1],
            [0.4, reaction.scale, reaction.scale, reaction.scale * 0.8],
          ),
        },
        { rotate: `${interpolate(p, [0, 1], [0, reaction.rotate])}deg` },
      ],
      opacity: interpolate(p, [0, 0.08, 0.7, 1], [0, 1, 1, 0]),
    };
  });

  return (
    <Animated.View
      style={[styles.emoji, { left: anchorX - 16, bottom }, animatedStyle]}
    >
      <Text style={styles.emojiText}>{reaction.emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  emoji: { position: "absolute", width: 32, alignItems: "center" },
  emojiText: { fontSize: 26, lineHeight: 32 },
});
