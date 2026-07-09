import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getCountryFlag } from "@/src/shared/utils/country-flag";

type Props = {
  username: string;
  avatarUri: string;
  countryCode: string;
  onBack: () => void;
};

export default function ChatHeader({
  username,
  avatarUri,
  countryCode,
  onBack,
}: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      {!!avatarUri && (
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      <Text style={styles.username} numberOfLines={1}>
        {username}
      </Text>
      <Text style={styles.flag}>{getCountryFlag(countryCode)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 54,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 32,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 30,
    color: "#555555",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEEEEE",
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  flag: {
    fontSize: 13,
  },
});
