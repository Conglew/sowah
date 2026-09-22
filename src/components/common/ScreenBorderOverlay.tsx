import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  MATCH_FRAME_ENABLED,
  useMatchFrameStore,
} from "@/src/stores/match-frame.store";

const FRAME_WIDTH = 7;
// n=2 是正圓；2.05 保留極輕微的 continuous-corner 過渡，同時避免 n<2 的菱形肩角。
const SUPERELLIPSE_EXPONENT = 1.85;
// 高密度取樣降低 SVG 折線感；每個 90° 轉角約每 0.94° 一個點。
const CORNER_SEGMENTS = 270;

type Point = { x: number; y: number };

function estimateDeviceCornerRadius(
  screenWidth: number,
  topInset: number,
  bottomInset: number,
) {
  const hasRoundedScreen = topInset >= 20 || bottomInset >= 16;
  if (!hasRoundedScreen) return 0;

  const widthRadius = screenWidth * 0.14;
  const insetRadius =
    topInset >= 55 ? 64 : topInset >= 47 ? 56 : topInset >= 40 ? 50 : 42;

  return Math.min(widthRadius, insetRadius);
}

function pointOnSuperellipseCorner(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
) {
  const power = 2 / SUPERELLIPSE_EXPONENT;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: centerX + Math.sign(cos) * radius * Math.abs(cos) ** power,
    y: centerY + Math.sign(sin) * radius * Math.abs(sin) ** power,
  };
}

/** 建立 superellipse 後沿各點的內法線等距位移，讓轉角維持固定粗細。 */
function createInsetSuperellipsePath(
  width: number,
  height: number,
  requestedRadius: number,
  inset: number,
) {
  const radius = Math.max(0, Math.min(requestedRadius, width / 2, height / 2));
  if (radius === 0) {
    return `M ${inset} ${inset} H ${width - inset} V ${height - inset} H ${inset} Z`;
  }

  const outerPoints: Point[] = [
    { x: radius, y: 0 },
    { x: width - radius, y: 0 },
  ];
  const corners = [
    { cx: width - radius, cy: radius, from: -Math.PI / 2 },
    { cx: width - radius, cy: height - radius, from: 0 },
    { cx: radius, cy: height - radius, from: Math.PI / 2 },
    { cx: radius, cy: radius, from: Math.PI },
  ];

  corners.forEach((corner, cornerIndex) => {
    const lastStep =
      cornerIndex === corners.length - 1
        ? CORNER_SEGMENTS - 1
        : CORNER_SEGMENTS;
    for (let step = 1; step <= lastStep; step += 1) {
      const angle = corner.from + (Math.PI / 2) * (step / CORNER_SEGMENTS);
      outerPoints.push(
        pointOnSuperellipseCorner(corner.cx, corner.cy, radius, angle),
      );
    }

    if (cornerIndex === 0) outerPoints.push({ x: width, y: height - radius });
    if (cornerIndex === 1) outerPoints.push({ x: radius, y: height });
    if (cornerIndex === 2) outerPoints.push({ x: 0, y: radius });
  });

  const innerPoints = outerPoints.map((point, index) => {
    const previous =
      outerPoints[(index - 1 + outerPoints.length) % outerPoints.length];
    const next = outerPoints[(index + 1) % outerPoints.length];
    const tangentX = next.x - previous.x;
    const tangentY = next.y - previous.y;
    const tangentLength = Math.hypot(tangentX, tangentY) || 1;

    // 路徑為順時針，右法線 (-dy, dx) 指向圖形內部。
    return {
      x: point.x + (-tangentY / tangentLength) * inset,
      y: point.y + (tangentX / tangentLength) * inset,
    };
  });

  return innerPoints
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .concat("Z")
    .join(" ");
}

/**
 * 外層橘色填滿 viewport，由系統裁出設備外輪廓；內層用 superellipse 挖空，
 * 形成轉角平滑且視覺粗細一致的橘色環。
 */
export default function ScreenBorderOverlay() {
  const isMatching = useMatchFrameStore((state) => state.status === "matching");
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const ringPath = useMemo(() => {
    const deviceRadius = estimateDeviceCornerRadius(
      width,
      insets.top,
      insets.bottom,
    );
    const outerRect = `M 0 0 H ${width} V ${height} H 0 Z`;
    const innerRect = createInsetSuperellipsePath(
      width,
      height,
      deviceRadius,
      FRAME_WIDTH,
    );

    return `${outerRect} ${innerRect}`;
  }, [height, insets.bottom, insets.top, width]);

  useEffect(() => {
    if (__DEV__) {
      console.info(
        `[matchmaking] global border: ${isMatching ? "visible" : "hidden"}`,
      );
    }
  }, [isMatching]);

  if (!MATCH_FRAME_ENABLED || !isMatching) return null;

  return (
    <View pointerEvents="none" collapsable={false} style={styles.overlay}>
      <Svg pointerEvents="none" width={width} height={height}>
        <Path
          pointerEvents="none"
          d={ringPath}
          fill="#FF8100"
          fillRule="evenodd"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
