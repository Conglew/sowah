import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { memo, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/src/theme/colors";
import type { GalleryMonth, GalleryPhoto } from "../types/profile.types";
import { getDaySequenceMap } from "../utils/gallery";

const COLUMNS = 4;
const H_PADDING = 16;
const GAP = 8;

// 堆疊要顯示幾張後卡（含 hero 外的張數）。要更豐富就加大。
const STACK_BACK_COUNT = 8;

// 堆疊模式卡片固定尺寸
const HERO_WIDTH = 287;
const HERO_HEIGHT = 348.33;

// 堆疊整體往上移的量（越大越上；受 topInset 影響，太大會壓到瀏海區）
const STACK_TOP_OFFSET = 50;

// 每張後卡進場的間隔（毫秒），做出 cascade（層層展開）效果
const STACK_STAGGER = 55;

// 依 seed 產生穩定的偽亂數 0..1（同一張卡每次結果一致，不會每次 render 跳動）
function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 依 index 生成散落 transform：以「往下」為主 + 左右展開 + 大幅度隨機旋轉，
// 方向不嚴格交錯，讓卡片像隨手往下丟、更隨性。回傳原始數值供進場動畫插值。
function getScatterTransform(i: number) {
  const r1 = seededRandom(i + 1);
  const r2 = seededRandom(i + 7);
  const r3 = seededRandom(i + 13);
  const r4 = seededRandom(i + 23);

  // 方向改成隨機（不再嚴格左右交錯），更隨性
  const side = r4 > 0.5 ? 1 : -1;

  // 以往下為主：下降幅度加大 + 隨機
  const ty = 28 + i * 36 + (r1 - 0.5) * 46;
  // 左右展開 + 較大隨機，避免整體垂直疊在一起
  const tx = side * (22 + i * 12) + (r2 - 0.5) * 60;
  // 旋轉幅度更大且更隨機
  const rotate = side * (8 + i * 2.2) + (r3 - 0.5) * 18;
  const scale = Math.max(0.8, 0.98 - i * 0.02);

  return { tx, ty, rotate, scale };
}

export type GalleryMode = "stack" | "grid";

type Props = {
  months: GalleryMonth[];
  /** 折疊時卡片露出的高度（px），拿來當底部 padding，避免最後幾張被卡片蓋住 */
  collapsedSheetHeight: number;
  /** 目前模式（由 ProfileView 依 bottom sheet 位置控制） */
  mode: GalleryMode;
  /** 點擊堆疊整體時觸發（切換到 grid） */
  onRequestGrid?: () => void;
  /** 每次變動即重播堆疊進場動畫（由 ProfileView 於 focus 時遞增） */
  playToken?: number;
};

/**
 * 背景相簿，兩種模式：
 *  - stack：所有相片攤平後，最新一張當 hero，後面幾張扇形堆疊。點擊 → grid
 *  - grid：依月份分組的 4 欄網格。左上小按鈕 → 切回 stack
 * 兩模式用 reanimated FadeIn/FadeOut 交叉淡入淡出切換。
 */
function ProfileBackgroundGalleryBase({
  months,
  collapsedSheetHeight,
  mode,
  onRequestGrid,
  playToken,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // 目前被點開放大的相片（null = 未開啟檢視器）
  const [viewerPhoto, setViewerPhoto] = useState<GalleryPhoto | null>(null);

  const tileSize = useMemo(
    () => (width - H_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS,
    [width],
  );

  // 攤平所有月份的相片，依時間新到舊排序（堆疊用）
  const flatPhotos = useMemo(() => {
    return months
      .flatMap((m) => m.photos)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  }, [months]);

  // stack↔grid 交叉淡入：0=stack、1=grid。
  // 兩層都常駐，用 opacity + pointerEvents 切換，避免 Reanimated exiting 殘留的
  // 滿版 stack Pressable 蓋在最上層攔截 grid 的點擊。
  const crossfade = useSharedValue(mode === "grid" ? 1 : 0);
  useEffect(() => {
    crossfade.value = withTiming(mode === "grid" ? 1 : 0, { duration: 220 });
  }, [mode, crossfade]);

  const stackFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - crossfade.value,
  }));
  const gridFadeStyle = useAnimatedStyle(() => ({ opacity: crossfade.value }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents={mode === "stack" ? "auto" : "none"}
        style={[StyleSheet.absoluteFill, stackFadeStyle]}
      >
        <StackedDeck
          photos={flatPhotos}
          topInset={insets.top}
          collapsedSheetHeight={collapsedSheetHeight}
          onPress={onRequestGrid}
          playToken={playToken}
        />
      </Animated.View>

      <Animated.View
        pointerEvents={mode === "grid" ? "auto" : "none"}
        style={[StyleSheet.absoluteFill, styles.gridBackground, gridFadeStyle]}
      >
        <FlatList
          data={months}
          keyExtractor={(m) => m.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top - STACK_TOP_OFFSET,
            // 讓最後一列能捲到卡片上方
            paddingBottom: collapsedSheetHeight + 24,
          }}
          renderItem={({ item }) => (
            <MonthGridBlock
              month={item}
              tileSize={tileSize}
              onPressPhoto={setViewerPhoto}
            />
          )}
        />
      </Animated.View>

      {/* 單張放大檢視器：白色毛玻璃背景 + 置中大圖 */}
      <PhotoViewer photo={viewerPhoto} onClose={() => setViewerPhoto(null)} />
    </View>
  );
}

type MonthGridBlockProps = {
  month: GalleryMonth;
  tileSize: number;
  onPressPhoto: (photo: GalleryPhoto) => void;
};

/**
 * 單一月份的網格區塊。序號依 takenAt 動態計算（每月各自從 1、最舊那天為 1、同日共用），
 * 不再顯示日期號。抽成獨立元件才能在此使用 useMemo。
 */
function MonthGridBlock({ month, tileSize, onPressPhoto }: MonthGridBlockProps) {
  const daySeqMap = useMemo(
    () => getDaySequenceMap(month.photos),
    [month.photos],
  );

  return (
    <View style={styles.monthBlock}>
      <Text style={styles.monthTitle}>
        {month.monthLabel} <Text style={styles.monthYear}>{month.year}</Text>
      </Text>

      <View style={styles.grid}>
        {month.photos.map((photo) => (
          <Pressable
            key={photo.id}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
            onPress={() => onPressPhoto(photo)}
          >
            <Image
              source={{ uri: photo.uri }}
              style={styles.tileImage}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              recyclingKey={photo.id}
            />
            <Text style={styles.tileLabel}>{daySeqMap[photo.id]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type PhotoViewerProps = {
  photo: GalleryPhoto | null;
  onClose: () => void;
};

/**
 * 單張檢視器。背景用 expo-blur 的 BlurView 即時模糊「後方真實畫面」（透出 profile），
 * 再疊一層很淡的白，做出「白色透明毛玻璃」效果；前景為固定尺寸卡片
 * （343×415、radius 22、白色內框），右上角提供關閉鈕。點卡片外背景或關閉鈕皆可關閉。
 */
function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
  return (
    <Modal
      visible={photo !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.viewerOverlay} onPress={onClose}>
        {photo && (
          <>
            {/* 即時模糊後方真實畫面；tint="light" 偏白，Android 需 experimentalBlurMethod 才會模糊底層 */}
            <BlurView
              intensity={5}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.viewerScrim} />

            {/* 卡片本身：攔截觸控，避免點到圖片就關閉（僅背景/關閉鈕關閉） */}
            <View
              style={styles.viewerCard}
              onStartShouldSetResponder={() => true}
            >
              <Image
                source={{ uri: photo.uri }}
                style={styles.viewerImage}
                contentFit="cover"
                transition={150}
                cachePolicy="memory-disk"
                recyclingKey={photo.id}
              />

              {/* 白色內框：距卡片邊緣 11px、線寬 2px（純視覺，不吃觸控） */}
              <View style={styles.viewerInnerBorder} pointerEvents="none" />

              <Pressable
                style={styles.viewerClose}
                onPress={onClose}
                hitSlop={12}
              >
                <Text style={styles.viewerCloseIcon}>✕</Text>
              </Pressable>
            </View>
          </>
        )}
      </Pressable>
    </Modal>
  );
}

type StackedDeckProps = {
  photos: GalleryPhoto[];
  topInset: number;
  collapsedSheetHeight: number;
  /** 點擊堆疊區任一處觸發（切換到 grid） */
  onPress?: () => void;
  /** 變動即重播進場動畫 */
  playToken?: number;
};

function StackedDeck({
  photos,
  topInset,
  collapsedSheetHeight,
  onPress,
  playToken,
}: StackedDeckProps) {
  const hero = photos[0];
  const backCards = photos.slice(1, 1 + STACK_BACK_COUNT);

  if (!hero) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.stackContainer,
        {
          paddingTop: topInset - STACK_TOP_OFFSET,
          paddingBottom: collapsedSheetHeight,
        },
      ]}
    >
      <View style={{ width: HERO_WIDTH, height: HERO_HEIGHT }}>
        {/* 後卡：由遠到近畫（reverse），進場時從疊合處展開到散落位置 */}
        {backCards
          .map((photo, i) => (
            <StackCard
              key={photo.id}
              photo={photo}
              index={i}
              playToken={playToken}
            />
          ))
          .reverse()}

        {/* hero（最上層） */}
        <HeroCard photo={hero} playToken={playToken} />
      </View>
    </Pressable>
  );
}

type StackCardProps = {
  photo: GalleryPhoto;
  index: number;
  playToken?: number;
};

// 後卡：進場時 progress 0→1，把散落 transform 與 opacity 一起插值出來
function StackCard({ photo, index, playToken }: StackCardProps) {
  const progress = useSharedValue(0);
  const target = useMemo(() => getScatterTransform(index), [index]);
  const finalOpacity = Math.max(0.35, 0.9 - index * 0.08);

  useEffect(() => {
    progress.value = 0;
    // 每張卡延遲與時長各自帶隨機 → 更隨性、不整齊劃一
    const delay = index * STACK_STAGGER + seededRandom(index + 31) * 70;
    const duration = 380 + seededRandom(index + 41) * 260;
    // ease-out timing：先快後慢「甩出去」、無回彈
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [playToken, index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: finalOpacity * p,
      transform: [
        { translateX: target.tx * p },
        { translateY: target.ty * p },
        { rotate: `${target.rotate * p}deg` },
        { scale: 1 + (target.scale - 1) * p },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.stackCard,
        { width: HERO_WIDTH, height: HERO_HEIGHT, zIndex: -(index + 1) },
        animatedStyle,
      ]}
    >
      <Image
        source={{ uri: photo.uri }}
        style={styles.stackCardImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={photo.id}
      />
    </Animated.View>
  );
}

type HeroCardProps = {
  photo: GalleryPhoto;
  playToken?: number;
};

// hero：進場時淡入 + 輕微放大
function HeroCard({ photo, playToken }: HeroCardProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
  }, [playToken, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + 0.06 * progress.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.stackCard,
        styles.stackHero,
        { width: HERO_WIDTH, height: HERO_HEIGHT },
        animatedStyle,
      ]}
    >
      <Image
        source={{ uri: photo.uri }}
        style={styles.stackCardImage}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        recyclingKey={photo.id}
      />
    </Animated.View>
  );
}

export const ProfileBackgroundGallery = memo(ProfileBackgroundGalleryBase);

const styles = StyleSheet.create({
  // ---- 堆疊模式 ----
  stackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  stackCard: {
    position: "absolute",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  stackHero: {
    zIndex: 1,
  },
  stackCardImage: {
    ...StyleSheet.absoluteFillObject,
  },

  // ---- grid 模式 ----
  gridBackground: {
    backgroundColor: "#FFFFFF",
  },
  monthBlock: {
    paddingHorizontal: H_PADDING,
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 12,
  },
  monthYear: {
    color: colors.brand,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#EEEEEE",
    justifyContent: "flex-end",
  },
  tileImage: {
    ...StyleSheet.absoluteFillObject,
  },
  tileLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 4,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ---- 單張放大檢視器 ----
  viewerOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerScrim: {
    ...StyleSheet.absoluteFillObject,
    // BlurView 已負責模糊，這層只補一點白讓背景更偏「白色透明」；調高更白、調低更透
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  viewerCard: {
    width: 343,
    height: 415,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#EEEEEE",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
  viewerInnerBorder: {
    position: "absolute",
    top: 11,
    left: 11,
    right: 11,
    bottom: 11,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    // 外圓角 22 − 內縮 11 = 11，維持同心圓角
    borderRadius: 11,
  },
  viewerClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCloseIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
