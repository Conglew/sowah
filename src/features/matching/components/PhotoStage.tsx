import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

/** 設計稿尺寸。實際渲染時會依可用空間等比縮放（見 fitScale）。 */
const CARD_WIDTH = 343;
const CARD_HEIGHT = 415;

/** 卡片白框：inside stroke，RN 的 border 本來就畫在盒子內側。 */
const CARD_BORDER_WIDTH = 6;
const CARD_RADIUS = 18;

/** 後方那張相對前方那張的位移與縮小，決定「牌疊」看起來有多厚。 */
const BACK_OFFSET_X = -34;
const BACK_OFFSET_Y = 44;
const BACK_SCALE = 0.94;

/** 拖曳超過這個距離（或甩超過這個速度）就完成抽牌，否則彈回。 */
const DRAG_THRESHOLD = 90;
const DRAG_VELOCITY_THRESHOLD = 700;

/** 拖曳時後方那張往前補的比例，給一點「下一張正在上來」的預覽。 */
const DRAG_PREVIEW = 0.28;

/** push 到達這個距離時，抬升與放大達到最大值。 */
const LIFT_MAGNITUDE = 56;
const LIFT_Y = -20;
const LIFT_SCALE = 1.04;

/** 傾斜跟著水平位移走，讓手感像捏著牌角。 */
const ROTATE_PER_PX = 0.06;
const MAX_ROTATE_DEG = 8;

const OUT_LIFT_UP_MS = 190;
const OUT_LIFT_DOWN_MS = 270;
const OUT_SLOT_MS = 460;
const IN_DELAY_MS = 120;
const IN_SLOT_MS = 340;

/** 層級在「牌被甩到最外面」的時候交換，此時遮蔽關係看不出跳變。 */
const Z_FLIP_DELAY_MS = 220;

const SPRING = { damping: 20, stiffness: 220, mass: 0.7 } as const;

const STAGE_WIDTH = CARD_WIDTH + Math.abs(BACK_OFFSET_X);
const STAGE_HEIGHT = CARD_HEIGHT + BACK_OFFSET_Y;

type CardMotion = {
  /** 0 = 前方（最上面那張），1 = 後方 */
  slot: SharedValue<number>;
  /** 手勢／抽牌造成的水平外推量（px）。前方那張才會被驅動。 */
  push: SharedValue<number>;
  zIndex: SharedValue<number>;
};

/**
 * 完成一次抽牌。direction 決定往左(-1)或往右(+1)甩出去再塞到後面。
 *
 * 放在模組層而不是元件內，是為了確保 Reanimated 的 babel plugin 會把它
 * workletize —— gesture callback 在 UI thread 上要能直接呼叫它，不繞 runOnJS。
 */
function runSwap(
  direction: number,
  outgoing: CardMotion,
  incoming: CardMotion,
) {
  "worklet";

  // 已經被拖出去更遠時就從那裡繼續，不要先往回縮再甩出去。
  const peak =
    direction * Math.max(LIFT_MAGNITUDE, Math.abs(outgoing.push.value));

  incoming.push.value = 0;
  outgoing.push.value = withSequence(
    withTiming(peak, {
      duration: OUT_LIFT_UP_MS,
      easing: Easing.out(Easing.cubic),
    }),
    withTiming(0, {
      duration: OUT_LIFT_DOWN_MS,
      easing: Easing.in(Easing.cubic),
    }),
  );
  outgoing.slot.value = withTiming(1, {
    duration: OUT_SLOT_MS,
    easing: Easing.inOut(Easing.cubic),
  });
  // duration 0 = 瞬間切換；zIndex 本來就無法補間，只能挑看不出來的時機跳。
  outgoing.zIndex.value = withDelay(
    Z_FLIP_DELAY_MS,
    withTiming(1, { duration: 0 }),
  );

  incoming.slot.value = withDelay(
    IN_DELAY_MS,
    withTiming(0, { duration: IN_SLOT_MS, easing: Easing.out(Easing.cubic) }),
  );
  incoming.zIndex.value = withDelay(
    Z_FLIP_DELAY_MS,
    withTiming(2, { duration: 0 }),
  );
}

type PhotoStageProps = {
  frontUri?: string | null;
  backUri?: string | null;
};

/**
 * 兩張等大的照片疊成一副牌。可以直接拖曳最上面那張，超過門檻就往該方向抽到後面，
 * 沒超過則彈回；點一下則走預設方向。
 *
 * 動畫拆成兩個角色而不是共用一條 progress：
 * - 往後的那張走 push 弧線（甩出去 → 落回後方），且 zIndex 撐到甩出去之後才降
 * - 往前的那張只是延遲一點點直線補進前方位置
 * 兩張共用同一條曲線的話會變成「互相對調」，那不是撲克牌的手感。
 */
export function PhotoStage({ frontUri, backUri }: PhotoStageProps) {
  const [available, setAvailable] = useState({ width: 0, height: 0 });

  const slotA = useSharedValue(0);
  const pushA = useSharedValue(0);
  const zIndexA = useSharedValue(2);

  const slotB = useSharedValue(1);
  const pushB = useSharedValue(0);
  const zIndexB = useSharedValue(1);

  const motionA = useMemo<CardMotion>(
    () => ({ slot: slotA, push: pushA, zIndex: zIndexA }),
    [pushA, slotA, zIndexA],
  );
  const motionB = useMemo<CardMotion>(
    () => ({ slot: slotB, push: pushB, zIndex: zIndexB }),
    [pushB, slotB, zIndexB],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setAvailable((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  // 設計稿是 390pt 寬的機型。更窄或更矮的裝置等比縮，不讓牌疊被裁掉。
  const fitScale = useMemo(() => {
    if (available.width <= 0 || available.height <= 0) return 0;
    return Math.min(
      1,
      available.width / STAGE_WIDTH,
      available.height / STAGE_HEIGHT,
    );
  }, [available.height, available.width]);

  const canSwap = Boolean(frontUri && backUri);

  const tapHaptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(canSwap)
      // 只認水平手勢，避免之後外層加上垂直捲動時互搶。
      .activeOffsetX([-10, 10])
      .onUpdate((event) => {
        const aIsFront = slotA.value < 0.5;
        const outgoing = aIsFront ? motionA : motionB;
        const incoming = aIsFront ? motionB : motionA;

        outgoing.push.value = event.translationX;
        const ratio = Math.min(
          Math.abs(event.translationX) / DRAG_THRESHOLD,
          1,
        );
        incoming.slot.value = 1 - ratio * DRAG_PREVIEW;
      })
      .onEnd((event) => {
        const aIsFront = slotA.value < 0.5;
        const outgoing = aIsFront ? motionA : motionB;
        const incoming = aIsFront ? motionB : motionA;

        const passed =
          Math.abs(event.translationX) > DRAG_THRESHOLD ||
          Math.abs(event.velocityX) > DRAG_VELOCITY_THRESHOLD;

        if (passed) {
          const direction =
            (event.translationX !== 0 ? event.translationX : event.velocityX) <
            0
              ? -1
              : 1;
          runSwap(direction, outgoing, incoming);
          runOnJS(tapHaptic)();
          return;
        }

        outgoing.push.value = withSpring(0, SPRING);
        incoming.slot.value = withSpring(1, SPRING);
      });

    const tap = Gesture.Tap()
      .enabled(canSwap)
      .onEnd((_event, success) => {
        if (!success) return;
        const aIsFront = slotA.value < 0.5;
        // 預設往 BACK_OFFSET_X 的方向抽，視覺上跟牌疊的傾向一致。
        runSwap(
          BACK_OFFSET_X < 0 ? -1 : 1,
          aIsFront ? motionA : motionB,
          aIsFront ? motionB : motionA,
        );
        runOnJS(tapHaptic)();
      });

    return Gesture.Race(pan, tap);
  }, [canSwap, motionA, motionB, slotA, tapHaptic]);

  const ready = fitScale > 0;

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.container}
        onLayout={handleLayout}
        accessibilityRole={canSwap ? "button" : undefined}
        accessibilityLabel={canSwap ? "切換前後景照片" : undefined}
      >
        {ready && (
          <View
            style={[
              styles.stage,
              {
                width: STAGE_WIDTH * fitScale,
                height: STAGE_HEIGHT * fitScale,
              },
            ]}
          >
            <PhotoCard uri={frontUri} motion={motionA} fitScale={fitScale} />
            <PhotoCard uri={backUri} motion={motionB} fitScale={fitScale} />
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

function PhotoCard({
  uri,
  motion,
  fitScale,
}: {
  uri?: string | null;
  motion: CardMotion;
  fitScale: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const slot = motion.slot.value;
    const push = motion.push.value;
    const lift = Math.abs(push);

    // slot 的位移要跟著版面縮放，push 是手指的實際位移所以不縮。
    const translateX =
      interpolate(slot, [0, 1], [0, BACK_OFFSET_X * fitScale]) + push;
    const translateY =
      interpolate(slot, [0, 1], [0, BACK_OFFSET_Y * fitScale]) +
      interpolate(
        lift,
        [0, LIFT_MAGNITUDE],
        [0, LIFT_Y * fitScale],
        Extrapolation.CLAMP,
      );
    const scale =
      interpolate(slot, [0, 1], [1, BACK_SCALE]) *
      interpolate(
        lift,
        [0, LIFT_MAGNITUDE],
        [1, LIFT_SCALE],
        Extrapolation.CLAMP,
      );
    const rotate = Math.min(
      MAX_ROTATE_DEG,
      Math.max(-MAX_ROTATE_DEG, push * ROTATE_PER_PX),
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
      // 不用 elevation 排序：Android 的 elevation 會順帶畫出材質陰影。
      // RN 在 Android 上 zIndex 對同層 sibling 是有效的。
      zIndex: motion.zIndex.value,
    };
  });

  if (!uri) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.card,
        {
          width: CARD_WIDTH * fitScale,
          height: CARD_HEIGHT * fitScale,
          right: 0,
          top: 0,
        },
        animatedStyle,
      ]}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  stage: { position: "relative" },
  card: {
    position: "absolute",
    borderRadius: CARD_RADIUS,
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#E8E8E8",
  },
});
