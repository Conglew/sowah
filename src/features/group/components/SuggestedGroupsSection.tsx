import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { SuggestedGroup } from "../types/group.types";

export default function SuggestedGroupsSection({
  groups,
}: {
  groups: SuggestedGroup[];
}) {
  if (groups.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Suggested for you</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {groups.map((group) => (
          <View key={group.id} style={styles.card}>
            <View>
              <Image
                source={{ uri: group.coverUri }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>+</Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {group.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 10, paddingBottom: 8 },
  title: {
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  list: { gap: 21, paddingHorizontal: 20, paddingTop: 10 },
  card: { width: 64, alignItems: "center" },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#EEE" },
  badge: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#222",
    borderWidth: 1.5,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFF", fontSize: 13, lineHeight: 15, fontWeight: "600" },
  name: { marginTop: 5, fontSize: 11, textAlign: "center", color: "#444" },
});
