import type { GroupSummary, SuggestedGroup } from "../types/group.types";

/** 後端尚未提供群組列表／推薦 endpoint 時的展示資料。 */
export const FALLBACK_GROUPS: GroupSummary[] = [
  {
    id: "fallback-ielts",
    name: "IELTS",
    visibility: "public",
    avatarUri: "https://picsum.photos/seed/sowah-ielts/200/200",
  },
  {
    id: "fallback-see-the-world",
    name: "See the world",
    visibility: "public",
    avatarUri: "https://picsum.photos/seed/sowah-world/200/200",
  },
  {
    id: "fallback-flatmates",
    name: "Flatmates",
    visibility: "private",
    avatarUri: "https://picsum.photos/seed/sowah-flatmates/200/200",
  },
];

export const FALLBACK_SUGGESTED_GROUPS: SuggestedGroup[] = [
  ["language-exchange", "Language exchange"],
  ["weekend-hikers", "Weekend hikers"],
  ["coffee-club", "Coffee club"],
  ["photo-walk", "Photo walk"],
  ["taipei-foodies", "Taipei foodies"],
  ["study-together", "Study together"],
].map(([id, name]) => ({
  id,
  name,
  coverUri: `https://picsum.photos/seed/sowah-${id}/200/200`,
}));
