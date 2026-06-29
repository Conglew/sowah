import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  GestureResponderEvent,
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

type MockParticipant = {
  id: string;
  name: string;
  flag: string;
};

type MockEvent = {
  id: string;
  date: string;
  title: string;
  startTime: string;
  color: string;
  isJoinedByMe: boolean;
  maxParticipants: number;
  discussionGuide: string;
  participants: MockParticipant[];
};

const todayId = dayjs().format("YYYY-MM-DD");

const mockEvents: MockEvent[] = [
  {
    id: "event-1",
    date: todayId,
    title: "Small Talk",
    startTime: "09:00",
    color: "#CFCFCF",
    isJoinedByMe: true,
    maxParticipants: 6,
    discussionGuide:
      "1. What topic would you like to talk about today? 2. What made your day memorable? 3. What would you like to share with others?",
    participants: [
      {
        id: "participant-1",
        name: "cutty_fram",
        flag: "🇹🇼",
      },
      {
        id: "participant-2",
        name: "samijma_184",
        flag: "🇹🇭",
      },
      {
        id: "participant-3",
        name: "mika_092",
        flag: "🇯🇵",
      },
      {
        id: "participant-4",
        name: "leo_travel",
        flag: "🇺🇸",
      },
    ],
  },
  {
    id: "event-2",
    date: todayId,
    title: "What's on Your Bucket List?",
    startTime: "10:30",
    color: "#FF7A00",
    isJoinedByMe: true,
    maxParticipants: 5,
    discussionGuide:
      "1. What is one thing you really want to do in your life? 2. Why is it meaningful to you? 3. Who would you like to experience it with?",
    participants: [
      {
        id: "participant-5",
        name: "amy_life",
        flag: "🇹🇼",
      },
      {
        id: "participant-6",
        name: "ken_trip",
        flag: "🇯🇵",
      },
      {
        id: "participant-7",
        name: "nora_88",
        flag: "🇰🇷",
      },
    ],
  },
  {
    id: "event-3",
    date: todayId,
    title: "If Money Wasn't a Problem, What...",
    startTime: "13:30",
    color: "#45C86A",
    isJoinedByMe: true,
    maxParticipants: 2,
    discussionGuide:
      "1. If money was not a problem, what would you do first? 2. Where would you go? 3. What kind of life would you like to build?",
    participants: [
      {
        id: "participant-8",
        name: "hana_green",
        flag: "🇹🇼",
      },
      {
        id: "participant-9",
        name: "yuki_121",
        flag: "🇯🇵",
      },
    ],
  },
  {
    id: "event-4",
    date: todayId,
    title: "The Most Memorable Person in Your Life",
    startTime: "14:00",
    color: "#606060",
    isJoinedByMe: false,
    maxParticipants: 3,
    discussionGuide:
      "1. Who is the most memorable person in your life? 2. How did you meet this person? 3. What makes this person memorable? 4. Did this person change your life in any way? 5. What qualities do you admire most about them? 6. How often do you see or talk to them now?",
    participants: [
      {
        id: "participant-10",
        name: "cutty_fram",
        flag: "🇹🇼",
      },
      {
        id: "participant-11",
        name: "samijma_184",
        flag: "🇹🇭",
      },
    ],
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
  onCreateEvent,
}: EventSchedulePanelProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [participantListEventId, setParticipantListEventId] = useState<
    string | null
  >(null);

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

  const handleToggleEvent = (eventId: string) => {
    setExpandedEventId((currentEventId) => {
      const nextEventId = currentEventId === eventId ? null : eventId;

      if (nextEventId === null) {
        setParticipantListEventId(null);
      }

      return nextEventId;
    });
  };

  const handleToggleParticipants = (
    pressEvent: GestureResponderEvent,
    eventId: string,
  ) => {
    pressEvent.stopPropagation();

    if (expandedEventId !== eventId) {
      return;
    }

    setParticipantListEventId((currentEventId) => {
      return currentEventId === eventId ? null : eventId;
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.createButton}
          onPress={onCreateEvent}
        >
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
          expandedEventId={expandedEventId}
          participantListEventId={participantListEventId}
          onToggleEvent={handleToggleEvent}
          onToggleParticipants={handleToggleParticipants}
        />

        <EventSectionBlock
          title="Join New Events"
          events={groupedEvents.joinEvents}
          expandedEventId={expandedEventId}
          participantListEventId={participantListEventId}
          onToggleEvent={handleToggleEvent}
          onToggleParticipants={handleToggleParticipants}
        />
      </ScrollView>
    </View>
  );
}

type EventSectionBlockProps = {
  title: string;
  events: MockEvent[];
  expandedEventId: string | null;
  participantListEventId: string | null;
  onToggleEvent: (eventId: string) => void;
  onToggleParticipants: (
    pressEvent: GestureResponderEvent,
    eventId: string,
  ) => void;
};

function EventSectionBlock({
  title,
  events,
  expandedEventId,
  participantListEventId,
  onToggleEvent,
  onToggleParticipants,
}: EventSectionBlockProps) {
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
            const isExpanded = expandedEventId === event.id;
            const isParticipantListVisible = participantListEventId === event.id;

            return (
              <EventRow
                key={event.id}
                event={event}
                isExpanded={isExpanded}
                isParticipantListVisible={isParticipantListVisible}
                onToggleEvent={onToggleEvent}
                onToggleParticipants={onToggleParticipants}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

type EventRowProps = {
  event: MockEvent;
  isExpanded: boolean;
  isParticipantListVisible: boolean;
  onToggleEvent: (eventId: string) => void;
  onToggleParticipants: (
    pressEvent: GestureResponderEvent,
    eventId: string,
  ) => void;
};

function EventRow({
  event,
  isExpanded,
  isParticipantListVisible,
  onToggleEvent,
  onToggleParticipants,
}: EventRowProps) {
  const participantText = `${event.participants.length}/${event.maxParticipants}`;
  const isFull = event.participants.length >= event.maxParticipants;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.eventSlotRow}
      onPress={() => onToggleEvent(event.id)}
    >
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
            numberOfLines={isExpanded ? 2 : 1}
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
            {participantText}
          </Text>

          <TouchableOpacity
            activeOpacity={0.75}
            disabled={!isExpanded}
            style={styles.personIconButton}
            onPress={(pressEvent) => onToggleParticipants(pressEvent, event.id)}
          >
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
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {isParticipantListVisible && (
              <View style={styles.participantList}>
                {event.participants.map((participant) => {
                  return (
                    <View
                      key={participant.id}
                      style={styles.participantRow}
                    >
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {participant.name.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.participantName}>
                        {participant.name}
                      </Text>

                      <Text style={styles.participantFlag}>
                        {participant.flag}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={styles.discussionGuideText}>
              {event.discussionGuide}
            </Text>

            {!event.isJoinedByMe && (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isFull}
                style={[
                  styles.joinButton,
                  isFull && styles.joinButtonDisabled,
                ]}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            )}

            <View style={styles.expandedDivider} />
          </View>
        )}
      </View>
    </TouchableOpacity>
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
    alignItems: "flex-start",
  },
  timeText: {
    width: 48,
    paddingTop: 3,
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
    borderBottomColor: "#777777",
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
  personIconButton: {
    width: 22,
    height: 22,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  personIcon: {
    fontSize: 10,
  },
  expandedContent: {
    paddingTop: 10,
    paddingLeft: 0,
  },
  discussionGuideText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#A8A8A8",
  },
  participantList: {
    marginBottom: 12,
    gap: 10,
  },
  participantRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  participantName: {
    fontSize: 16,
    color: "#606060",
  },
  participantFlag: {
    marginLeft: 8,
    fontSize: 18,
  },
  joinButton: {
    height: 40,
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#FF7A00",
    alignItems: "center",
    justifyContent: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#D8D8D8",
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  expandedDivider: {
    marginTop: 16,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderBottomColor: "#999999",
  },
  emptyText: {
    fontSize: 12,
    color: "#AAAAAA",
  },
  panelHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
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