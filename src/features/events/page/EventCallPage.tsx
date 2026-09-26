import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import SowahAvatar from "@/src/assets/images/sowah-avar.svg";
import { AppLogoHeader } from "@/src/components/layout/AppHeader";
import { useProfile } from "@/src/features/profile/hooks/useProfile";
import { MicSwitch } from "@/src/features/matching/components/MicSwitch";
import { agoraVoice } from "@/src/services/agora";
import { getCountryFlag } from "@/src/shared/utils/country-flag";
import { colors } from "@/src/theme/colors";
import { eventsApi } from "../api/events.api";
import type { EventParticipant, EventResource } from "../types/events.types";

type CallStatus = "connecting" | "joined" | "error";
type ReportStage = "pick" | "form" | "submitted" | null;

const MOCK_EVENT: EventResource = {
  event_uid: "dev-preview",
  creator_uid: "dev-host",
  title: "How Traveling Changes the Way We See the World",
  description:
    "1. What is the most memorable trip you've ever taken, and what made it special?\n2. Has traveling ever changed your opinion about a country, culture, or way of life?\n3. What is the biggest challenge you've faced while traveling, and how did you deal with it?\n4. If you could live in any country for one year, where would you choose and why?\n5. What do you think is more important when traveling: seeing famous attractions or experiencing local life?",
  start: new Date().toISOString(),
  end: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  duration_minutes: 30,
  kind: "multiple",
  visibility: "public",
  capacity: 6,
  participant_count: 6,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_PARTICIPANTS: EventParticipant[] = Array.from(
  { length: 6 },
  (_, index) => ({
    user_uid: `dev-user-${index + 1}`,
    joined_at: new Date().toISOString(),
    profile: {
      user_uid: `dev-user-${index + 1}`,
      user_id: [
        "samjima_184",
        "roronoa_zoro",
        "nico_robin",
        "usopp",
        "nami",
        "sanji",
      ][index],
      country: ["TW", "FR", "JP", "US", "TH", "AU"][index],
      birthday: "2000-01-01",
      bio: null,
      avatar: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  }),
);

const REPORT_REASONS = [
  "Harassment or bullying",
  "Sexual or inappropriate behavior",
  "Hate speech or discrimination",
  "Spam or advertising",
  "Scam or suspicious behavior",
  "Inactive or unresponsive",
  "Other",
] as const;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function EventCallPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    eventUid?: string | string[];
    mock?: string | string[];
  }>();
  const eventUid = firstParam(params.eventUid);
  const isMock = __DEV__ && firstParam(params.mock) === "true";
  const { profile: selfProfile } = useProfile({ variant: "self" });
  const [event, setEvent] = useState<EventResource | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [status, setStatus] = useState<CallStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);
  const [message, setMessage] = useState("");
  const [reportStage, setReportStage] = useState<ReportStage>(null);
  const [reportedUser, setReportedUser] = useState<EventParticipant | null>(
    null,
  );
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const accountByAgoraUid = useRef(new Map<number, string>());
  const [remoteMuted, setRemoteMuted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isMock) {
      setEvent(MOCK_EVENT);
      setParticipants(MOCK_PARTICIPANTS);
      setRemoteMuted({
        "dev-user-2": true,
        "dev-user-3": true,
        "dev-user-5": true,
        "dev-user-6": true,
      });
      return;
    }
    if (!eventUid) {
      setStatus("error");
      setError("缺少 event_uid");
      return;
    }
    let active = true;
    void Promise.all([
      eventsApi.getById(eventUid),
      eventsApi.listParticipants(eventUid, {
        sort: "oldest",
        limit: 100,
        offset: 0,
      }),
    ])
      .then(([eventValue, participantPage]) => {
        if (!active) return;
        setEvent(eventValue);
        setParticipants(participantPage.participants);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setStatus("error");
        setError(
          loadError instanceof Error ? loadError.message : "無法載入活動",
        );
      });
    return () => {
      active = false;
    };
  }, [eventUid, isMock]);

  useEffect(() => {
    if (!eventUid || isMock) {
      if (isMock) setStatus("joined");
      return;
    }
    let active = true;
    void agoraVoice
      .joinEvent(eventUid, {
        onJoined: () => active && setStatus("joined"),
        onRemoteUserIdentified: (uid, userAccount) => {
          accountByAgoraUid.current.set(uid, userAccount);
        },
        onRemoteUserMuteChanged: (uid, isMuted) => {
          const userAccount = accountByAgoraUid.current.get(uid);
          if (active && userAccount) {
            setRemoteMuted((current) => ({
              ...current,
              [userAccount]: isMuted,
            }));
          }
        },
        onRemoteUserLeft: (uid) => {
          const userAccount = accountByAgoraUid.current.get(uid);
          if (userAccount) accountByAgoraUid.current.delete(uid);
        },
        onError: (code, messageText) => {
          if (!active) return;
          setStatus("error");
          setError(messageText || `Agora 錯誤 ${code}`);
        },
      })
      .catch((joinError: unknown) => {
        if (!active) return;
        setStatus("error");
        setError(
          joinError instanceof Error ? joinError.message : "無法加入語音通話",
        );
      });
    return () => {
      active = false;
      agoraVoice.leave();
    };
  }, [eventUid, isMock]);

  useEffect(() => {
    if (status !== "joined") return;
    const timer = setInterval(
      () => setRemainingSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!event) return;
    const fullDurationSeconds = Math.max(0, event.duration_minutes * 60);
    if (isMock) {
      setRemainingSeconds(fullDurationSeconds);
      return;
    }

    const secondsUntilEventEnd = Math.ceil(
      (new Date(event.end).getTime() - Date.now()) / 1000,
    );
    setRemainingSeconds(
      Number.isFinite(secondsUntilEventEnd)
        ? Math.max(0, Math.min(fullDurationSeconds, secondsUntilEventEnd))
        : fullDurationSeconds,
    );
  }, [event, isMock]);

  const visibleParticipants = useMemo(() => {
    if (participants.length > 0) return participants;
    if (!selfProfile) return [];
    return [
      {
        user_uid: selfProfile.id,
        joined_at: new Date().toISOString(),
        profile: {
          user_uid: selfProfile.id,
          user_id: selfProfile.username,
          country: selfProfile.countryCode,
          birthday: "",
          bio: null,
          avatar: null,
          created_at: "",
          updated_at: "",
        },
      } satisfies EventParticipant,
    ];
  }, [participants, selfProfile]);

  const applyMuted = (next: boolean) => {
    if (!isMock) {
      try {
        agoraVoice.setMuted(next);
      } catch (muteError) {
        Alert.alert(
          "Microphone error",
          muteError instanceof Error
            ? muteError.message
            : "Unable to change microphone state",
        );
        return;
      }
    }
    setMuted(next);
  };

  const leave = () => {
    if (!isMock) agoraVoice.leave();
    router.back();
  };

  const reportableParticipants = visibleParticipants.filter(
    (participant, index) =>
      !(isMock ? index === 0 : participant.user_uid === selfProfile?.id),
  );

  const submitReport = async () => {
    if (!reportedUser || !reportReason) return;
    setReporting(true);
    // Scalar 目前沒有 report endpoint；DEV 先完整驗證流程，但不宣稱已送達後端。
    await new Promise((resolve) => setTimeout(resolve, 450));
    setReporting(false);
    setReportStage("submitted");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppLogoHeader />
      <View style={styles.content}>
        <View style={styles.topicCard}>
          <View style={styles.topicWatermark} pointerEvents="none">
            <SowahAvatar width={150} height={150} />
          </View>
          <Text style={styles.label}>Topic</Text>
          <Text style={styles.topic}>{event?.title ?? "Event voice room"}</Text>
          <Text style={[styles.label, styles.descriptionLabel]}>
            Description
          </Text>
          <Text style={styles.description}>
            {event?.description ||
              "Join the conversation and share your thoughts."}
          </Text>
        </View>

        <View style={styles.callDetails}>
          <View style={styles.participantsAndPrompts}>
            <View style={styles.participantGrid}>
              {visibleParticipants.slice(0, 6).map((participant, index) => {
                const isSelf = isMock
                  ? index === 0
                  : participant.user_uid === selfProfile?.id;
                const isMuted = isSelf
                  ? muted
                  : Boolean(remoteMuted[participant.user_uid]);
                return (
                  <View
                    key={participant.user_uid}
                    style={styles.participantCell}
                  >
                    <View style={styles.avatarWrap}>
                      {participant.profile.avatar?.download_url ? (
                        <Image
                          source={{
                            uri: participant.profile.avatar.download_url,
                          }}
                          style={styles.avatar}
                          contentFit="cover"
                        />
                      ) : (
                        <SowahAvatar width={45} height={45} />
                      )}
                      {isMuted && (
                        <View style={styles.mutedBadge}>
                          <Ionicons name="mic-off" size={22} color="#FF343C" />
                        </View>
                      )}
                      {participant.profile.country ? (
                        <View style={styles.flagBadge}>
                          <Text style={styles.flagText}>
                            {getCountryFlag(participant.profile.country)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.promptArea}>
              <Text style={styles.prompt}>▮ Where did you go?</Text>
              <Text style={styles.prompt}>▮ Can you type here～</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text
              style={styles.timer}
              accessibilityLabel={`${remainingSeconds} seconds remaining`}
              numberOfLines={1}
              adjustsFontSizeToFit
              allowFontScaling={false}
            >
              {formatDuration(remainingSeconds)}
            </Text>
            <View style={styles.messageArea}>
              <Text style={styles.location}>Cologne, Germany</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Aa"
                style={styles.messageInput}
              />
            </View>
          </View>

          {status !== "joined" && (
            <View style={styles.statusRow}>
              {status === "connecting" && (
                <ActivityIndicator color={colors.brandStrong} />
              )}
              <Text style={styles.statusText}>
                {status === "connecting" ? "Connecting…" : error}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={[
          styles.controls,
          {
            height: 72 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <MicSwitch
          muted={muted}
          onChange={applyMuted}
          disabled={status === "error"}
        />
        <Pressable style={styles.roundControl} accessibilityLabel="Reaction">
          <Ionicons name="happy-outline" size={25} color="#666" />
        </Pressable>
        <View style={styles.spacer} />
        <Pressable style={styles.leaveButton} onPress={leave}>
          <Text style={styles.leaveText}>Leave</Text>
        </Pressable>
        <Pressable
          style={styles.roundControl}
          onPress={() => setReportStage("pick")}
          accessibilityLabel="Report a participant"
        >
          <Ionicons name="ban-outline" size={32} color="#FF343C" />
        </Pressable>
      </View>

      <ReportFlow
        stage={reportStage}
        participants={reportableParticipants}
        selectedUser={reportedUser}
        selectedReason={reportReason}
        details={reportDetails}
        reporting={reporting}
        onClose={() => setReportStage(null)}
        onPick={(participant) => {
          setReportedUser(participant);
          setReportStage("form");
        }}
        onReason={setReportReason}
        onDetails={setReportDetails}
        onSubmit={submitReport}
        onBlock={() => {
          setReportStage(null);
          Alert.alert(
            "Development preview",
            "封鎖 API 尚未由後端提供，目前沒有變更伺服器資料。",
          );
        }}
      />
    </SafeAreaView>
  );
}

function ReportFlow({
  stage,
  participants,
  selectedUser,
  selectedReason,
  details,
  reporting,
  onClose,
  onPick,
  onReason,
  onDetails,
  onSubmit,
  onBlock,
}: {
  stage: ReportStage;
  participants: EventParticipant[];
  selectedUser: EventParticipant | null;
  selectedReason: string | null;
  details: string;
  reporting: boolean;
  onClose: () => void;
  onPick: (participant: EventParticipant) => void;
  onReason: (reason: string) => void;
  onDetails: (details: string) => void;
  onSubmit: () => void;
  onBlock: () => void;
}) {
  return (
    <Modal
      visible={stage !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {stage === "pick" && (
            <>
              <Text style={styles.modalTitle}>Select a user to report</Text>
              {participants.length === 0 ? (
                <Text style={styles.emptyReport}>
                  No other participants are available.
                </Text>
              ) : (
                participants.map((participant) => (
                  <Pressable
                    key={participant.user_uid}
                    style={styles.userOption}
                    onPress={() => onPick(participant)}
                  >
                    {participant.profile.avatar?.download_url ? (
                      <Image
                        source={{
                          uri: participant.profile.avatar.download_url,
                        }}
                        style={styles.smallAvatar}
                      />
                    ) : (
                      <SowahAvatar width={42} height={42} />
                    )}
                    <Text style={styles.userOptionText}>
                      {participant.profile.user_id}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#888" />
                  </Pressable>
                ))
              )}
              <Pressable style={styles.cancelModalButton} onPress={onClose}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </Pressable>
            </>
          )}
          {stage === "form" && selectedUser && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Report</Text>
              <Text style={styles.reportUserName}>
                {selectedUser.profile.user_id}
              </Text>
              <Text style={styles.question}>
                Why are you reporting this user?
              </Text>
              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason}
                  style={styles.reasonRow}
                  onPress={() => onReason(reason)}
                >
                  <Ionicons
                    name={
                      selectedReason === reason
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={21}
                    color={selectedReason === reason ? "#FF343C" : "#222"}
                  />
                  <Text style={styles.reasonText}>{reason}</Text>
                </Pressable>
              ))}
              <Text style={styles.question}>Add details (optional)</Text>
              <TextInput
                value={details}
                onChangeText={onDetails}
                multiline
                maxLength={500}
                style={styles.detailsInput}
              />
              <Text style={styles.devNotice}>
                Development preview: the backend does not provide a report API
                yet.
              </Text>
              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryAction} onPress={onClose}>
                  <Text style={styles.secondaryText}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={!selectedReason || reporting}
                  style={[
                    styles.primaryAction,
                    (!selectedReason || reporting) && styles.disabledAction,
                  ]}
                  onPress={onSubmit}
                >
                  {reporting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryText}>Report</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
          {stage === "submitted" && selectedUser && (
            <>
              <Text style={styles.modalTitle}>Report recorded locally</Text>
              <Text style={styles.submittedText}>
                This development preview was not sent to the server.
              </Text>
              <Text style={styles.blockQuestion}>
                Would you like to block this user?
              </Text>
              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryAction} onPress={onClose}>
                  <Text style={styles.secondaryText}>Not now</Text>
                </Pressable>
                <Pressable style={styles.primaryAction} onPress={onBlock}>
                  <Text style={styles.primaryText}>Block</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 8,
    gap: 10,
  },
  topicCard: {
    flex: 1,
    minHeight: 0,
    borderWidth: 1,
    borderColor: "#777",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 22,
    overflow: "hidden",
  },
  topicWatermark: {
    position: "absolute",
    left: "50%",
    bottom: 22,
    marginLeft: -75,
    opacity: 0.09,
  },
  label: { fontSize: 20, fontWeight: "700", color: "#111" },
  topic: { marginTop: 4, fontSize: 14, lineHeight: 17, color: "#222" },
  descriptionLabel: { marginTop: 18 },
  description: { marginTop: 7, fontSize: 13, lineHeight: 16, color: "#222" },
  callDetails: {
    // 固定底部白色資訊區；Topic 卡只使用上方剩餘高度。
    height: 166,
  },
  participantsAndPrompts: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  participantGrid: {
    width: "50%",
    height: 104,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "space-between",
  },
  participantCell: {
    width: "33.333%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  mutedBadge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "#FF343C",
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  flagBadge: {
    position: "absolute",
    right: -2,
    bottom: -1,
  },
  flagText: {
    fontSize: 13,
    lineHeight: 16,
  },
  promptArea: {
    flex: 1,
    justifyContent: "flex-end",
    paddingLeft: 4,
    paddingBottom: 4,
  },
  metaRow: {
    height: 62,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  timer: {
    width: "50%",
    fontSize: 58,
    lineHeight: 62,
    fontWeight: "900",
    letterSpacing: -2,
    color: "#050505",
  },
  messageArea: { flex: 1, paddingLeft: 4, paddingBottom: 3 },
  prompt: { fontSize: 11, color: "#777", marginBottom: 3 },
  location: {
    marginBottom: 5,
    textAlign: "right",
    fontSize: 11,
    color: "#C3C3C3",
  },
  messageInput: {
    height: 21,
    borderWidth: 1,
    borderColor: "#AAA",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 0,
    fontSize: 11,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  statusText: { color: "#666" },
  controls: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    backgroundColor: "#5B5B5B",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  roundControl: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: { flex: 1 },
  leaveButton: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  leaveText: { fontSize: 14, color: "#666666" },
  modalBackdrop: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalCard: {
    maxHeight: "84%",
    borderWidth: 1.2,
    borderColor: "#111",
    borderRadius: 28,
    padding: 20,
    backgroundColor: "#FFF",
  },
  modalTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#FF343C",
    marginBottom: 15,
  },
  userOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDD",
  },
  smallAvatar: { width: 42, height: 42, borderRadius: 21 },
  userOptionText: { flex: 1, fontSize: 16 },
  emptyReport: { textAlign: "center", color: "#777", marginVertical: 20 },
  cancelModalButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: "#DDD",
  },
  cancelModalText: { color: "#555", fontSize: 16 },
  reportUserName: { fontSize: 16, fontWeight: "600", marginBottom: 15 },
  question: { fontSize: 14, marginTop: 4, marginBottom: 8 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  reasonText: { flex: 1, fontSize: 14 },
  detailsInput: {
    height: 90,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 7,
    padding: 8,
    textAlignVertical: "top",
  },
  devNotice: { fontSize: 11, lineHeight: 15, color: "#B36B00", marginTop: 7 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  secondaryAction: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD",
  },
  secondaryText: { fontSize: 16, color: "#666" },
  primaryAction: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF343C",
  },
  primaryText: { fontSize: 16, color: "#FFF" },
  disabledAction: { opacity: 0.45 },
  submittedText: { textAlign: "center", fontSize: 16, lineHeight: 22 },
  blockQuestion: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
  },
});
