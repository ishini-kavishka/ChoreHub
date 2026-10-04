import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  labelKey: string;
  activeIcon: IconName;
  inactiveIcon: IconName;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    labelKey: 'tab_home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  chores: {
    labelKey: 'tab_chores',
    activeIcon: 'clipboard',
    inactiveIcon: 'clipboard-outline',
  },
  calendar: {
    labelKey: 'tab_calendar',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  profile: {
    labelKey: 'tab_profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

export function MemberTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
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

          const activeColor = colors.primary;
          const inactiveColor = colors.textSecondary;
          const currentColor = isFocused ? activeColor : inactiveColor;
          const iconName = isFocused ? tabConfig.activeIcon : tabConfig.inactiveIcon;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tabConfig.label}
            >
              <Ionicons name={iconName} size={22} color={currentColor} style={styles.icon} />
              <Text
                style={[
                  styles.label,
                  { color: currentColor },
                  isFocused && styles.activeLabel,
                ]}
              >
                {tabConfig.label}
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
});
