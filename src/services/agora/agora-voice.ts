import { PermissionsAndroid, Platform } from "react-native";
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
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

export type AgoraVoiceListener = {
  onJoined?: (connection: RtcConnection) => void;
  onRemoteUserJoined?: (uid: number) => void;
  onRemoteUserLeft?: (uid: number, reason: UserOfflineReasonType) => void;
  onLeft?: () => void;
  onError?: (code: ErrorCodeType, message: string) => void;
  onTokenRenewed?: (credentials: AgoraCallCredentials) => void;
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
    onLeaveChannel: () => {
      this.listener.onLeft?.();
    },
    onError: (code, message) => {
      this.listener.onError?.(code, message);
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
