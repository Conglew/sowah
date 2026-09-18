import { apiClient } from "@/src/services/api/http-client";

export type AgoraCallCredentials = {
  app_id: string;
  channel: string;
  expire_secs: number;
  issued_at: string;
  role: "publisher" | "subscriber" | string;
  token: string;
  uid: string;
};

export type AgoraCallSource =
  | { type: "event"; uid: string }
  | { type: "match"; uid: string };

function getCallTokenPath(source: AgoraCallSource): string {
  const uid = encodeURIComponent(source.uid);
  return source.type === "event"
    ? `/events/${uid}/call-token`
    : `/matches/${uid}/call-token`;
}

export async function fetchAgoraCallCredentials(
  source: AgoraCallSource,
): Promise<AgoraCallCredentials> {
  const { data } = await apiClient.post<AgoraCallCredentials>(
    getCallTokenPath(source),
  );
  return data;
}
