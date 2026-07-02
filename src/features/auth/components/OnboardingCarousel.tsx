import { useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import SowahLogo from "@/src/assets/images/sowah-logo.svg";

type OnboardingSlide = {
  key: string;
  tagline: string;
};

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
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {ONBOARDING_SLIDES.map((slide) => {
            return (
              <View
                key={slide.key}
                style={[styles.slide, { width: containerWidth }]}
              >
                <View style={styles.illustration}>
                  {/* TODO: 之後換成正式角色插圖 asset（目前用 logo 佔位） */}
                  <SowahLogo width={180} height={92} />
                </View>

                <Text style={styles.tagline}>{slide.tagline}</Text>
              </View>
            );
          })}
        </ScrollView>
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
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  illustration: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    textAlign: "center",
    color: "#7A7A7A",
  },
  dots: {
    marginTop: 24,
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
