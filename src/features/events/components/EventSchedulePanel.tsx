import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getCountryFlag } from "@/src/shared/utils/country-flag";
import { useAuthStore } from "@/src/stores/auth.store";
import { colors } from "@/src/theme/colors";
import { useJoinEvent } from "../hooks/useJoinEvent";
import { eventsApi } from "../api/events.api";
import type { EventResource } from "../types/events.types";

dayjs.extend(customParseFormat);

const MIN_LOADING_MS = 250;

function minimumLoadingDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS));
}

async function listAllPublicEvents(start: string, end: string) {
  const events: EventResource[] = [];
  const pageSize = 20;
  let offset = 0;

  while (true) {
    const page = await eventsApi.listPublic({
      start,
      end,
      sort: "oldest",
      limit: pageSize,
      offset,
    });
    events.push(...page.events);
    offset += page.events.length;
    if (page.events.length === 0 || offset >= page.total) return events;
  }
}

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

type ScheduleEvent = {
  id: string;
  date: string;
  title: string;
  startTime: string;
  color: string;
  isJoinedByMe: boolean;
  maxParticipants: number;
  discussionGuide: string;
  participants: MockParticipant[];
  participantCount?: number;
  creatorUid?: string;
};
const todayId = dayjs().format("YYYY-MM-DD");
const tomorrowId = dayjs().add(1, "day").format("YYYY-MM-DD");
const twoDaysLaterId = dayjs().add(2, "day").format("YYYY-MM-DD");
const yesterdayId = dayjs().subtract(1, "day").format("YYYY-MM-DD");

const nextAvailableTime = dayjs().add(1, "hour").minute(0).second(0);
const laterAvailableTime = dayjs().add(2, "hour").minute(30).second(0);

const fallbackEvents: ScheduleEvent[] = [
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
    color: colors.brandWarm,
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

const sortEventsByTime = (events: ScheduleEvent[]) => {
  return [...events].sort((a, b) => {
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
};

/** 可參加的活動先依 30 分鐘時段排序；已開始／已額滿的活動移到當天最下面。 */
const sortJoinableEvents = (events: ScheduleEvent[]) => {
  return [...events].sort((a, b) => {
    const availabilityOrder = Number(canJoinEvent(b)) - Number(canJoinEvent(a));
    if (availabilityOrder !== 0) return availabilityOrder;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
};

const getEventDateTime = (event: ScheduleEvent) => {
  return dayjs(`${event.date} ${event.startTime}`, "YYYY-MM-DD HH:mm");
};

const isEventExpired = (event: ScheduleEvent) => {
  return getEventDateTime(event).isBefore(dayjs());
};

const isEventFull = (event: ScheduleEvent) => {
  return (
    (event.participantCount ?? event.participants.length) >=
    event.maxParticipants
  );
};

const canJoinEvent = (event: ScheduleEvent) => {
  return !event.isJoinedByMe && !isEventExpired(event) && !isEventFull(event);
};

const getJoinDisabledReason = (event: ScheduleEvent) => {
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

function toScheduleEvent(
  event: EventResource,
  isJoinedByMe: boolean,
): ScheduleEvent {
  const start = dayjs(event.start);
  return {
    id: event.event_uid,
    date: start.format("YYYY-MM-DD"),
    title: event.title,
    startTime: start.format("HH:mm"),
    color: isJoinedByMe ? "#A8A8A8" : colors.brandWarm,
    isJoinedByMe,
    maxParticipants: event.capacity,
    participantCount: event.participant_count,
    creatorUid: event.creator_uid,
    discussionGuide: event.description,
    participants: [],
  };
}

function isEventResource(value: unknown): value is EventResource {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Partial<EventResource>;
  return (
    typeof event.event_uid === "string" &&
    typeof event.title === "string" &&
    typeof event.description === "string" &&
    typeof event.start === "string" &&
    typeof event.capacity === "number" &&
    typeof event.participant_count === "number"
  );
}

function shouldUseFallback(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return false;
  }
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 404 || status === 405 || status === 501;
}

export default function EventSchedulePanel({
  visible,
  selectedDate,
  onCreateEvent,
}: EventSchedulePanelProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [participantListEventId, setParticipantListEventId] = useState<
    string | null
  >(null);
  // 不要用 fallback 當初始值，否則真實 API 回來前會先閃一下假資料。
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isRefreshingEvents, setIsRefreshingEvents] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const refreshRequestedRef = useRef(false);

  const currentUserUid = useAuthStore((state) => state.user?.user_uid);
  const {
    joiningEventId,
    joinedEventIds,
    leftEventIds,
    joinEvent,
    leavingEventId,
    leaveEvent,
  } = useJoinEvent();

  useEffect(() => {
    if (!visible) return;
    let active = true;
    const isPullToRefresh = refreshRequestedRef.current;
    refreshRequestedRef.current = false;
    if (!isPullToRefresh) {
      setIsLoadingEvents(true);
      setEvents([]);
      setExpandedEventId(null);
      setParticipantListEventId(null);
    }
    const windowStart = dayjs(selectedDate).startOf("day").toISOString();
    const windowEnd = dayjs(selectedDate)
      .add(1, "day")
      .startOf("day")
      .toISOString();

    if (__DEV__) {
      const offsetMinutes = -new Date().getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? "+" : "-";
      const absoluteOffset = Math.abs(offsetMinutes);
      const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(
        2,
        "0",
      );
      const offsetRemainder = String(absoluteOffset % 60).padStart(2, "0");
      console.info(
        `[DEV][Events] device UTC${sign}${offsetHours}:${offsetRemainder}; query [${windowStart}, ${windowEnd})`,
      );
    }

    void Promise.all([
      eventsApi.listJoined({
        start: windowStart,
        end: windowEnd,
        sort: "oldest",
      }),
      listAllPublicEvents(windowStart, windowEnd),
      minimumLoadingDelay(),
    ])
      .then(([joined, publicEvents]) => {
        if (!active) return;
        if (
          !Array.isArray(joined) ||
          !Array.isArray(publicEvents) ||
          joined.some((event) => !isEventResource(event)) ||
          publicEvents.some((event) => !isEventResource(event))
        ) {
          setEvents(fallbackEvents);
          return;
        }
        const joinedIds = new Set(joined.map((event) => event.event_uid));
        const byId = new Map<string, ScheduleEvent>();
        for (const event of publicEvents) {
          byId.set(
            event.event_uid,
            toScheduleEvent(event, joinedIds.has(event.event_uid)),
          );
        }
        for (const event of joined) {
          byId.set(event.event_uid, toScheduleEvent(event, true));
        }
        setEvents(Array.from(byId.values()));
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (shouldUseFallback(error)) {
          setEvents(fallbackEvents);
        } else {
          console.warn("[EventSchedulePanel] load failed", error);
          setEvents([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingEvents(false);
          setIsRefreshingEvents(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshToken, selectedDate, visible]);

  const groupedEvents = useMemo(() => {
    const eventsOfSelectedDate = events
      .filter((event) => event.date === selectedDate)
      // 報名成功後把 isJoinedByMe 疊回去，那一場就會從 "Join New Events" 移到 "Your Events"。
      // 之後接後端時，這層 overlay 換成 store / refetch 即可，下面的分組邏輯不用動。
      .map((event) => {
        if (leftEventIds.has(event.id)) {
          return { ...event, isJoinedByMe: false };
        }
        return joinedEventIds.has(event.id)
          ? { ...event, isJoinedByMe: true }
          : event;
      });

    const yourEvents = sortEventsByTime(
      eventsOfSelectedDate.filter((event) => event.isJoinedByMe),
    );

    const yourEventIds = new Set(yourEvents.map((event) => event.id));

    const joinEvents = sortJoinableEvents(
      eventsOfSelectedDate.filter((event) => {
        return !event.isJoinedByMe && !yourEventIds.has(event.id);
      }),
    );

    return {
      yourEvents,
      joinEvents,
    };
  }, [events, joinedEventIds, leftEventIds, selectedDate]);

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

    const event = events.find((item) => item.id === eventId);
    if (event && event.participants.length === 0 && event.participantCount) {
      void eventsApi
        .listParticipants(eventId, { sort: "oldest", limit: 100, offset: 0 })
        .then((page) => {
          setEvents((current) =>
            current.map((item) =>
              item.id === eventId
                ? {
                    ...item,
                    participants: page.participants.map((participant) => ({
                      id: participant.user_uid,
                      name: participant.profile.user_id,
                      countryCode: participant.profile.country,
                    })),
                  }
                : item,
            ),
          );
        })
        .catch((error: unknown) =>
          console.warn("[EventSchedulePanel] participants failed", error),
        );
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
        alwaysBounceVertical
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingEvents}
            onRefresh={() => {
              refreshRequestedRef.current = true;
              setIsRefreshingEvents(true);
              setRefreshToken((token) => token + 1);
            }}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        {isLoadingEvents ? (
          <View style={styles.eventsLoading}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.eventsLoadingText}>Loading events…</Text>
          </View>
        ) : (
          <>
            <EventSectionBlock
              title="Your Events"
              events={groupedEvents.yourEvents}
              expandedEventId={expandedEventId}
              participantListEventId={participantListEventId}
              joiningEventId={joiningEventId}
              leavingEventId={leavingEventId}
              currentUserUid={currentUserUid}
              onToggleEvent={handleToggleEvent}
              onToggleParticipants={handleToggleParticipants}
              onJoinEvent={joinEvent}
              onLeaveEvent={leaveEvent}
            />

            <EventSectionBlock
              title="Join New Events"
              events={groupedEvents.joinEvents}
              expandedEventId={expandedEventId}
              participantListEventId={participantListEventId}
              joiningEventId={joiningEventId}
              leavingEventId={leavingEventId}
              currentUserUid={currentUserUid}
              onToggleEvent={handleToggleEvent}
              onToggleParticipants={handleToggleParticipants}
              onJoinEvent={joinEvent}
              onLeaveEvent={leaveEvent}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

type EventSectionBlockProps = {
  title: string;
  events: ScheduleEvent[];
  expandedEventId: string | null;
  participantListEventId: string | null;
  /** 正在報名中的活動 id */
  joiningEventId: string | null;
  leavingEventId: string | null;
  currentUserUid?: string;
  onToggleEvent: (eventId: string) => void;
  onToggleParticipants: (
    pressEvent: GestureResponderEvent,
    eventId: string,
  ) => void;
  onJoinEvent: (event: ScheduleEvent) => void;
  onLeaveEvent: (event: ScheduleEvent) => void;
};

function EventSectionBlock({
  title,
  events,
  expandedEventId,
  participantListEventId,
  joiningEventId,
  leavingEventId,
  currentUserUid,
  onToggleEvent,
  onToggleParticipants,
  onJoinEvent,
  onLeaveEvent,
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
          {events.map((event, index) => {
            const isExpanded = expandedEventId === event.id;
            const isParticipantListVisible =
              participantListEventId === event.id;

            return (
              <EventRow
                key={event.id}
                event={event}
                isExpanded={isExpanded}
                isParticipantListVisible={isParticipantListVisible}
                isJoining={joiningEventId === event.id}
                isAnyJoinInFlight={joiningEventId !== null}
                isLeaving={leavingEventId === event.id}
                isAnyLeaveInFlight={leavingEventId !== null}
                canLeave={
                  event.isJoinedByMe &&
                  !isEventExpired(event) &&
                  event.creatorUid !== currentUserUid
                }
                showDivider={index < events.length - 1}
                onToggleEvent={onToggleEvent}
                onToggleParticipants={onToggleParticipants}
                onJoinEvent={onJoinEvent}
                onLeaveEvent={onLeaveEvent}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

type EventRowProps = {
  event: ScheduleEvent;
  isExpanded: boolean;
  isParticipantListVisible: boolean;
  /** 這一場正在報名中 */
  isJoining: boolean;
  /** 任何一場正在報名中：其他場的 Join 一併鎖住，避免同時送出兩筆 */
  isAnyJoinInFlight: boolean;
  isLeaving: boolean;
  isAnyLeaveInFlight: boolean;
  canLeave: boolean;
  showDivider: boolean;
  onToggleEvent: (eventId: string) => void;
  onToggleParticipants: (
    pressEvent: GestureResponderEvent,
    eventId: string,
  ) => void;
  onJoinEvent: (event: ScheduleEvent) => void;
  onLeaveEvent: (event: ScheduleEvent) => void;
};

function EventRow({
  event,
  isExpanded,
  isParticipantListVisible,
  isJoining,
  isAnyJoinInFlight,
  isLeaving,
  isAnyLeaveInFlight,
  canLeave,
  showDivider,
  onToggleEvent,
  onToggleParticipants,
  onJoinEvent,
  onLeaveEvent,
}: EventRowProps) {
  const participantText = `${event.participantCount ?? event.participants.length}/${event.maxParticipants}`;
  const isExpired = isEventExpired(event);
  const displayColor = isExpired ? "#B8B8B8" : event.color;
  const joinDisabledReason = getJoinDisabledReason(event);
  const isJoinDisabled = !canJoinEvent(event) || isAnyJoinInFlight;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.eventSlotRow}
      onPress={() => onToggleEvent(event.id)}
    >
      <Text style={[styles.timeText, isExpired && styles.expiredTimeText]}>
        {event.startTime}
      </Text>

      <View style={styles.eventArea}>
        <View style={styles.eventRow}>
          <View
            style={[
              styles.eventColorBar,
              {
                backgroundColor: displayColor,
              },
            ]}
          />

          <Text
            style={[
              styles.eventTitle,
              {
                color: displayColor,
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
                color: displayColor,
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
                  color: displayColor,
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
                  onPress={() => onJoinEvent(event)}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isJoinDisabled,
                    busy: isJoining,
                  }}
                >
                  {isJoining ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.joinButtonText}>
                      {canJoinEvent(event) ? "Join" : "Unavailable"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {canLeave && (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isAnyLeaveInFlight}
                style={[
                  styles.leaveButton,
                  isAnyLeaveInFlight && styles.joinButtonDisabled,
                ]}
                onPress={() => onLeaveEvent(event)}
                accessibilityRole="button"
                accessibilityLabel="Cancel participation"
                accessibilityState={{
                  disabled: isAnyLeaveInFlight,
                  busy: isLeaving,
                }}
              >
                {isLeaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.joinButtonText}>
                    Cancel participation
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {showDivider && (
          <View style={styles.eventDivider} pointerEvents="none">
            {Array.from({ length: 32 }, (_, index) => (
              <View key={index} style={styles.eventDividerDash} />
            ))}
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
  eventsLoading: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  eventsLoadingText: {
    fontSize: 13,
    color: "#888888",
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
  expiredTimeText: {
    color: "#B8B8B8",
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
    marginLeft: 14,
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
    backgroundColor: colors.brandStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveButton: {
    height: 40,
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#666666",
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
  eventDivider: {
    marginTop: 10,
    marginLeft: 14,
    height: 1,
    flexDirection: "row",
    gap: 3,
    overflow: "hidden",
  },
  eventDividerDash: {
    flex: 1,
    height: 1,
    backgroundColor: "#B8B8B8",
  },
  emptyText: {
    fontSize: 12,
    color: "#AAAAAA",
  },
});
