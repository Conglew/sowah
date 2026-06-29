import { Tabs } from "expo-router";
import React from "react";

import MainTabLayout from "@/src/components/layout/MainTabLayout";
import { useHomeFeedControlStore } from "@/src/features/home/stores/home-feed-control.store";

export default function TabLayout() {
  const requestHomeFeedReset = useHomeFeedControlStore(
    (state) => state.requestHomeFeedReset,
  );

  return (
    <MainTabLayout>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: "none",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          listeners={{
            tabPress: () => {
              requestHomeFeedReset();
            },
          }}
        />

        <Tabs.Screen name="group" />
        <Tabs.Screen name="private" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </MainTabLayout>
  );
}