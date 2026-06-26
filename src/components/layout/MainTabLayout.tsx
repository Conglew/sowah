import dayjs from "dayjs";
import { ReactNode, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { usePathname } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import AppFooter from "./AppFooter";
import AppHeader from "./AppHeader";
import EventSchedulePanel from "@/src/components/event/EventSchedulePanel";

type MainTabLayoutProps = {
  children: ReactNode;
};

const HIDE_HEADER_PATHS = ["/group", "/private", "/profile"];

export default function MainTabLayout({ children }: MainTabLayoutProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const shouldHideHeader = HIDE_HEADER_PATHS.includes(pathname);

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [isEventPanelOpen, setIsEventPanelOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    setHeaderHeight((prevHeight) => {
      if (Math.abs(prevHeight - nextHeight) < 1) {
        return prevHeight;
      }

      return nextHeight;
    });
  };

  const handleDateChange = (dateId: string) => {
    setSelectedDate(dateId);
    // setIsEventPanelOpen(true);
  };

  const handleJoinNewEvents = () => {
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
    setIsEventPanelOpen(true);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {!shouldHideHeader && (
          <View style={styles.headerLayer} onLayout={handleHeaderLayout}>
            <AppHeader
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onJoinNewEvents={handleJoinNewEvents}
              isEventPanelOpen={isEventPanelOpen}
            />
          </View>
        )}

        <View style={styles.content}>{children}</View>
      </SafeAreaView>

      {!shouldHideHeader && isEventPanelOpen && (
        <View
          style={[
            styles.scheduleOverlay,
            {
              top: insets.top + headerHeight,
            },
          ]}
        >
          <EventSchedulePanel
            visible={isEventPanelOpen}
            selectedDate={selectedDate}
            onClose={() => setIsEventPanelOpen(false)}
          />
        </View>
      )}

      <View style={styles.footerLayer}>
        <AppFooter />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerLayer: {
    zIndex: 30,
    elevation: 30,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scheduleOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    elevation: 40,
    backgroundColor: "#FFFFFF",
  },
  footerLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
});
