import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DateItem = {
  id: string;
  day: string;
  dateNumber: string;
  isToday: boolean;
};

type DateStripProps = {
  selectedDate: string;
  onDateChange: (dateId: string) => void;
};

const VISIBLE_DAYS = 7;

export default function DateStrip({
  selectedDate,
  onDateChange,
}: DateStripProps) {
  const listRef = useRef<FlatList<DateItem>>(null);

  // const todayId = dayjs().format('YYYY-MM-DD');
  // const [selectedDate, setSelectedDate] = useState(todayId);
  const [listWidth, setListWidth] = useState(0);

  const dates = useMemo<DateItem[]>(() => {
    const today = dayjs();

    /**
     * 從今天往前 7 天開始
     * 例如今天是 12 號，就從 5 號開始
     */
    const startDate = today.subtract(7, "day");

    return Array.from({ length: 21 }, (_, index) => {
      const date = startDate.add(index, "day");

      return {
        id: date.format("YYYY-MM-DD"),
        day: date.format("ddd").toUpperCase(),
        dateNumber: date.format("D"),
        isToday: date.isSame(today, "day"),
      };
    });
  }, []);

  const todayIndex = dates.findIndex((date) => date.isToday);
  const itemWidth = listWidth > 0 ? listWidth / VISIBLE_DAYS : 42;

  useEffect(() => {
    if (listWidth <= 0) {
      return;
    }

    const targetIndex = dates.findIndex((date) => date.id === selectedDate);

    if (targetIndex < 0) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0.2,
      });
    });
  }, [selectedDate, dates, listWidth]);

  const handleListLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    setListWidth((prevWidth) => {
      if (Math.abs(prevWidth - nextWidth) < 1) {
        return prevWidth;
      }

      return nextWidth;
    });
  };

  //   const scrollToWeek = (direction: 'prev' | 'next') => {
  //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  //     const currentIndex = dates.findIndex((date) => date.id === selectedDate);

  //     const nextIndex =
  //       direction === 'prev'
  //         ? Math.max(currentIndex - 7, 0)
  //         : Math.min(currentIndex + 7, dates.length - 1);

  //     const nextDate = dates[nextIndex];

  //     if (!nextDate) {
  //       return;
  //     }

  //     setSelectedDate(nextDate.id);

  //     listRef.current?.scrollToIndex({
  //       index: nextIndex,
  //       animated: true,
  //       viewPosition: 0,
  //     });
  //   };

  const scrollToDate = (direction: "prev" | "next") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentIndex = dates.findIndex((date) => date.id === selectedDate);

    if (currentIndex < 0) {
      return;
    }

    const nextIndex =
      direction === "prev"
        ? Math.max(currentIndex - 1, 0)
        : Math.min(currentIndex + 1, dates.length - 1);

    const nextDate = dates[nextIndex];

    if (!nextDate) {
      return;
    }

    // setSelectedDate(nextDate.id);
    onDateChange(nextDate.id);

    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
      viewPosition: 0.5,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.arrowButton}
        onPress={() => scrollToDate("prev")}
      >
        <Text style={styles.arrow}>‹</Text>
      </TouchableOpacity>

      <View style={styles.listWrapper} onLayout={handleListLayout}>
        {listWidth > 0 && (
          <FlatList
            ref={listRef}
            horizontal
            data={dates}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={todayIndex >= 0 ? todayIndex : 7}
            getItemLayout={(_, index) => ({
              length: itemWidth,
              offset: itemWidth * index,
              index,
            })}
            snapToInterval={itemWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            bounces={false}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.2,
                });
              });
            }}
            renderItem={({ item }) => {
              const isSelected = selectedDate === item.id;

              return (
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[styles.dateItem, { width: itemWidth }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // setSelectedDate(item.id);
                    onDateChange(item.id);
                  }}
                >
                  <View
                    style={[
                      styles.dateCircle,
                      isSelected && styles.dateCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateNumber,
                        isSelected && styles.dateNumberActive,
                      ]}
                    >
                      {item.dateNumber}
                    </Text>
                  </View>

                  <Text
                    style={[styles.dayText, isSelected && styles.dayTextActive]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.arrowButton}
        onPress={() => scrollToDate("next")}
      >
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
  },
  arrowButton: {
    width: 20,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 26,
    color: "#D0D0D0",
  },
  listWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  dateItem: {
    alignItems: "center",
  },
  dateCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleActive: {
    backgroundColor: "#FFA15C",
  },
  dateNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111111",
  },
  dateNumberActive: {
    color: "#FFFFFF",
  },
  dayText: {
    marginTop: 2,
    fontSize: 8,
    color: "#B5B5B5",
  },
  dayTextActive: {
    color: "#6BD36D",
    fontWeight: "700",
  },
});
