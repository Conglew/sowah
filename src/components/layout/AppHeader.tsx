import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import dayjs from "dayjs";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import DateStrip from "@/src/components/date/DataStrip";
import SowahLogo from "@/src/assets/images/sowah-logo.svg";
// import { red } from "react-native-reanimated/lib/typescript/Colors";

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
      <View style={styles.logoArea}>
        <SowahLogo width={127} height={64} />
      </View>

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
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  logoArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
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
