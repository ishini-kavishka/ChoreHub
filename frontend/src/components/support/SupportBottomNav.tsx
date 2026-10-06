import { useThemedStyles, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/authService';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabItem {
  id: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
  route: string;
}





export function SupportBottomNav({
  activeTab = 'profile',
  role: forcedRole,
}: {
  activeTab?: string;
  role?: 'admin' | 'member';
}) {
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
const CUSTOMER_TABS: TabItem[] = [
  { id: 'home', label: t('home'), icon: 'home-outline', activeIcon: 'home', route: '/home' },
  { id: 'chores', label: t('chores'), icon: 'clipboard-outline', activeIcon: 'clipboard', route: '/home/chores' },
  { id: 'family', label: t('family'), icon: 'people-outline', activeIcon: 'people', route: '/home/calendar' },
  { id: 'notifications', label: t('ui_notification'), icon: 'notifications-outline', activeIcon: 'notifications', route: '/home' },
  { id: 'profile', label: t('profile_title'), icon: 'person-outline', activeIcon: 'person', route: '/home/profile' },
];
const ADMIN_TABS: TabItem[] = [
  { id: 'home', label: t('ui_dashboard'), icon: 'grid-outline', activeIcon: 'grid', route: '/admin/dashboard' },
  { id: 'chores', label: t('chores'), icon: 'clipboard-outline', activeIcon: 'clipboard', route: '/admin/chores' },
  { id: 'members', label: t('admin_members'), icon: 'people-outline', activeIcon: 'people', route: '/admin/members' },
  { id: 'profile', label: t('profile_title'), icon: 'person-outline', activeIcon: 'person', route: '/admin/profile' },
];
  const insets = useSafeAreaInsets();
  const [currentRole, setCurrentRole] = useState<'admin' | 'member'>(forcedRole || 'member');

  useEffect(() => {
    if (forcedRole) {
      setCurrentRole(forcedRole);
      return;
    }
    authService.getCurrentMember().then((member) => {
      if (member?.role === 'admin') {
        setCurrentRole('admin');
      } else {
        setCurrentRole('member');
      }
    }).catch(() => {});
  }, [forcedRole]);

  const tabs = currentRole === 'admin' ? ADMIN_TABS : CUSTOMER_TABS;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const currentColor = isActive ? '#6C3BEA' : '#8A879A';
        const iconName = isActive ? tab.activeIcon : tab.icon;

        return (
          <Pressable
            key={tab.id}
            onPress={() => router.push(tab.route as any)}
            style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <Ionicons name={iconName} size={22} color={currentColor} style={styles.icon} />
            <Text
              style={[
                styles.label,
                { color: currentColor },
                isActive && styles.activeLabel,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderTopWidth: 1,
    borderTopColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  tabPressed: {
    opacity: 0.7,
  },
  icon: {
    marginBottom: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeLabel: {
    fontWeight: '700',
  },
});
