import { Tabs } from 'expo-router';
import React from 'react';

import MainTabLayout from '@/src/components/layout/MainTabLayout';

export default function TabLayout() {
  return (
    <MainTabLayout>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
          },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="group" />
        <Tabs.Screen name="private" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </MainTabLayout>
  );
}