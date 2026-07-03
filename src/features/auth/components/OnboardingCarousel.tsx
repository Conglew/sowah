import { useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import SowahLogo from "@/src/assets/images/sowah-cover.svg";

type OnboardingSlide = {
  key: string;
  tagline: string;
};

const AUTO_PLAY_INTERVAL = 4000; // 每 4 秒自動換頁

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: "slide-1",
    tagline: "We are an English Speaking Community!!\nJust Speak Out!!",
  },
  {
    key: "slide-2",
    tagline: "Join live topics every day.\nMeet people from around the world.",
  },
  {
    key: "slide-3",
    tagline: "Practice by speaking, not just studying.\nStart your first talk!!",
  },
];

export default function OnboardingCarousel() {
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(0);
  const isInteractingRef = useRef(false);

  // 讓自動輪播的計時器讀到最新 index，又不需要把 index 放進 effect 依賴
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // 自動輪播：每隔 AUTO_PLAY_INTERVAL 換到下一頁，最後一頁循環回第一頁。
  // 使用者手動滑動時暫停（isInteractingRef），放手後恢復。
  useEffect(() => {
    if (containerWidth <= 0) {
      return;
    }

    const timer = setInterval(() => {
      if (isInteractingRef.current) {
        return;
      }

      const nextIndex = (activeIndexRef.current + 1) % ONBOARDING_SLIDES.length;

      scrollRef.current?.scrollTo({
        x: nextIndex * containerWidth,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [containerWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    setContainerWidth((prevWidth) => {
      if (Math.abs(prevWidth - nextWidth) < 1) {
        return prevWidth;
      }

      return nextWidth;
    });
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (containerWidth <= 0) {
      return;
    }

    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / containerWidth,
    );

    setActiveIndex(nextIndex);
    isInteractingRef.current = false; // 手動滑動結束，恢復自動輪播
  };

  const handleScrollBeginDrag = () => {
    isInteractingRef.current = true; // 使用者開始手動滑動，暫停自動輪播
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* 固定不動：切換 slide 時 logo 不會跟著動 */}
      <View style={styles.logoArea}>
        {/* 尺寸依實際 sowah-cover.svg 比例調整 */}
        <SowahLogo width={334} height={311} />
      </View>

      {containerWidth > 0 && (
        <View style={[styles.carousel, { width: containerWidth }]}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={handleScrollBeginDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          >
            {ONBOARDING_SLIDES.map((slide) => {
              return (
                <View
                  key={slide.key}
                  style={[styles.slide, { width: containerWidth }]}
                >
                  <Text style={styles.tagline}>{slide.tagline}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.dots}>
        {ONBOARDING_SLIDES.map((slide, index) => {
          return (
            <View
              key={slide.key}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1, // 舊：輪播吃滿畫面並置中內容（貼底按鈕排版時使用，保留備用）
    // transform: [{ translateY: -70 }], // 已移到 OnboardingPage 的 content，讓按鈕一起上移
    alignSelf: "stretch", // 高度依內容撐開、寬度撐滿（讓按鈕可貼在 dots 下方）
    alignItems: "center",
    justifyContent: "center",
  },
  logoArea: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    marginBottom: 20,
  },
  carousel: {
    // 高度交給 slide 內文撐開，ScrollView 只包文字
  },
  slide: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    textAlign: "center",
    color: "#7A7A7A",
  },
  dots: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
  },
  dotActive: {
    backgroundColor: "#FF8A22",
  },
});
