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
      <Tabs.Screen name="chores" options={{ title: 'Chores' }} />
      <Tabs.Screen name="members" options={{ title: 'Members' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="add-chore" options={{ href: null }} />
    </Tabs>
  );
}
