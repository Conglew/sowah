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

      {/*
        頭像＋名字＋國旗要在整個 header 置中，不是「扣掉返回鍵之後的剩餘空間置中」，
        所以右邊補一個跟 backButton 同寬的隱形 spacer 平衡，這一整組 titleWrap
        才會落在畫面正中央，不會因為左邊多了一顆返回鍵而偏右。
      */}
      <View style={styles.titleWrap}>
        {/* 國旗改成貼在頭像右下角的小徽章，不是跟在名字後面（跟 PrivateConversationRow 的
            friendBadge 是同一種「絕對定位貼在圖片角落」寫法，維持頭像/徽章的視覺慣例一致） */}
        <View style={styles.avatarWrap}>
          {!!avatarUri && (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}
          <View style={styles.flagBadge}>
            <Text style={styles.flagText}>{getCountryFlag(countryCode)}</Text>
          </View>
        </View>

        <Text style={styles.username} numberOfLines={1}>
          {username}
        </Text>
      </View>

      <View style={styles.rightSpacer} />
    </View>
  );
}

const BACK_BUTTON_WIDTH = 32;

const styles = StyleSheet.create({
  header: {
    height: 54,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: BACK_BUTTON_WIDTH,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rightSpacer: {
    width: BACK_BUTTON_WIDTH,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 30,
    color: "#555555",
  },
  // 不設固定寬高，讓這層直接貼合 Image 實際大小，flagBadge 才會緊貼頭像邊緣不留空隙
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEEEEE",
  },
  flagBadge: {
    position: "absolute",
    bottom: -2,
    right: -4,
    minWidth: 16,
    height: 12,
    paddingHorizontal: 1,
    borderRadius: 3,
    backgroundColor: "transpent",
    alignItems: "center",
    justifyContent: "center",
  },
  flagText: {
    fontSize: 10,
    lineHeight: 11,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    flexShrink: 1,
  },
});
