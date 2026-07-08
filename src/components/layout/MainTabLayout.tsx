import dayjs from "dayjs";
import { usePathname, useRouter } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import EventSchedulePanel from "@/src/features/events/components/EventSchedulePanel";
import { useHomeFeedControlStore } from "@/src/features/home/stores/home-feed-control.store";
import AppFooter from "./AppFooter";
import AppHeader, { AppLogoHeader } from "./AppHeader";

type MainTabLayoutProps = {
  children: ReactNode;
};

// 完全不顯示 header 的頁（目前無）
const HIDE_HEADER_PATHS: string[] = [];
// 只顯示 SoWah logo（不含月份 / DateStrip）的頁
const LOGO_ONLY_PATHS = ["/profile", "/group", "/private"];

export default function MainTabLayout({ children }: MainTabLayoutProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const resetFeedToken = useHomeFeedControlStore(
    (state) => state.resetFeedToken,
  );

  const shouldHideHeader = HIDE_HEADER_PATHS.includes(pathname);
  const isLogoOnly = LOGO_ONLY_PATHS.includes(pathname);

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [isEventPanelOpen, setIsEventPanelOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (resetFeedToken === 0) {
      return;
    }

    setIsEventPanelOpen(false);
  }, [resetFeedToken]);

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

  const router = useRouter();

  const handleCreateEvent = () => {
    setIsEventPanelOpen(false);
    router.push("/create-topic");
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {!shouldHideHeader && (
          <View style={styles.headerLayer} onLayout={handleHeaderLayout}>
            {isLogoOnly ? (
              <AppLogoHeader />
            ) : (
              <AppHeader
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                onJoinNewEvents={handleJoinNewEvents}
                isEventPanelOpen={isEventPanelOpen}
              />
            )}
          </View>
        )}

        <View style={styles.content}>{children}</View>
      </SafeAreaView>

      {/* 事件排程面板：只有完整 header（首頁）才會用到 */}
      {!shouldHideHeader && !isLogoOnly && isEventPanelOpen && (
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
            onCreateEvent={handleCreateEvent}
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
