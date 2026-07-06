import dayjs from "dayjs";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import SowahLogo from "@/src/assets/images/sowah-logo.svg";
import DateStrip from "@/src/components/date/DateStrip";

// logo 區固定高度：logo 64 + 上下留白。profile.tsx 需要對齊時可 import 這個值。
export const LOGO_HEADER_HEIGHT = 78;

/** 只有 SoWah logo 的 header 區塊，AppHeader 與 profile 頁共用。 */
export function AppLogoHeader() {
  return (
    <View style={styles.logoOnlyArea}>
      <SowahLogo width={127} height={64} />
    </View>
  );
}

type AppHeaderProps = {
  selectedDate: string;
  onDateChange: (dateId: string) => void;
  onJoinNewEvents: () => void;
  isEventPanelOpen: boolean;
};

export default function AppHeader({
  selectedDate,
  onDateChange,
  onJoinNewEvents,
  isEventPanelOpen,
}: AppHeaderProps) {
  const currentMonth = dayjs(selectedDate).format("MMM").toUpperCase();
  const currentYear = dayjs(selectedDate).format("YYYY");

  const joinButtonOpacity = useSharedValue(isEventPanelOpen ? 0 : 1);

  useEffect(() => {
    joinButtonOpacity.value = withTiming(isEventPanelOpen ? 0 : 1, {
      duration: 120,
    });
  }, [isEventPanelOpen, joinButtonOpacity]);

  const joinButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: joinButtonOpacity.value,
    };
  });

  return (
    <View style={styles.header}>
      {/* 共用的 logo 區 */}
      <AppLogoHeader />

      <View style={styles.monthRow}>
        <View style={styles.monthTextRow}>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <Text style={styles.yearText}>{currentYear}</Text>
        </View>

        <Animated.View style={joinButtonAnimatedStyle}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onJoinNewEvents}
            disabled={isEventPanelOpen}
          >
            <Text style={styles.joinText}>JOIN NEW EVENTS</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <DateStrip selectedDate={selectedDate} onDateChange={onDateChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  logoOnlyArea: {
    height: LOGO_HEADER_HEIGHT,
    paddingTop: 8, // 對齊 AppHeader 的 header.paddingTop，讓 logo 位置一致
    alignItems: "center",
    justifyContent: "center",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    width: 52,
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  yearText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FF9F5A",
  },
  joinText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#111111",
  },
});