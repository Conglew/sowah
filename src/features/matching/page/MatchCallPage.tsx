import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import SowahAvatar from "@/src/assets/images/sowah-avar.svg";
import { AppLogoHeader } from "@/src/components/layout/AppHeader";
import { usersApi } from "@/src/features/profile/api/users.api";
import { useProfile } from "@/src/features/profile/hooks/useProfile";
import type { UserProfile } from "@/src/features/profile/types";
import { agoraVoice } from "@/src/services/agora";
import {
  getCountryFlag,
  getCountryName,
} from "@/src/shared/utils/country-flag";
import { colors } from "@/src/theme/colors";
import { EmojiPicker } from "../components/EmojiPicker";
import {
  EmojiReactionLayer,
  type EmojiReactionLayerHandle,
} from "../components/EmojiReactionLayer";
import { MicSwitch } from "../components/MicSwitch";
import { PhotoStage } from "../components/PhotoStage";
import { useSpeakingIndicator } from "../hooks/useSpeakingIndicator";

type CallStatus = "connecting" | "joined" | "remote-joined" | "error";

/** 通話中的即時訊息。目前只存在本機，還沒接傳輸層。 */
type CallMessage = { id: string; text: string; mine: boolean };

const MOCK_FRONT_PHOTO =
  "https://picsum.photos/seed/sowah-match-front/900/1200";
const MOCK_BACK_PHOTO = "https://picsum.photos/seed/sowah-match-back/900/1200";
const MOCK_PARTNER_AVATAR =
  "https://picsum.photos/seed/sowah-match-partner/240/240";
const MOCK_PARTNER_COUNTRY = "BE";
const MOCK_SELF_COUNTRY = "TW";
const MOCK_CALL_SECONDS = 9 * 60 + 32;

const INITIAL_MESSAGES: CallMessage[] = [
  { id: "seed-1", text: "Where did you go?", mine: false },
  { id: "seed-2", text: "Can you type here～", mine: true },
];

/** mock 模式沒有真實音訊，用固定節奏輪流點亮雙方邊框，純粹為了單機展示。 */
const MOCK_SPEAKING_INTERVAL_MS = 900;
const MOCK_SPEAKING_VOLUME = 60;

/**
 * 頭像圈。borderWidth 永遠存在只是顏色透明，所以橘圈出現／消失完全不影響版面，
 * 兩個頭像的照片尺寸也始終一致。
 */
const AVATAR_SIZE = 56;
const RING_WIDTH = 4;
const RING_OUTER = AVATAR_SIZE + RING_WIDTH * 2;

/** 與 colors.brand (#FF8A22) 同色、只差 alpha，插值不會經過灰或黑。 */
const RING_IDLE_COLOR = "rgba(255, 138, 34, 0)";

/** 左欄寬度 = 兩個頭像，計時器也用同一個寬度對齊。 */
const PERSON_WIDTH = RING_OUTER + 18;
const PEOPLE_WIDTH = PERSON_WIDTH * 2;

const MESSAGE_INPUT_HEIGHT = 26;

/** 控制列高度量到之前的暫用值，避免第一幀把表情放在畫面外。 */
const CONTROLS_HEIGHT_FALLBACK = 72;
const PICKER_GAP = 10;
const MESSAGE_MAX_LENGTH = 200;

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
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<CallMessage[]>(INITIAL_MESSAGES);
  const [elapsedSeconds, setElapsedSeconds] = useState(
    isMock ? MOCK_CALL_SECONDS : 0,
  );
  const messageScrollRef = useRef<ScrollView>(null);
  const reactionLayerRef = useRef<EmojiReactionLayerHandle>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [controlsHeight, setControlsHeight] = useState(
    CONTROLS_HEIGHT_FALLBACK,
  );
  const [emojiAnchorX, setEmojiAnchorX] = useState(0);

  const { localSpeaking, remoteSpeaking, handleVolume } = useSpeakingIndicator({
    muted,
  });

  const partnerName = isMock ? "nico_robin" : (partner?.user_id ?? "1V1 Match");
  const partnerAvatar = isMock
    ? MOCK_PARTNER_AVATAR
    : partner?.avatar?.download_url;
  const selfAvatar = selfProfile?.avatarUri;
  const selfCountry = isMock
    ? MOCK_SELF_COUNTRY
    : (selfProfile?.countryCode ?? null);
  const partnerCountry = isMock
    ? MOCK_PARTNER_COUNTRY
    : (partner?.country ?? null);

  /** 兩個人的國家。其中一邊還沒載到就只顯示另一邊，不要卡住整行。 */
  const locationText = useMemo(
    () =>
      [getCountryName(selfCountry), getCountryName(partnerCountry)]
        .filter((name): name is string => Boolean(name))
        .join(" · "),
    [partnerCountry, selfCountry],
  );

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
        onAudioVolume: (speakers) => {
          if (active) handleVolume(speakers);
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
  }, [handleVolume, isMock, matchUid]);

  useEffect(() => {
    if (!isMock || !__DEV__) return;
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      handleVolume([
        { uid: tick % 2 === 0 ? 0 : 1, volume: MOCK_SPEAKING_VOLUME },
      ]);
    }, MOCK_SPEAKING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [handleVolume, isMock]);

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

  const applyMuted = useCallback(
    (next: boolean) => {
      if (!isMock) {
        try {
          agoraVoice.setMuted(next);
        } catch (muteError) {
          console.warn("[match-call] mute failed", muteError);
          return;
        }
      }
      setMuted(next);
    },
    [isMock],
  );

  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    // TODO(chat): 目前只進本機列表，還沒透過 Chat SDK 送給對方。
    setMessages((previous) => [
      ...previous,
      { id: `${Date.now()}-${previous.length}`, text, mine: true },
    ]);
    setDraft("");
  }, [draft]);

  /**
   * 送出一顆表情。
   *
   * 畫面先放，不等任何網路往返——reaction 的價值在即時感，
   * 送不出去也不該讓自己這端卡住。
   */
  const sendReaction = useCallback((emoji: string) => {
    reactionLayerRef.current?.spawn(emoji);
    setPickerOpen(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO(chat): 用 Chat SDK 的 createCustomMessage 送給對方。
    // 不能用文字訊息，否則對方的 Private 列表會被 reaction 洗版、未讀數也會爆。
    // 收到對方的 reaction 時同樣呼叫 reactionLayerRef.current?.spawn(emoji)。
  }, []);

  const leave = () => {
    if (!isMock) agoraVoice.leave();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AppLogoHeader />

        <PhotoStage
          frontUri={MOCK_FRONT_PHOTO}
          backUri={isMock ? MOCK_BACK_PHOTO : MOCK_FRONT_PHOTO}
        />

        <View style={styles.detailArea}>
          <View style={styles.columns}>
            <View style={styles.leftColumn}>
              <View style={styles.peopleRow}>
                <Participant
                  avatarUri={selfAvatar}
                  name={selfProfile?.username ?? "samjima_184"}
                  flag={selfCountry ? getCountryFlag(selfCountry) : ""}
                  speaking={localSpeaking}
                />
                <Participant
                  avatarUri={partnerAvatar}
                  name={partnerName}
                  flag={partnerCountry ? getCountryFlag(partnerCountry) : ""}
                  speaking={remoteSpeaking}
                />
              </View>
              <Text
                style={styles.timer}
                numberOfLines={1}
                adjustsFontSizeToFit
                allowFontScaling={false}
              >
                {callTime}
              </Text>
            </View>

            <View style={styles.rightColumn}>
              <ScrollView
                ref={messageScrollRef}
                style={styles.messageScroll}
                contentContainerStyle={styles.messageContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() =>
                  messageScrollRef.current?.scrollToEnd({ animated: true })
                }
              >
                {messages.map((line) => (
                  <MessageLine
                    key={line.id}
                    text={line.text}
                    mine={line.mine}
                  />
                ))}
              </ScrollView>

              {locationText ? (
                <Text style={styles.location} numberOfLines={1}>
                  {locationText}
                </Text>
              ) : null}

              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Aa"
                placeholderTextColor="#B5B5B5"
                style={styles.messageInput}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                submitBehavior="submit"
                maxLength={MESSAGE_MAX_LENGTH}
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
          onLayout={(event) =>
            setControlsHeight(event.nativeEvent.layout.height)
          }
          style={[
            styles.controls,
            {
              minHeight: CONTROLS_HEIGHT_FALLBACK + insets.bottom,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <MicSwitch
            muted={muted}
            onChange={applyMuted}
            disabled={status === "error"}
          />
          <Pressable
            style={styles.roundControl}
            onPress={() => setPickerOpen((open) => !open)}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              // controls 是滿版的一列，所以這裡的 x 就等於畫面上的 x。
              setEmojiAnchorX(x + width / 2);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: pickerOpen }}
            accessibilityLabel="傳送表情"
          >
            <Ionicons
              name={pickerOpen ? "happy" : "happy-outline"}
              size={22}
              color={pickerOpen ? colors.brand : "#777777"}
            />
          </Pressable>
          <View style={styles.controlSpacer} />
          <Pressable style={styles.leaveButton} onPress={leave}>
            <Text style={styles.leaveText}>Leave</Text>
          </Pressable>
        </View>

        {pickerOpen && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPickerOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="關閉表情選單"
          />
        )}

        <EmojiPicker
          open={pickerOpen}
          onSelect={sendReaction}
          bottom={controlsHeight + PICKER_GAP}
        />

        <EmojiReactionLayer
          ref={reactionLayerRef}
          anchorX={emojiAnchorX}
          bottom={controlsHeight - 8}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** 行首那根豎條用 View 畫，不用「▮」字元——字元的粗細與行高會隨字型跑掉。 */
function MessageLine({ text, mine }: { text: string; mine: boolean }) {
  return (
    <View style={styles.messageRow}>
      <View style={[styles.messageBullet, mine && styles.messageBulletMine]} />
      <Text style={styles.messageText}>{text}</Text>
    </View>
  );
}

function Participant({
  avatarUri,
  name,
  flag,
  speaking = false,
}: {
  avatarUri?: string | null;
  name: string;
  flag: string;
  speaking?: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(speaking ? 1 : 0, { duration: 180 });
  }, [progress, speaking]);

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [RING_IDLE_COLOR, colors.brand],
    ),
  }));

  return (
    <View style={styles.person}>
      <View style={styles.avatarWrap}>
        <Animated.View style={[styles.avatarRing, ringStyle]}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <SowahAvatar width={AVATAR_SIZE} height={AVATAR_SIZE} />
            </View>
          )}
        </Animated.View>
        {flag ? (
          <View style={styles.flagBadge}>
            <Text style={styles.flagText}>{flag}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.personName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  detailArea: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },

  // 左欄（頭像 + 計時器）寬度固定，右欄吃剩下的；stretch 讓右欄高度跟著左欄，
  // 訊息區才有明確高度可以 flex: 1 並在超過時捲動。
  columns: { flexDirection: "row", alignItems: "stretch" },
  leftColumn: { width: PEOPLE_WIDTH },
  rightColumn: { flex: 1, marginLeft: 10, justifyContent: "flex-end" },

  peopleRow: { flexDirection: "row" },
  person: { width: PERSON_WIDTH, alignItems: "center" },
  avatarWrap: { width: RING_OUTER, height: RING_OUTER },
  avatarRing: {
    width: RING_OUTER,
    height: RING_OUTER,
    borderRadius: RING_OUTER / 2,
    borderWidth: RING_WIDTH,
    borderColor: RING_IDLE_COLOR,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    // 圈是透明的，所以底色不能放這層，否則沒說話時會看到一圈灰。
    backgroundColor: "transparent",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#F0F0F0",
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  flagBadge: { position: "absolute", right: -1, bottom: 1 },
  flagText: { fontSize: 15, lineHeight: 18 },
  personName: {
    marginTop: 5,
    fontSize: 12,
    color: "#444444",
    maxWidth: PERSON_WIDTH,
  },

  timer: {
    width: PEOPLE_WIDTH,
    marginTop: 6,
    fontSize: 64,
    lineHeight: 68,
    fontWeight: "900",
    letterSpacing: -2,
    color: "#000000",
  },

  messageScroll: { flex: 1 },
  messageContent: {
    flexGrow: 1,
    // 訊息從底部往上長；不夠滿時貼著底部，滿了就變成可捲動。
    justifyContent: "flex-end",
    gap: 8,
    paddingBottom: 2,
  },
  messageRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  messageBullet: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: "#6A6A6A",
  },
  messageBulletMine: { backgroundColor: colors.brand },
  messageText: { flex: 1, fontSize: 12, lineHeight: 16, color: "#555555" },

  location: {
    marginTop: 6,
    marginBottom: 6,
    textAlign: "right",
    fontSize: 11,
    color: "#BBBBBB",
  },
  messageInput: {
    height: MESSAGE_INPUT_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: "#9A9A9A",
    // 完整膠囊：半徑跟著高度走，改高度時圓角不用另外調。
    borderRadius: MESSAGE_INPUT_HEIGHT / 2,
    fontSize: 12,
    color: "#333333",
  },

  connectionBadge: {
    marginTop: 6,
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
