import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Agora 在音量回報裡固定用 uid 0 代表「本地使用者」。
 * 這不是你自己的 uid，別拿 credentials.uid 去比對。
 */
export const LOCAL_AGORA_UID = 0;

/** 音量門檻（Agora 回報範圍 0-255）。低於這個值視為環境雜音。 */
const DEFAULT_THRESHOLD = 12;

/**
 * 停止說話後仍維持「說話中」的時間。
 * 人講話換氣天生有停頓，不 hold 的話橘框會隨著音節一直閃。
 */
const DEFAULT_HOLD_MS = 420;

/** 只取我們需要的兩個欄位，避免與 Agora 的 AudioVolumeInfo 型別綁死。 */
export type SpeakingVolume = { uid?: number; volume?: number };

type Options = {
  /** 本地是否靜音。靜音時一律視為沒說話，不信 SDK 的回報。 */
  muted: boolean;
  threshold?: number;
  holdMs?: number;
};

type SpeakingIndicator = {
  localSpeaking: boolean;
  remoteSpeaking: boolean;
  /** 直接掛到 agoraVoice 的 onAudioVolume。這個 function 是穩定的，可安全放進 effect deps。 */
  handleVolume: (speakers: SpeakingVolume[]) => void;
};

/**
 * 把 Agora 的音量回報轉成「誰正在說話」的布林值，並加上收尾保持時間。
 *
 * 前提：agora-voice 已經呼叫過 enableAudioVolumeIndication，否則永遠不會有事件進來。
 */
export function useSpeakingIndicator(options: Options): SpeakingIndicator {
  const {
    muted,
    threshold = DEFAULT_THRESHOLD,
    holdMs = DEFAULT_HOLD_MS,
  } = options;

  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);

  const timersRef = useRef<{
    local: ReturnType<typeof setTimeout> | null;
    remote: ReturnType<typeof setTimeout> | null;
  }>({ local: null, remote: null });

  // handleVolume 要保持穩定，所以 muted 透過 ref 讀取，不進 useCallback 的 deps。
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // 靜音的當下就把本地邊框熄掉，不等 hold 到期，也不等 SDK 的下一次回報。
  useEffect(() => {
    if (!muted) return;
    const timers = timersRef.current;
    if (timers.local) clearTimeout(timers.local);
    timers.local = null;
    setLocalSpeaking(false);
  }, [muted]);

  const mark = useCallback(
    (key: "local" | "remote") => {
      const setSpeaking =
        key === "local" ? setLocalSpeaking : setRemoteSpeaking;
      const timers = timersRef.current;

      setSpeaking(true);
      if (timers[key]) clearTimeout(timers[key]);
      timers[key] = setTimeout(() => {
        timers[key] = null;
        setSpeaking(false);
      }, holdMs);
    },
    [holdMs],
  );

  const handleVolume = useCallback(
    (speakers: SpeakingVolume[]) => {
      for (const speaker of speakers) {
        if ((speaker.volume ?? 0) < threshold) continue;

        if (speaker.uid === LOCAL_AGORA_UID) {
          if (mutedRef.current) continue;
          mark("local");
        } else {
          mark("remote");
        }
      }
    },
    [mark, threshold],
  );

  useEffect(
    () => () => {
      const timers = timersRef.current;
      if (timers.local) clearTimeout(timers.local);
      if (timers.remote) clearTimeout(timers.remote);
    },
    [],
  );

  return { localSpeaking, remoteSpeaking, handleVolume };
}
