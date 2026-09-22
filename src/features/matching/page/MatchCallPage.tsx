import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
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
import { usersApi } from "@/src/features/profile/api/users.api";
import type { UserProfile } from "@/src/features/profile/types";
import { agoraVoice } from "@/src/services/agora";
import { colors } from "@/src/theme/colors";

type CallStatus = "connecting" | "joined" | "remote-joined" | "error";

const MOCK_FRONT_PHOTO =
  "https://picsum.photos/seed/sowah-match-front/900/1200";
const MOCK_BACK_PHOTO = "https://picsum.photos/seed/sowah-match-back/900/1200";
const MOCK_PARTNER_AVATAR =
  "https://picsum.photos/seed/sowah-match-partner/240/240";
const MOCK_CALL_SECONDS = 9 * 60 + 32;

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function MatchCallPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    matchUid?: string | string[];
    otherUid?: string | string[];
    mock?: string | string[];
  }>();
  const matchUid = param(params.matchUid);
  const otherUid = param(params.otherUid);
  const isMock = param(params.mock) === "true";
  const { profile: selfProfile } = useProfile({ variant: "self" });
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<CallStatus>(
    isMock ? "remote-joined" : "connecting",
  );
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [message, setMessage] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(
    isMock ? MOCK_CALL_SECONDS : 0,
  );

  const partnerName = isMock ? "nico_robin" : (partner?.user_id ?? "1V1 Match");
  const partnerAvatar = isMock
    ? MOCK_PARTNER_AVATAR
    : partner?.avatar?.download_url;
  const selfAvatar = selfProfile?.avatarUri;

  useEffect(() => {
    if (isMock || !otherUid) return;
    let active = true;
    void usersApi
      .getById(otherUid)
      .then((value) => {
        if (active) setPartner(value);
      })
      .catch((profileError) => {
        console.warn("[match-call] profile failed", profileError);
      });
    return () => {
      active = false;
    };
  }, [isMock, otherUid]);

  useEffect(() => {
    if (isMock) {
      if (__DEV__) console.info("[match-call][mock] connected successfully");
      return;
    }
    if (!matchUid) {
      setStatus("error");
      setError("缺少 match_uid");
      return;
    }

    let active = true;
    if (__DEV__) console.info("[match-call] requesting Agora token", matchUid);
    void agoraVoice
      .joinMatch(matchUid, {
        onJoined: () => {
          if (active) setStatus("joined");
          if (__DEV__) console.info("[match-call] joined Agora channel");
        },
        onRemoteUserJoined: (uid) => {
          if (active) setStatus("remote-joined");
          if (__DEV__) console.info("[match-call] remote joined", uid);
        },
        onRemoteUserLeft: (uid) => {
          if (active) setStatus("joined");
          if (__DEV__) console.info("[match-call] remote left", uid);
        },
        onTokenRenewed: () => {
          if (__DEV__) console.info("[match-call] Agora token renewed");
        },
        onError: (code, messageText) => {
          console.warn("[match-call] Agora error", code, messageText);
          if (active) {
            setStatus("error");
            setError(messageText || `Agora 錯誤 ${code}`);
          }
        },
      })
      .catch((joinError: unknown) => {
        console.warn("[match-call] join failed", joinError);
        if (active) {
          setStatus("error");
          setError(
            joinError instanceof Error ? joinError.message : "無法加入語音通話",
          );
        }
      });

    return () => {
      active = false;
      agoraVoice.leave();
    };
  }, [isMock, matchUid]);

  useEffect(() => {
    if (status !== "remote-joined") return;
    const timer = setInterval(
      () => setElapsedSeconds((seconds) => seconds + 1),
      1000,
    );
    return () => clearInterval(timer);
  }, [status]);

  const callTime = useMemo(
    () => formatDuration(elapsedSeconds),
    [elapsedSeconds],
  );

  const toggleMute = () => {
    const next = !muted;
    if (!isMock) {
      try {
        agoraVoice.setMuted(next);
      } catch (muteError) {
        console.warn("[match-call] mute failed", muteError);
        return;
      }
    }
    setMuted(next);
  };

  const leave = () => {
    if (!isMock) agoraVoice.leave();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppLogoHeader />

      <View style={styles.photoStage}>
        <Image
          source={{ uri: isMock ? MOCK_BACK_PHOTO : MOCK_FRONT_PHOTO }}
          style={styles.backPhoto}
          contentFit="cover"
        />
        <Image
          source={{ uri: MOCK_FRONT_PHOTO }}
          style={styles.frontPhoto}
          contentFit="cover"
        />
      </View>

      <View style={styles.detailArea}>
        <View style={styles.peopleRow}>
          <Participant
            avatarUri={selfAvatar}
            name={selfProfile?.username ?? "samjima_184"}
            flag="🇹🇼"
          />
          <Participant
            avatarUri={partnerAvatar}
            name={partnerName}
            flag={isMock ? "🇫🇷" : ""}
          />
          <View style={styles.promptWrap}>
            <Text style={styles.prompt}>▮ Where did you go?</Text>
            <Text style={styles.prompt}>▮ Can you type here～</Text>
          </View>
        </View>

        <View style={styles.callInfoRow}>
          <Text style={styles.timer}>{callTime}</Text>
          <View style={styles.locationAndInput}>
            <Text style={styles.location}>Cologne, Germany</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Aa"
              style={styles.messageInput}
            />
          </View>
        </View>

        {status !== "remote-joined" && (
          <View style={styles.connectionBadge}>
            {status === "connecting" && (
              <ActivityIndicator size="small" color={colors.brand} />
            )}
            <Text style={styles.connectionText}>
              {status === "connecting" && "正在連線…"}
              {status === "joined" && "等待對方加入…"}
              {status === "error" && (error ?? "連線失敗")}
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.controls,
          {
            minHeight: 72 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Pressable style={styles.roundControl} onPress={toggleMute}>
          <Text style={styles.controlIcon}>{muted ? "×" : "♩"}</Text>
        </Pressable>
        <Pressable style={styles.roundControl}>
          <Text style={styles.controlIcon}>☺</Text>
        </Pressable>
        <View style={styles.controlSpacer} />
        <Pressable style={styles.leaveButton} onPress={leave}>
          <Text style={styles.leaveText}>Leave</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Participant({
  avatarUri,
  name,
  flag,
}: {
  avatarUri?: string | null;
  name: string;
  flag: string;
}) {
  return (
    <View style={styles.person}>
      <View style={styles.avatarRing}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <SowahAvatar width={38} height={38} />
        )}
      </View>
      <Text style={styles.personName} numberOfLines={1}>
        {name} {flag}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  photoStage: {
    flex: 1,
    minHeight: 330,
    marginHorizontal: 18,
    position: "relative",
  },
  backPhoto: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "88%",
    borderRadius: 18,
    backgroundColor: "#E8E8E8",
  },
  frontPhoto: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "91%",
    height: "88%",
    borderRadius: 18,
    backgroundColor: "#D8E9FF",
  },
  detailArea: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  peopleRow: { flexDirection: "row", alignItems: "center" },
  person: { width: 76, alignItems: "center" },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  personName: { marginTop: 3, fontSize: 9, color: "#666666", maxWidth: 74 },
  promptWrap: { flex: 1, paddingLeft: 4, gap: 7 },
  prompt: { fontSize: 10, color: "#6A6A6A" },
  callInfoRow: { marginTop: 2, flexDirection: "row", alignItems: "flex-end" },
  timer: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
    letterSpacing: -2,
    color: "#000000",
  },
  locationAndInput: { flex: 1, marginLeft: 10, paddingBottom: 4 },
  location: {
    marginBottom: 4,
    textAlign: "right",
    fontSize: 10,
    color: "#BBBBBB",
  },
  messageInput: {
    height: 22,
    paddingHorizontal: 7,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: "#929292",
    borderRadius: 5,
    fontSize: 11,
    color: "#333333",
  },
  connectionBadge: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  connectionText: { fontSize: 11, color: "#888888" },
  controls: {
    minHeight: 72,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#5B5B5B",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  roundControl: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
  },
  controlIcon: { fontSize: 21, fontWeight: "700", color: "#777777" },
  controlSpacer: { flex: 1 },
  leaveButton: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8E8E8",
  },
  leaveText: { color: "#666666", fontSize: 14 },
});
