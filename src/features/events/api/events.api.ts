import { apiClient } from "@/src/services/api/http-client";
import type {
  CreateEventRequest,
  EventParticipantPage,
  EventResource,
  JoinEventResult,
  UpdateEventRequest,
} from "../types/events.types";

export type EventWindowParams = {
  start: string;
  end: string;
  sort?: "newest" | "oldest";
};

export type PublicEventParams = EventWindowParams & {
  limit?: number;
  offset?: number;
};

type EventsResponse = { events: EventResource[] };
type EventsPage = EventsResponse & {
  limit: number;
  offset: number;
  total: number;
};

export const eventsApi = {
  async create(body: CreateEventRequest): Promise<EventResource> {
    const { data } = await apiClient.post<EventResource>("/events", body);
    return data;
  },

  async listJoined(params: EventWindowParams): Promise<EventResource[]> {
    const { data } = await apiClient.get<EventsResponse>("/events/joined", {
      params,
    });
    return data.events;
  },

  async listPublic(params: PublicEventParams): Promise<EventsPage> {
    const { data } = await apiClient.get<EventsPage>("/events/public", {
      params,
    });
    return data;
  },

  async getById(eventUid: string): Promise<EventResource> {
    const { data } = await apiClient.get<EventResource>(
      `/events/${encodeURIComponent(eventUid)}`,
    );
    return data;
  },

  async update(
    eventUid: string,
    body: UpdateEventRequest,
  ): Promise<EventResource> {
    const { data } = await apiClient.patch<EventResource>(
      `/events/${encodeURIComponent(eventUid)}`,
      body,
    );
    return data;
  },

  async delete(eventUid: string): Promise<void> {
    await apiClient.delete(`/events/${encodeURIComponent(eventUid)}`);
  },

  async joinEvent(eventUid: string): Promise<JoinEventResult> {
    await apiClient.post(`/events/${encodeURIComponent(eventUid)}/join`);
    return { eventId: eventUid, notificationQueued: false };
  },

  async leaveEvent(eventUid: string): Promise<void> {
    await apiClient.post(`/events/${encodeURIComponent(eventUid)}/leave`);
  },

  async listParticipants(
    eventUid: string,
    params: {
      sort?: "newest" | "oldest";
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<EventParticipantPage> {
    const { data } = await apiClient.get<EventParticipantPage>(
      `/events/${encodeURIComponent(eventUid)}/participants`,
      { params },
    );
    return data;
  },
};
