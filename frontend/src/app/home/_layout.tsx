import React from 'react';
import { Tabs } from 'expo-router';
import { MemberTabBar } from '@/components/navigation/MemberTabBar';

export default function HomeLayout() {
  return (
    <Tabs
      tabBar={(props: any) => <MemberTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="chores" options={{ title: 'Chores' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="chore-details" options={{ href: null }} />
      <Tabs.Screen name="chore-completed" options={{ href: null }} />
    </Tabs>
  );
}
