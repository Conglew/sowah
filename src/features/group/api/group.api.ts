import { apiClient } from "@/src/services/api/http-client";
import { FALLBACK_GROUPS } from "../data/fallback-groups";
import type {
  CreateGroupRequest,
  GroupInvitation,
  GroupMember,
  GroupResource,
  GroupsPage,
  GroupSummary,
  GroupVisibility,
  UpdateGroupRequest,
} from "../types/group.types";

type GroupResourcesPage = {
  groups: GroupResource[];
  limit: number;
  offset: number;
  total: number;
};

type GroupInvitationsPage = {
  invitations: GroupInvitation[];
  limit: number;
  offset: number;
  total: number;
};

type GroupMembersPage = {
  members: GroupMember[];
  limit: number;
  offset: number;
  total: number;
};

function toSummary(group: GroupResource): GroupSummary {
  return {
    id: group.group_uid,
    name: group.group_id,
    visibility: group.visibility,
    avatarUri: group.icon?.download_url ?? "",
    lastMessageAt: group.updated_at,
  };
}

function normalizeGroupsPage(
  data: GroupResourcesPage | GroupResource[],
): GroupResourcesPage {
  if (Array.isArray(data)) {
    return { groups: data, limit: data.length, offset: 0, total: data.length };
  }
  return data;
}

function isGroupResource(value: unknown): value is GroupResource {
  if (typeof value !== "object" || value === null) return false;
  const group = value as Partial<GroupResource>;
  return (
    typeof group.group_uid === "string" &&
    typeof group.group_id === "string" &&
    (group.visibility === "public" || group.visibility === "private") &&
    typeof group.updated_at === "string"
  );
}

function isMissingEndpoint(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return false;
  }
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 404 || status === 405 || status === 501;
}

function fallbackGroupsPage(params: {
  visibility: GroupVisibility;
  cursor: string | null;
  pageSize: number;
  searchQuery: string;
}): GroupsPage {
  const offset = params.cursor ? Number(params.cursor) : 0;
  const safeOffset = Number.isFinite(offset) ? offset : 0;
  const query = params.searchQuery.trim().toLowerCase();
  const source = FALLBACK_GROUPS.filter(
    (group) =>
      group.visibility === params.visibility &&
      (!query || group.name.toLowerCase().includes(query)),
  );
  const groups = source.slice(safeOffset, safeOffset + params.pageSize);
  const nextOffset = safeOffset + groups.length;

  return {
    groups,
    nextCursor: nextOffset < source.length ? String(nextOffset) : null,
    counts: {
      public: FALLBACK_GROUPS.filter((group) => group.visibility === "public")
        .length,
      private: FALLBACK_GROUPS.filter((group) => group.visibility === "private")
        .length,
    },
  };
}

export const groupApi = {
  async getGroupsPage(params: {
    visibility: GroupVisibility;
    cursor: string | null;
    pageSize: number;
    searchQuery: string;
  }): Promise<GroupsPage> {
    const offset = params.cursor ? Number(params.cursor) : 0;
    const safeOffset = Number.isFinite(offset) ? offset : 0;
    try {
      const { data } = await apiClient.get<
        GroupResourcesPage | GroupResource[]
      >("/groups", {
        params: {
          visibility: params.visibility,
          sort: "newest",
          limit: params.pageSize,
          offset: safeOffset,
          q: params.searchQuery || undefined,
        },
      });
      const page = normalizeGroupsPage(data);
      if (!Array.isArray(page.groups)) return fallbackGroupsPage(params);
      if (page.groups.some((group) => !isGroupResource(group))) {
        return fallbackGroupsPage(params);
      }
      const normalizedQuery = params.searchQuery.trim().toLowerCase();
      const groups = page.groups
        .filter((group) => group.visibility === params.visibility)
        .filter(
          (group) =>
            !normalizedQuery ||
            group.group_id.toLowerCase().includes(normalizedQuery),
        )
        .map(toSummary);
      const nextOffset = page.offset + page.groups.length;

      return {
        groups,
        nextCursor: nextOffset < page.total ? String(nextOffset) : null,
        counts: {
          public: params.visibility === "public" ? page.total : 0,
          private: params.visibility === "private" ? page.total : 0,
        },
      };
    } catch (error) {
      if (isMissingEndpoint(error)) return fallbackGroupsPage(params);
      throw error;
    }
  },

  async create(body: CreateGroupRequest): Promise<GroupResource> {
    const { data } = await apiClient.post<GroupResource>("/groups", body);
    return data;
  },

  async getByUid(groupUid: string): Promise<GroupResource> {
    const { data } = await apiClient.get<GroupResource>(
      `/groups/${encodeURIComponent(groupUid)}`,
    );
    return data;
  },

  async getById(groupId: string): Promise<GroupResource> {
    const { data } = await apiClient.get<GroupResource>(
      `/groups/by-id/${encodeURIComponent(groupId)}`,
    );
    return data;
  },

  async update(
    groupUid: string,
    body: UpdateGroupRequest,
  ): Promise<GroupResource> {
    const { data } = await apiClient.patch<GroupResource>(
      `/groups/${encodeURIComponent(groupUid)}`,
      body,
    );
    return data;
  },

  async delete(groupUid: string): Promise<void> {
    await apiClient.delete(`/groups/${encodeURIComponent(groupUid)}`);
  },

  async listIncomingInvitations(
    params: {
      sort?: "newest" | "oldest";
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<GroupInvitationsPage> {
    const { data } = await apiClient.get<GroupInvitationsPage>(
      "/groups/invitations/incoming",
      { params },
    );
    return data;
  },

  async invite(groupUid: string, invitee: string): Promise<void> {
    await apiClient.post(
      `/groups/${encodeURIComponent(groupUid)}/invitations`,
      {
        invitee,
      },
    );
  },

  async acceptInvitation(groupUid: string): Promise<void> {
    await apiClient.post(
      `/groups/${encodeURIComponent(groupUid)}/invitations/accept`,
    );
  },

  async declineInvitation(groupUid: string): Promise<void> {
    await apiClient.post(
      `/groups/${encodeURIComponent(groupUid)}/invitations/decline`,
    );
  },

  async listMembers(
    groupUid: string,
    params: {
      sort?: "newest" | "oldest";
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<GroupMembersPage> {
    const { data } = await apiClient.get<GroupMembersPage>(
      `/groups/${encodeURIComponent(groupUid)}/members`,
      { params },
    );
    return data;
  },

  async leave(groupUid: string): Promise<void> {
    await apiClient.delete(
      `/groups/${encodeURIComponent(groupUid)}/members/me`,
    );
  },

  async removeMember(groupUid: string, userUid: string): Promise<void> {
    await apiClient.delete(
      `/groups/${encodeURIComponent(groupUid)}/members/${encodeURIComponent(userUid)}`,
    );
  },
};
