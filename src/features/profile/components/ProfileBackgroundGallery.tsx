import { Image } from "expo-image";
import { memo, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptics } from "@/src/shared/utils/haptics";
import { colors } from "@/src/theme/colors";
import type { GalleryMonth, GalleryPhoto } from "../types/profile.types";

const COLUMNS = 4;
const H_PADDING = 16;
const GAP = 8;


// 堆疊要顯示幾張後卡（含 hero 外的張數）。要更豐富就加大。
const STACK_BACK_COUNT = 8;

// 依 index 生成散落(scatter)的 transform：越後面越往下、左右交錯、旋轉加大
function getScatterTransform(i: number) {
  // 左右交錯：偶數往右、奇數往左
  const side = i % 2 === 0 ? 1 : -1;
  // 每往後一張，往下累積位移
  const ty = 40 + i * 46;
  // 左右偏移隨層數擴大，帶點隨機感（用 index 當 seed 讓每次一致）
  const tx = side * (18 + (i % 3) * 26);
  // 旋轉左右交錯、逐層加大
  const rotate = side * (4 + i * 1.6);
  // 越後面越小
  const scale = Math.max(0.8, 0.99 - i * 0.02);

  return {
    transform: [
      { translateX: tx },
      { translateY: ty },
      { rotate: `${rotate}deg` },
      { scale },
    ],
  };
}

type GalleryMode = "stack" | "grid";

type Props = {
  months: GalleryMonth[];
  /** 折疊時卡片露出的高度（px），拿來當底部 padding，避免最後幾張被卡片蓋住 */
  collapsedSheetHeight: number;
  /** 初始模式，預設堆疊 */
  initialMode?: GalleryMode;
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
  initialMode = "stack",
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<GalleryMode>(initialMode);

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

  const toggleMode = (next: GalleryMode) => {
    haptics.selection();
    setMode(next);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {mode === "stack" ? (
        <Animated.View
          key="stack"
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(160)}
          style={StyleSheet.absoluteFill}
        >
          <StackedDeck
            photos={flatPhotos}
            screenWidth={width}
            topInset={insets.top}
            collapsedSheetHeight={collapsedSheetHeight}
            onPress={() => toggleMode("grid")}
          />
        </Animated.View>
      ) : (
        <Animated.View
          key="grid"
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(160)}
          style={StyleSheet.absoluteFill}
        >
          <FlatList
            data={months}
            keyExtractor={(m) => m.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: insets.top + 8,
              // 讓最後一列能捲到卡片上方
              paddingBottom: collapsedSheetHeight + 24,
            }}
            renderItem={({ item }) => (
              <View style={styles.monthBlock}>
                <Text style={styles.monthTitle}>
                  {item.monthLabel}{" "}
                  <Text style={styles.monthYear}>{item.year}</Text>
                </Text>

                <View style={styles.grid}>
                  {item.photos.map((photo) => (
                    <View
                      key={photo.id}
                      style={[
                        styles.tile,
                        { width: tileSize, height: tileSize },
                      ]}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.tileImage}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                        recyclingKey={photo.id}
                      />
                      <Text style={styles.tileLabel}>{photo.dayLabel}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          />

          {/* 切回堆疊的小按鈕（截圖沒有，可自行刪除或改樣式） */}
          <Pressable
            style={[styles.backToStackBtn, { top: insets.top + 8 }]}
            onPress={() => toggleMode("stack")}
            hitSlop={8}
          >
            <Text style={styles.backToStackIcon}>▢</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

type StackedDeckProps = {
  photos: GalleryPhoto[];
  screenWidth: number;
  topInset: number;
  collapsedSheetHeight: number;
  onPress: () => void;
};

function StackedDeck({
  photos,
  screenWidth,
  topInset,
  collapsedSheetHeight,
  onPress,
}: StackedDeckProps) {
  const heroWidth = screenWidth * 0.72;
  const heroHeight = heroWidth * 1.32; // 直式 3:4 左右

  const hero = photos[0];
  const backCards = photos.slice(1, 1 + STACK_BACK_COUNT);

  if (!hero) {
    return null;
  }

  return (
    <View
      style={[
        styles.stackContainer,
        { paddingTop: topInset + 0, paddingBottom: collapsedSheetHeight },
      ]}
    >
      <Pressable onPress={onPress} style={styles.stackPressable}>
        <View style={{ width: heroWidth, height: heroHeight }}>
          {/* 後面的卡片：由遠到近畫，最後畫 hero 疊最上層 */}
          {backCards
  .map((photo, i) => {
    const scatter = getScatterTransform(i);
    return (
      <View
        key={photo.id}
        style={[
          styles.stackCard,
          {
            width: heroWidth,
            height: heroHeight,
            opacity: Math.max(0.35, 0.9 - i * 0.08), // 越後面越淡
            transform: scatter.transform,
            zIndex: -(i + 1),
          },
        ]}
      >
        <Image
          source={{ uri: photo.uri }}
          style={styles.stackCardImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={photo.id}
        />
      </View>
    );
  })
  .reverse()}

          {/* hero（最上層） */}
          <View
            style={[
              styles.stackCard,
              styles.stackHero,
              { width: heroWidth, height: heroHeight },
            ]}
          >
            <Image
              source={{ uri: hero.uri }}
              style={styles.stackCardImage}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              recyclingKey={hero.id}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export const ProfileBackgroundGallery = memo(ProfileBackgroundGalleryBase);

const styles = StyleSheet.create({
  // ---- 堆疊模式 ----
  stackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#FFFFFF"
  },
  stackPressable: {
    alignItems: "center",
    justifyContent: "center",
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

  // ---- 切回堆疊按鈕 ----
  backToStackBtn: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  backToStackIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
