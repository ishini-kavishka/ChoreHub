import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { notificationService } from '@/services/notificationService';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  label: string;
  activeIcon: IconName;
  inactiveIcon: IconName;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  dashboard: {
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  progress: {
    label: 'Progress',
    activeIcon: 'bar-chart',
    inactiveIcon: 'bar-chart-outline',
  },
  notifications: {
    label: 'Alerts',
    activeIcon: 'notifications',
    inactiveIcon: 'notifications-outline',
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

export function AdminTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme, colors } = useAppTheme();
  const { t } = useLanguage();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const unsub = notificationService.subscribeUnreadCount(setUnread);
    notificationService.getUnreadCount().then(setUnread).catch(() => { });
    return () => {
      unsub();
    };
  }, []);

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

          const activeColor = theme === 'dark' ? '#BEABFF' : '#713DE8';
          const inactiveColor = '#8A879A';
          const currentColor = isFocused ? activeColor : inactiveColor;
          const iconName = isFocused ? tabConfig.activeIcon : tabConfig.inactiveIcon;

          const label =
            route.name === 'dashboard'
              ? t('home')
              : route.name === 'progress'
                ? t('admin_progress')
                : route.name === 'notifications'
                  ? t('notifications')
                  : t('profile');

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name={iconName} size={22} color={currentColor} style={styles.icon} />
                {route.name === 'notifications' && unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                  </View>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: currentColor },
                  isFocused && styles.activeLabel,
                ]}
              >
                {label}
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
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  activeLabel: {
    fontWeight: '800',
  },
});
