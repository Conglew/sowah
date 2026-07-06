import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef } from "react";
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
import { ProfileBackgroundGallery } from "./ProfileBackgroundGallery";
import { ProfileCard } from "./ProfileCard";

type Props = {
  variant: ProfileVariant;
  userId?: string;
};

// 折疊 / 展開兩個 snap 位置（螢幕高度百分比）。
// 這兩個值是純設計手感，實機上自行微調即可。
const SNAP_POINTS: string[] = ["16%", "78%"];

export function ProfileView({ variant, userId }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { height } = useWindowDimensions();
  const { profile, isLoading, error } = useProfile({ variant, userId });

  // 折疊時卡片露出的高度 → 傳給背景當底部 padding
  const collapsedSheetHeight = useMemo(
    () => height * (parseInt(SNAP_POINTS[0], 10) / 100),
    [height],
  );

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
      />

      <BottomSheet
        ref={sheetRef}
        index={1} // 1 = 一進來就展開（第一張圖）
        snapPoints={SNAP_POINTS}
        enablePanDownToClose={false}
        onChange={(index) => {
          // 每次 snap 定位給一下最輕的系統選取回饋
          if (index >= 0) {
            haptics.selection();
          }
        }}
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
