import dayjs from "dayjs";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type EventSchedulePanelProps = {
  visible: boolean;
  selectedDate: string;
  onClose?: () => void;
  onCreateEvent?: () => void;
};

type MockEvent = {
  id: string;
  date: string;
  title: string;
  startTime: string;
  participantText: string;
  color: string;
  isJoinedByMe: boolean;
};

const mockEvents: MockEvent[] = [
  {
    id: "event-1",
    date: dayjs().format("YYYY-MM-DD"),
    title: "Small Talk",
    startTime: "09:00",
    participantText: "4/6",
    color: "#CFCFCF",
    isJoinedByMe: true,
  },
];

const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
};

const sortEventsByTime = (events: MockEvent[]) => {
  return [...events].sort((a, b) => {
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
};

export default function EventSchedulePanel({
  visible,
  selectedDate,
  onClose,
  onCreateEvent,
}: EventSchedulePanelProps) {
  const groupedEvents = useMemo(() => {
    const eventsOfSelectedDate = mockEvents.filter((event) => {
      return event.date === selectedDate;
    });

    const yourEvents = sortEventsByTime(
      eventsOfSelectedDate.filter((event) => event.isJoinedByMe),
    );

    const yourEventIds = new Set(yourEvents.map((event) => event.id));

    const joinEvents = sortEventsByTime(
      eventsOfSelectedDate.filter((event) => {
        return !event.isJoinedByMe && !yourEventIds.has(event.id);
      }),
    );

    return {
      yourEvents,
      joinEvents,
    };
  }, [selectedDate]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View />

        <TouchableOpacity activeOpacity={0.75} style={styles.createButton}>
          <Text style={styles.createButtonText}>Create</Text>
          <Text style={styles.createButtonIcon}>＋</Text>
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
        <EventSectionBlock
          title="Your Events"
          events={groupedEvents.yourEvents}
        />

        <EventSectionBlock
          title="Join New Events"
          events={groupedEvents.joinEvents}
        />
      </ScrollView>
    </View>
  );
}

type EventSectionBlockProps = {
  title: string;
  events: MockEvent[];
};

function EventSectionBlock({ title, events }: EventSectionBlockProps) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {events.length === 0 ? (
        <Text style={styles.emptyText}>
          No other events available on this day.
        </Text>
      ) : (
        <View style={styles.eventList}>
          {events.map((event) => {
            return <EventRow key={event.id} event={event} />;
          })}
        </View>
      )}
    </View>
  );
}

type EventRowProps = {
  event: MockEvent;
};

function EventRow({ event }: EventRowProps) {
  return (
    <View style={styles.eventSlotRow}>
      <Text style={styles.timeText}>{event.startTime}</Text>

      <View style={styles.eventArea}>
        <View style={styles.eventRow}>
          <View
            style={[
              styles.eventColorBar,
              {
                backgroundColor: event.color,
              },
            ]}
          />

          <Text
            style={[
              styles.eventTitle,
              {
                color: event.color,
              },
            ]}
            numberOfLines={1}
          >
            {event.title}
          </Text>

          <Text
            style={[
              styles.participantText,
              {
                color: event.color,
              },
            ]}
          >
            {event.participantText}
          </Text>

          <Text
            style={[
              styles.personIcon,
              {
                color: event.color,
              },
            ]}
          >
            ●
          </Text>
        </View>
      </View>
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
  // panelHeader: {
  //   marginBottom: 12,
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  // },
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
    paddingBottom: 100,
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 14,
    fontSize: 18,
    fontWeight: "500",
    color: "#111111",
  },
  eventList: {
    gap: 10,
  },
  eventSlotRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    width: 48,
    fontSize: 12,
    color: "#6F6F6F",
  },
  eventArea: {
    flex: 1,
  },
  eventRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderBottomColor: "#BDBDBD",
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
    fontWeight: "500",
  },
  participantText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  personIcon: {
    marginLeft: 6,
    fontSize: 10,
  },
  emptyText: {
    fontSize: 12,
    color: "#AAAAAA",
  },
  panelHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  createButton: {
    minWidth: 102,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  createButtonIcon: {
    marginLeft: 3,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "300",
    color: "#FFFFFF",
  },
});
