import { PermissionsAndroid, Platform } from "react-native";
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  type AudioVolumeInfo,
  type ErrorCodeType,
  type IRtcEngine,
  type IRtcEngineEventHandler,
  type RtcConnection,
  type UserOfflineReasonType,
} from "react-native-agora";

import {
  fetchAgoraCallCredentials,
  type AgoraCallCredentials,
  type AgoraCallSource,
} from "./agora-call.api";

/**
 * Agora 音量回報的取樣間隔（毫秒）。
 * 太短會讓 JS 端每秒被喚醒很多次，太長則邊框跟不上說話節奏，200ms 是實測的平衡點。
 */
const VOLUME_INDICATION_INTERVAL_MS = 200;

/** 音量平滑係數（0-10）。數字越大越不容易因為單一音節跳動。 */
const VOLUME_INDICATION_SMOOTH = 3;

export type AgoraVoiceListener = {
  onJoined?: (connection: RtcConnection) => void;
  onRemoteUserJoined?: (uid: number) => void;
  onRemoteUserLeft?: (uid: number, reason: UserOfflineReasonType) => void;
  /** Agora numeric uid 與應用程式 user_uid 的對應。 */
  onRemoteUserIdentified?: (uid: number, userAccount: string) => void;
  onRemoteUserMuteChanged?: (uid: number, muted: boolean) => void;
  onLeft?: () => void;
  onError?: (code: ErrorCodeType, message: string) => void;
  onTokenRenewed?: (credentials: AgoraCallCredentials) => void;
  /**
   * 音量回報。speakers 內 uid 為 0 的那筆代表「本地使用者」（Agora 的慣例，
   * 不是你自己的 uid），其餘為遠端。需要 enableAudioVolumeIndication 開啟後才會有事件。
   */
  onAudioVolume?: (speakers: AudioVolumeInfo[], totalVolume: number) => void;
};

class AgoraVoiceService {
  private engine: IRtcEngine | null = null;
  private appId: string | null = null;
  private source: AgoraCallSource | null = null;
  private credentials: AgoraCallCredentials | null = null;
  private listener: AgoraVoiceListener = {};
  private renewingToken: Promise<void> | null = null;

  private readonly eventHandler: IRtcEngineEventHandler = {
    onJoinChannelSuccess: (connection) => {
      this.listener.onJoined?.(connection);
    },
    onUserJoined: (_connection, uid) => {
      this.listener.onRemoteUserJoined?.(uid);
    },
    onUserOffline: (_connection, uid, reason) => {
      this.listener.onRemoteUserLeft?.(uid, reason);
    },
    onUserInfoUpdated: (uid, info) => {
      if (info.userAccount) {
        this.listener.onRemoteUserIdentified?.(uid, info.userAccount);
      }
    },
    onUserMuteAudio: (_connection, uid, muted) => {
      try {
        const userAccount = this.engine?.getUserInfoByUid(uid).userAccount;
        if (userAccount) {
          this.listener.onRemoteUserIdentified?.(uid, userAccount);
        }
      } catch {
        // 部分 SDK 版本會在 mapping 尚未建立時丟錯；mute callback 仍照常往上送。
      }
      this.listener.onRemoteUserMuteChanged?.(uid, muted);
    },
    onLeaveChannel: () => {
      this.listener.onLeft?.();
    },
    onError: (code, message) => {
      this.listener.onError?.(code, message);
    },
    onAudioVolumeIndication: (_connection, speakers, _speakerNumber, total) => {
      this.listener.onAudioVolume?.(speakers ?? [], total ?? 0);
    },
    onTokenPrivilegeWillExpire: () => {
      void this.renewToken();
    },
    onRequestToken: () => {
      void this.renewToken();
    },
  };

  async join(
    source: AgoraCallSource,
    listener: AgoraVoiceListener = {},
  ): Promise<AgoraCallCredentials> {
    this.listener = listener;
    await this.requestMicrophonePermission();

    const credentials = await fetchAgoraCallCredentials(source);
    this.initializeEngine(credentials.app_id);
    this.source = source;
    this.credentials = credentials;

    const mediaOptions = {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      publishMicrophoneTrack: true,
      autoSubscribeAudio: true,
    };
    const numericUid = this.toAgoraNumericUid(credentials.uid);
    const result =
      numericUid === null
        ? this.engine!.joinChannelWithUserAccount(
            credentials.token,
            credentials.channel,
            credentials.uid,
            mediaOptions,
          )
        : this.engine!.joinChannel(
            credentials.token,
            credentials.channel,
            numericUid,
            mediaOptions,
          );

    if (result < 0) {
      throw new Error(`Agora 加入頻道失敗（錯誤碼 ${result}）`);
    }

    return credentials;
  }

  async joinEvent(
    eventUid: string,
    listener?: AgoraVoiceListener,
  ): Promise<AgoraCallCredentials> {
    return this.join({ type: "event", uid: eventUid }, listener);
  }

  async joinMatch(
    matchUid: string,
    listener?: AgoraVoiceListener,
  ): Promise<AgoraCallCredentials> {
    return this.join({ type: "match", uid: matchUid }, listener);
  }

  leave(): void {
    this.engine?.leaveChannel();
    this.source = null;
    this.credentials = null;
  }

  setMuted(muted: boolean): void {
    this.assertInitialized();
    const result = this.engine!.muteLocalAudioStream(muted);
    if (result < 0) {
      throw new Error(`Agora 切換麥克風失敗（錯誤碼 ${result}）`);
    }
  }

  setSpeakerEnabled(enabled: boolean): void {
    this.assertInitialized();
    const result = this.engine!.setEnableSpeakerphone(enabled);
    if (result < 0) {
      throw new Error(`Agora 切換音訊輸出失敗（錯誤碼 ${result}）`);
    }
  }

  destroy(): void {
    if (!this.engine) return;
    this.engine.unregisterEventHandler(this.eventHandler);
    this.engine.leaveChannel();
    this.engine.release();
    this.engine = null;
    this.appId = null;
    this.source = null;
    this.credentials = null;
    this.listener = {};
  }

  getCurrentCredentials(): AgoraCallCredentials | null {
    return this.credentials;
  }

  private initializeEngine(appId: string): void {
    if (this.engine && this.appId === appId) return;
    if (this.engine) this.destroy();

    const engine = createAgoraRtcEngine();
    const result = engine.initialize({
      appId,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
    });
    if (result < 0) {
      engine.release();
      throw new Error(`Agora 初始化失敗（錯誤碼 ${result}）`);
    }

    engine.registerEventHandler(this.eventHandler);
    engine.enableAudio();
    // 不主動呼叫這行就完全不會有 onAudioVolumeIndication 事件（Agora 預設關閉）。
    // 第三個參數 reportVad=true 會額外回報本地的人聲偵測結果。
    engine.enableAudioVolumeIndication(
      VOLUME_INDICATION_INTERVAL_MS,
      VOLUME_INDICATION_SMOOTH,
      true,
    );
    this.engine = engine;
    this.appId = appId;
  }

  private async renewToken(): Promise<void> {
    if (!this.source || !this.engine) return;
    if (this.renewingToken) return this.renewingToken;

    this.renewingToken = (async () => {
      try {
        const credentials = await fetchAgoraCallCredentials(this.source!);
        const result = this.engine!.renewToken(credentials.token);
        if (result < 0) {
          throw new Error(`Agora 更新 token 失敗（錯誤碼 ${result}）`);
        }
        this.credentials = credentials;
        this.listener.onTokenRenewed?.(credentials);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Agora token 更新失敗";
        this.listener.onError?.(-1 as ErrorCodeType, message);
      } finally {
        this.renewingToken = null;
      }
    })();

    return this.renewingToken;
  }

  private async requestMicrophonePermission(): Promise<void> {
    if (Platform.OS !== "android") return;

    const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) return;

    const result = await PermissionsAndroid.request(permission, {
      title: "麥克風權限",
      message: "SoWah 需要使用麥克風才能進行語音通話。",
      buttonPositive: "允許",
      buttonNegative: "取消",
    });

    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error("未取得麥克風權限，無法開始語音通話。");
    }
  }

  private assertInitialized(): void {
    if (!this.engine) {
      throw new Error("Agora 尚未初始化或已經釋放。");
    }
  }

  /**
   * 後端 schema 將 uid 定義為字串，但實際 token 可能使用 Agora numeric UID。
   * 純數字且在 uint32 範圍內時走 joinChannel，UUID／一般字串則走 User Account API。
   */
  private toAgoraNumericUid(uid: string): number | null {
    if (!/^\d+$/.test(uid)) return null;
    const value = Number(uid);
    return Number.isSafeInteger(value) && value >= 0 && value <= 4_294_967_295
      ? value
      : null;
  }
}

export const agoraVoice = new AgoraVoiceService();
