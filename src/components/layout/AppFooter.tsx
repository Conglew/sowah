import { router, usePathname } from "expo-router";
import type { FC } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SvgProps } from "react-native-svg";

import ChatIcon from "@/src/assets/icons/chat_icon.svg";
import ChatIconActive from "@/src/assets/icons/chat_icon_slc.svg";
import GroupIcon from "@/src/assets/icons/group_icon.svg";
import GroupIconActive from "@/src/assets/icons/group_icon_slc.svg";
import HomeIcon from "@/src/assets/icons/home_icon.svg";
import HomeIconActive from "@/src/assets/icons/home_icon_slc.svg";
// TODO: 補上 profile 這組 svg，否則以下兩行 import 會失敗
import ProfileIcon from "@/src/assets/icons/profile_icon.svg";
import ProfileIconActive from "@/src/assets/icons/profile_icon_slc.svg";

import { useHomeFeedControlStore } from "@/src/features/home/stores/home-feed-control.store";
import { colors } from "@/src/theme/colors";

type FooterItem = {
  label: string;
  Icon: FC<SvgProps>;
  ActiveIcon: FC<SvgProps>;
  path: "/(tabs)" | "/(tabs)/group" | "/(tabs)/private" | "/(tabs)/profile";
};

const ICON_SIZE = 26;

const footerItems: FooterItem[] = [
  {
    label: "Home",
    Icon: HomeIcon,
    ActiveIcon: HomeIconActive,
    path: "/(tabs)",
  },
  {
    label: "Group",
    Icon: GroupIcon,
    ActiveIcon: GroupIconActive,
    path: "/(tabs)/group",
  },
  {
    label: "Private",
    Icon: ChatIcon,
    ActiveIcon: ChatIconActive,
    path: "/(tabs)/private",
  },
  {
    label: "Profile",
    Icon: ProfileIcon,
    ActiveIcon: ProfileIconActive,
    path: "/(tabs)/profile",
  },
];

export default function AppFooter() {
  const pathname = usePathname();

  const requestHomeFeedReset = useHomeFeedControlStore(
    (state) => state.requestHomeFeedReset,
  );

  const isActive = (path: FooterItem["path"]) => {
    if (path === "/(tabs)") {
      return pathname === "/" || pathname === "/index";
    }

    return pathname.includes(path.replace("/(tabs)", ""));
  };

  const handleFooterItemPress = (item: FooterItem) => {
    if (item.path === "/(tabs)") {
      requestHomeFeedReset();
    }

    router.push(item.path);
  };

  const renderItem = (item: FooterItem) => {
    const active = isActive(item.path);
    const Icon = active ? item.ActiveIcon : item.Icon;

    return (
      <TouchableOpacity
        key={item.path}
        activeOpacity={0.75}
        style={styles.footerItem}
        onPress={() => handleFooterItemPress(item)}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        <Icon width={ICON_SIZE} height={ICON_SIZE} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.footer}>
      <View style={styles.sideItems}>
        {footerItems.slice(0, 2).map(renderItem)}
      </View>

      <TouchableOpacity activeOpacity={0.85} style={styles.playButton}>
        <Text style={styles.playText}>PLAY</Text>
        <Text style={styles.playSubText}>1V1 MATCH</Text>
      </TouchableOpacity>

      <View style={styles.sideItems}>
        {footerItems.slice(2).map(renderItem)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 76,
    paddingHorizontal: 22,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sideItems: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  footerItem: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginHorizontal: 10,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "#FFE4C7",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  playText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  playSubText: {
    fontSize: 6,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
