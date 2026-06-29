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

import { getCountryFlag } from "@/src/shared/utils/country-flag";

type EventSchedulePanelProps = {
  visible: boolean;
  selectedDate: string;
  onClose?: () => void;
  onCreateEvent?: () => void;
};

type MockParticipant = {
  id: string;
  name: string;
  countryCode: string;
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
const tomorrowId = dayjs().add(1, "day").format("YYYY-MM-DD");
const twoDaysLaterId = dayjs().add(2, "day").format("YYYY-MM-DD");
const yesterdayId = dayjs().subtract(1, "day").format("YYYY-MM-DD");

const nextAvailableTime = dayjs().add(1, "hour").minute(0).second(0);
const laterAvailableTime = dayjs().add(2, "hour").minute(30).second(0);

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
      { id: "participant-1", name: "cutty_fram", countryCode: "TW" },
      { id: "participant-2", name: "samijma_184", countryCode: "TH" },
      { id: "participant-3", name: "mika_092", countryCode: "JP" },
      { id: "participant-4", name: "leo_travel", countryCode: "US" },
    ],
  },
  {
    id: "event-2",
    date: todayId,
    title: "Language Exchange: Travel English",
    startTime: nextAvailableTime.format("HH:mm"),
    color: "#4A90E2",
    isJoinedByMe: false,
    maxParticipants: 6,
    discussionGuide:
      "1. What English phrases do you use when traveling? 2. Have you ever had trouble communicating abroad? 3. What travel situation do you want to practice?",
    participants: [
      { id: "participant-5", name: "emily_words", countryCode: "US" },
      { id: "participant-6", name: "ryo_study", countryCode: "JP" },
      { id: "participant-7", name: "minji_lang", countryCode: "KR" },
    ],
  },
  {
    id: "event-3",
    date: todayId,
    title: "Weekend Plans",
    startTime: laterAvailableTime.format("HH:mm"),
    color: "#A8A8A8",
    isJoinedByMe: false,
    maxParticipants: 3,
    discussionGuide:
      "1. What are your plans for this weekend? 2. Will you stay home or go somewhere? 3. What kind of weekend helps you recharge?",
    participants: [
      { id: "participant-8", name: "sora_daily", countryCode: "SG" },
      { id: "participant-9", name: "mimi_talks", countryCode: "MY" },
      { id: "participant-10", name: "jun_park", countryCode: "KR" },
    ],
  },
  {
    id: "event-4",
    date: todayId,
    title: "Past Event: Morning Coffee Chat",
    startTime: "00:00",
    color: "#B48A5A",
    isJoinedByMe: false,
    maxParticipants: 4,
    discussionGuide:
      "1. How do you usually start your morning? 2. Do you prefer coffee, tea, or something else? 3. What small habit makes your day better?",
    participants: [
      { id: "participant-11", name: "coffee_ken", countryCode: "JP" },
      { id: "participant-12", name: "lin_morning", countryCode: "TW" },
    ],
  },
  {
    id: "event-5",
    date: tomorrowId,
    title: "Food Memories",
    startTime: "11:00",
    color: "#FF9F43",
    isJoinedByMe: false,
    maxParticipants: 5,
    discussionGuide:
      "1. What food reminds you of home? 2. Who made it for you? 3. Is there a dish you want others to try?",
    participants: [
      { id: "participant-13", name: "thai_foodie", countryCode: "TH" },
      { id: "participant-14", name: "viet_taste", countryCode: "VN" },
    ],
  },
  {
    id: "event-6",
    date: yesterdayId,
    title: "Book Recommendations",
    startTime: "21:00",
    color: "#8E44AD",
    isJoinedByMe: false,
    maxParticipants: 5,
    discussionGuide:
      "1. What book would you recommend to others? 2. What did it teach you? 3. Do you prefer fiction, non-fiction, or essays?",
    participants: [
      { id: "participant-15", name: "book_mai", countryCode: "VN" },
      { id: "participant-16", name: "reader_sam", countryCode: "SG" },
    ],
  },
  {
    id: "event-7",
    date: twoDaysLaterId,
    title: "Career Talk: First Job Stories",
    startTime: "10:00",
    color: "#6C5CE7",
    isJoinedByMe: true,
    maxParticipants: 4,
    discussionGuide:
      "1. What was your first job? 2. What did you learn from it? 3. What advice would you give to someone starting their career?",
    participants: [
      { id: "participant-17", name: "work_jason", countryCode: "TW" },
      { id: "participant-18", name: "aiko_design", countryCode: "JP" },
      { id: "participant-19", name: "dev_park", countryCode: "KR" },
    ],
  },
  {
    id: "event-8",
    date: twoDaysLaterId,
    title: "Music That Changed Your Mood",
    startTime: "16:30",
    color: "#E84393",
    isJoinedByMe: false,
    maxParticipants: 6,
    discussionGuide:
      "1. What song can instantly change your mood? 2. When did you first hear it? 3. Do you prefer lyrics, melody, or rhythm?",
    participants: [
      { id: "participant-20", name: "music_lee", countryCode: "KR" },
      { id: "participant-21", name: "aya_song", countryCode: "JP" },
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

const getEventDateTime = (event: MockEvent) => {
  return dayjs(`${event.date} ${event.startTime}`, "YYYY-MM-DD HH:mm");
};

const isEventExpired = (event: MockEvent) => {
  return getEventDateTime(event).isBefore(dayjs());
};

const isEventFull = (event: MockEvent) => {
  return event.participants.length >= event.maxParticipants;
};

const canJoinEvent = (event: MockEvent) => {
  return !event.isJoinedByMe && !isEventExpired(event) && !isEventFull(event);
};

const getJoinDisabledReason = (event: MockEvent) => {
  if (event.isJoinedByMe) {
    return "Already joined";
  }

  if (isEventExpired(event)) {
    return "This event has already started.";
  }

  if (isEventFull(event)) {
    return "This event is full.";
  }

  return null;
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
            const isParticipantListVisible =
              participantListEventId === event.id;

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
  const joinDisabledReason = getJoinDisabledReason(event);
  const isJoinDisabled = !canJoinEvent(event);

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
                    <View key={participant.id} style={styles.participantRow}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {participant.name.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.participantName}>
                        {participant.name}
                      </Text>

                      <Text style={styles.participantFlag}>
                        {getCountryFlag(participant.countryCode)}
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
              <>
                {joinDisabledReason && (
                  <Text style={styles.joinDisabledReason}>
                    {joinDisabledReason}
                  </Text>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isJoinDisabled}
                  style={[
                    styles.joinButton,
                    isJoinDisabled && styles.joinButtonDisabled,
                  ]}
                >
                  <Text style={styles.joinButtonText}>
                    {isJoinDisabled ? "Unavailable" : "Join"}
                  </Text>
                </TouchableOpacity>
              </>
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
  discussionGuideText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#A8A8A8",
  },
  joinButton: {
    height: 40,
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#FF7A00",
    alignItems: "center",
    justifyContent: "center",
  },
  joinDisabledReason: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    color: "#AAAAAA",
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
});
