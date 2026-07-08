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
import { useMatchFrameStore } from "@/src/stores/match-frame.store";

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

  const toggleMatchFrame = useMatchFrameStore((state) => state.toggle);

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

      <View style={styles.playWrap} pointerEvents="box-none">
        {/* 白環（靜態、不發光）→ 橘外圈(#FFC080，微微發光) → 橘內圈(#FF8100) */}
        <View style={styles.playRing}>
          <View style={styles.playOuter}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.playButton}
              onPress={toggleMatchFrame}
            >
              <Text style={styles.playText}>PLAY</Text>
              <Text style={styles.playSubText}>1V1 MATCH</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.sideItems}>
        {footerItems.slice(2).map(renderItem)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 76,
    paddingHorizontal: 26,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    // footer 上緣分隔線
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6E6E6",
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
  // 外層：讓按鈕與光暈往上凸出 footer
  playWrap: {
    width: 108,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -25 }],
  },
  // 白色外環：純白、不發光。overflow hidden 把裡面橘色的光暈限制在白圈內
  playRing: {
    width: 115,
    height: 115,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // 橘色外圈 #FFC080，微微發光（光暈來自這層，不是白環）
  playOuter: {
    width: 84,
    height: 84,
    borderRadius: 43,
    backgroundColor: "#FFC080",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8100",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  // 橘色內圈 #FF8100
  playButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#FF8100",
    alignItems: "center",
    justifyContent: "center",
  },
  playText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    // lineHeight: 24,
  },
  playSubText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
