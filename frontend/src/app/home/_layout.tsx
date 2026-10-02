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
      {/* Main Tab Screens */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />

      <Tabs.Screen
        name="chores"
        options={{
          title: 'Chores',
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notification',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />

      {/* Hidden Screens - Progress & Settings */}
      <Tabs.Screen
        name="completed-chores"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="notification-settings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="preferences"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          href: null,
        }}
      />

      {/* Hidden Screens - Chore Management */}
      <Tabs.Screen
        name="chore-details"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="chore-completed"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}