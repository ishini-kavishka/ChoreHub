import { useLanguage } from '@/context/LanguageContext';
import React from 'react';
import { Tabs } from 'expo-router';
import { AdminTabBar } from '@/components/navigation/AdminTabBar';

export default function AdminLayout() {
  const { t } = useLanguage();
  return (
    <Tabs
      tabBar={(props: any) => <AdminTabBar {...props} />}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t('home') }} />
      <Tabs.Screen name="progress" options={{ title: t('progress_title') }} />
      <Tabs.Screen name="notifications" options={{ title: t('notifications_title') }} />
      <Tabs.Screen name="chores" options={{ href: null }} />
      <Tabs.Screen name="members" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: t('profile_title') }} />
      <Tabs.Screen name="add-chore" options={{ href: null }} />
      <Tabs.Screen name="edit-chore" options={{ href: null }} />
      <Tabs.Screen name="chore-details" options={{ href: null }} />
      <Tabs.Screen name="add-family-member" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="language" options={{ href: null }} />
      <Tabs.Screen name="reminder-time" options={{ href: null }} />
      <Tabs.Screen name="preferences" options={{ href: null }} />
      <Tabs.Screen name="notification-settings" options={{ href: null }} />
      <Tabs.Screen name="completed-chores" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="reminders" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
    </Tabs>
  );
}
