import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { haptics } from "@/src/shared/utils/haptics";
import { useProfile } from "../hooks/useProfile";
import type { ProfileVariant } from "../types/profile.types";
import {
  ProfileBackgroundGallery,
  type GalleryMode,
} from "./ProfileBackgroundGallery";
import { ProfileCard } from "./ProfileCard";

type Props = {
  variant: ProfileVariant;
  userId?: string;
};

// snap 位置（螢幕高度百分比）。
const SNAP_POINTS: string[] = ["46.5%", "75%"];
// 進 grid 時卡片停在 46.5%（index 0）；grid 拖到 75%（index 1）以上切回 stack。
const GRID_SNAP_INDEX = 0;
const STACK_SNAP_INDEX = 1;

export function ProfileView({ variant, userId }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { height } = useWindowDimensions();
  const { profile, isLoading, error } = useProfile({ variant, userId });

  // 折疊時卡片露出的高度 → 傳給背景當底部 padding
  const collapsedSheetHeight = useMemo(
    () => height * (parseInt(SNAP_POINTS[0], 10) / 100),
    [height],
  );

  const [mode, setMode] = useState<GalleryMode>("stack");

  // 每次此頁 focus（點 Footer Profile 切進來 / 切回分頁）：
  // 回到預設堆疊模式、卡片 snap 到 75%（STACK_SNAP_INDEX），並 +1 重播進場動畫。
  const [playToken, setPlayToken] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setMode("stack");
      sheetRef.current?.snapToIndex(STACK_SNAP_INDEX);
      setPlayToken((token) => token + 1);
    }, []),
  );

  // 點堆疊整體 → 進 grid，並把卡片降到 46.5%（index 0）
  const handleRequestGrid = () => {
    setMode("grid");
    sheetRef.current?.snapToIndex(GRID_SNAP_INDEX);
  };

  // grid 模式時卡片被拖到 75%（含以上）→ 切回堆疊
  const handleSheetChange = (index: number) => {
    if (index >= 0) {
      haptics.selection();
    }
    if (mode === "grid" && index >= STACK_SNAP_INDEX) {
      setMode("stack");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error?.message ?? "找不到這個使用者"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ProfileBackgroundGallery
        months={profile.gallery}
        collapsedSheetHeight={collapsedSheetHeight}
        mode={mode}
        onRequestGrid={handleRequestGrid}
        playToken={playToken}
      />

      <BottomSheet
        ref={sheetRef}
        index={1} // 1 = 一進來就展開（第一張圖）
        snapPoints={SNAP_POINTS}
        enablePanDownToClose={false}
        // 限制最高只能到 65%（SNAP_POINTS 最大值）：
        // 關掉依內容自動加 snap、以及超過頂端的橡皮筋過拖
        enableDynamicSizing={false}
        enableOverDrag={false}
        onChange={handleSheetChange}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackgroundTransparent}
        backgroundComponent={({ style }) => (
          <LinearGradient
            colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,1)"]}
            locations={[0, 0.63]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[style, styles.gradientBackground]}
          />
        )}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <ProfileCard
            variant={variant}
            profile={profile}
            // TODO: 接上實際行為
            onPressPrimary={() => {}}
            onPressSecondary={() => {}}
            onPressCheckIn={() => {}}
            onPressMoreContent={() => {}}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // 不設 backgroundColor，讓底下的相簿能透過漸層上緣露出
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    color: "#666666",
    fontSize: 15,
  },
  sheetBackgroundTransparent: {
    backgroundColor: "transparent",
    // 陰影留在這層（透明背景也能投影）
    // shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  gradientBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden", // 讓漸層被圓角裁切
  },
  handleIndicator: {
    backgroundColor: "#D0D0D0",
    width: 44,
  },
  sheetContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
});
