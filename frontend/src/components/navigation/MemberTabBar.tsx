import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { useLanguage } from '@/context/LanguageContext';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  label: string;
  activeIcon: IconName;
  inactiveIcon: IconName;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  chores: {
    label: 'Chores',
    activeIcon: 'clipboard',
    inactiveIcon: 'clipboard-outline',
  },
  calendar: {
    label: 'Calendar',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
  notifications: { label: 'Notification', activeIcon: 'notifications', inactiveIcon: 'notifications-outline' },
};

export function MemberTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [unread, setUnread] = useState(0);
  const { t } = useLanguage();
  useEffect(() => { let mounted = true; const load = async () => { try { const n = await notificationService.getUnreadCount(); if (mounted) setUnread(n); } catch { if (mounted) setUnread(0); } }; const unsubscribe = notificationService.subscribeUnreadCount((n) => { if (mounted) setUnread(n); }); load(); const timer = setInterval(load, 30000); return () => { mounted = false; unsubscribe(); clearInterval(timer); }; }, []);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes
        .filter((route) => TAB_CONFIGS[route.name] !== undefined)
        .map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tabConfig = TAB_CONFIGS[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const activeColor = '#6C3BEA';
        const inactiveColor = '#8A879A';
        const currentColor = isFocused ? activeColor : inactiveColor;
        const iconName = isFocused ? tabConfig.activeIcon : tabConfig.inactiveIcon;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={route.name === 'notifications' ? t('notifications') : route.name === 'index' ? t('home') : route.name === 'chores' ? t('chores') : route.name === 'calendar' ? t('family') : t('profile')}
          >
            <Ionicons name={iconName} size={22} color={currentColor} style={styles.icon} />
            {route.name === 'notifications' && unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>}
            <Text
              style={[
                styles.label,
                { color: currentColor },
                isFocused && styles.activeLabel,
              ]}
              >
              {route.name === 'notifications' ? t('notifications') : route.name === 'index' ? t('home') : route.name === 'chores' ? t('chores') : route.name === 'calendar' ? t('family') : t('profile')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE7F5',
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
  badge: { position: 'absolute', top: -3, marginLeft: 20, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
