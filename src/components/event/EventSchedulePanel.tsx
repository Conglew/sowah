import dayjs from "dayjs";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type EventSchedulePanelProps = {
  visible: boolean;
  selectedDate: string;
  onClose?: () => void;
};

type MockEvent = {
  id: string;
  title: string;
  startTime: string;
  participantText: string;
  color: string;
};

const mockEvents: MockEvent[] = [
  {
    id: "event-1",
    title: "Small Talk",
    startTime: "09:00",
    participantText: "4/6",
    color: "#CFCFCF",
  },
  {
    id: "event-2",
    title: "What's on Your Bucket List?",
    startTime: "10:30",
    participantText: "3/5",
    color: "#FF8A22",
  },
  {
    id: "event-3",
    title: "If Money Wasn't a Problem, What...",
    startTime: "13:00",
    participantText: "2/2",
    color: "#45C86A",
  },
];

export default function EventSchedulePanel({
  visible,
  selectedDate,
  onClose,
}: EventSchedulePanelProps) {
  const timeSlots = useMemo(() => {
    const startOfDay = dayjs(selectedDate).startOf("day");

    return Array.from({ length: 48 }, (_, index) => {
      const time = startOfDay.add(index * 30, "minute");

      return {
        id: time.format("HH:mm"),
        timeText: time.format("HH:mm"),
      };
    });
  }, [selectedDate]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>
          {dayjs(selectedDate).format("MMM D")} Events
        </Text>

        <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        {timeSlots.map((slot) => {
          const event = mockEvents.find((item) => item.startTime === slot.timeText);

          return (
            <View key={slot.id} style={styles.slotRow}>
              <Text style={styles.timeText}>{slot.timeText}</Text>

              <View style={styles.eventArea}>
                {event ? (
                  <View style={styles.eventRow}>
                    <View
                      style={[
                        styles.eventColorBar,
                        { backgroundColor: event.color },
                      ]}
                    />

                    <Text
                      style={[styles.eventTitle, { color: event.color }]}
                      numberOfLines={1}
                    >
                      {event.title}
                    </Text>

                    <Text style={[styles.participantText, { color: event.color }]}>
                      {event.participantText}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyLine} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E6E6E6",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  panelHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
  },
  closeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FF8A22",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 94,
  },
  slotRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    width: 48,
    fontSize: 11,
    color: "#888888",
  },
  eventArea: {
    flex: 1,
  },
  eventRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  eventColorBar: {
    width: 6,
    height: 18,
    borderRadius: 3,
    marginRight: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  participantText: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyLine: {
    height: 1,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
  },
});