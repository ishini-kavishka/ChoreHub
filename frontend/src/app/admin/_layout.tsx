import React from 'react';
import { Tabs } from 'expo-router';
import { AdminTabBar } from '@/components/navigation/AdminTabBar';

export default function AdminLayout() {
  return (
    <Tabs
      tabBar={(props: any) => <AdminTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Tabs.Screen name="chores" options={{ title: 'Chores' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="members" options={{ href: null }} />
      <Tabs.Screen name="add-chore" options={{ href: null }} />
      <Tabs.Screen name="edit-chore" options={{ href: null }} />
      <Tabs.Screen name="chore-details" options={{ href: null }} />
      <Tabs.Screen name="add-family-member" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="completed-chores" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="reminders" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
    </Tabs>
  );
}
