import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { eventsApi } from "@/src/features/events/api/events.api";
import type { EventResource } from "@/src/features/events/types/events.types";
import { colors } from "@/src/theme/colors";

export default function SharedEventPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventUid?: string | string[] }>();
  const eventUid = Array.isArray(params.eventUid)
    ? params.eventUid[0]
    : params.eventUid;
  const [event, setEvent] = useState<EventResource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!eventUid) {
      setIsLoading(false);
      return;
    }
    let active = true;
    void eventsApi
      .getById(eventUid)
      .then((result) => {
        if (active) setEvent(result);
      })
      .catch(() => {
        if (active) setEvent(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventUid]);

  const join = async () => {
    if (!event || isJoining) return;
    setIsJoining(true);
    try {
      await eventsApi.joinEvent(event.event_uid);
      setEvent((current) =>
        current
          ? { ...current, participant_count: current.participant_count + 1 }
          : current,
      );
      Alert.alert("已參加活動", "活動已加入你的行程。", [
        { text: "好", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      Alert.alert(
        "無法參加活動",
        status === 409 ? "你已參加過，或活動已額滿。" : "請稍後再試一次。",
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : !event ? (
        <View style={styles.center}>
          <Text style={styles.notFound}>
            找不到這個活動，活動可能已被刪除。
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.meta}>
            {dayjs(event.start).format("YYYY/MM/DD HH:mm")} ·{" "}
            {event.participant_count}/{event.capacity}
          </Text>
          <Text style={styles.description}>{event.description}</Text>
          <TouchableOpacity
            style={styles.joinButton}
            disabled={isJoining}
            onPress={() => void join()}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.joinText}>Join</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 52,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { width: 40, fontSize: 36, lineHeight: 38, color: "#222222" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111111" },
  headerSpacer: { width: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  notFound: { color: "#888888", textAlign: "center" },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 25, fontWeight: "800", color: "#111111" },
  meta: { marginTop: 10, fontSize: 14, color: colors.brandStrong },
  description: {
    marginTop: 24,
    fontSize: 16,
    lineHeight: 25,
    color: "#777777",
  },
  joinButton: {
    height: 48,
    marginTop: "auto",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandStrong,
  },
  joinText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
});
