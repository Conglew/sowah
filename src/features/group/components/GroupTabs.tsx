import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "@/src/theme/colors";
import type { GroupVisibility } from "../types/group.types";

type Props = {
  activeVisibility: GroupVisibility;
  /** 兩個 tab 的群組總數；第一頁還沒載回來前是 null，此時不顯示括號數字 */
  counts: Record<GroupVisibility, number> | null;
  onVisibilityChange: (visibility: GroupVisibility) => void;
};

const TAB_ORDER: { key: GroupVisibility; label: string }[] = [
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
];

/** 「Your Group」標題 + Public / Private 切換 pill。 */
export default function GroupTabs({
  activeVisibility,
  counts,
  onVisibilityChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Group</Text>

      <View style={styles.tabRow}>
        {TAB_ORDER.map(({ key, label }) => {
          const isActive = key === activeVisibility;
          const countLabel = counts ? ` (${counts[key]})` : "";

          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.7}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onVisibilityChange(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {label}
                {countLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111111",
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.brandStrong,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777777",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
});
