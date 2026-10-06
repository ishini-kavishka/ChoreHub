import { translateFeedback } from '@/i18n/translations';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { settingsService, NotificationSettings } from '@/services/settingsService';

const purple = '#7C5CFC';

type ReminderTimeKey = '10min' | '30min' | '1hour' | '1day';

interface ReminderOption {
  key: ReminderTimeKey;
  labelKey: '10_min' | '30_min' | '1_hour' | '1_day';
}

const REMINDER_OPTIONS: ReminderOption[] = [
  { key: '10min', labelKey: '10_min' },
  { key: '30min', labelKey: '30_min' },
  { key: '1hour', labelKey: '1_hour' },
  { key: '1day', labelKey: '1_day' },
];

const DEFAULT_SETTINGS: NotificationSettings = {
  chore_reminders: true,
  chore_completions: true,
  family_updates: true,
  announcements: false,
  reminder_time: '10min',
};

export default function ReminderTimeScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme, colors } = useAppTheme();
  const { t } = useLanguage();
  const dark = colors.isDark;

  const bg = colors.background;
  const card = colors.card;
  const fg = colors.textPrimary;
  const muted = colors.textSecondary;
  const circleBorder = colors.border;

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [selectedTime, setSelectedTime] = useState<ReminderTimeKey>('10min');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetched = await settingsService.getNotificationSettings();
      setSettings(fetched);
      if (fetched.reminder_time) {
        setSelectedTime(fetched.reminder_time);
      }
    } catch (e) {
      setError(t('admin_error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings])
  );

  // Handle hardware / Android system Back to guarantee return to Settings screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.navigate('/home/settings' as any);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleSelect = async (optionKey: ReminderTimeKey) => {
    if (selectedTime === optionKey && !error) return;

    const previousTime = selectedTime;
    setSelectedTime(optionKey);
    setSaving(true);
    setError('');

    const updatedSettings: NotificationSettings = {
      ...settings,
      reminder_time: optionKey,
    };

    try {
      const result = await settingsService.saveNotificationSettings(updatedSettings);
      setSettings(result);
    } catch (e) {
      // Revert optimistic selection on error
      setSelectedTime(previousTime);
      setError(t('admin_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {/* Header with back button to Settings */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('admin_back')}
          onPress={() => router.navigate('/home/settings' as any)}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={purple} />
        </Pressable>
        <Text style={[styles.title, { color: fg }]}>{t('reminder_time')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void loadSettings()}
            tintColor={purple}
          />
        }
      >
        <Text style={[styles.description, { color: muted }]}>{t('ui_choose_when_to_be_notified_before_a_chore_is_due')}</Text>

        {loading && <ActivityIndicator color={purple} style={{ marginVertical: 12 }} />}

        {/* 4 Selectable Reminder Time Options (Radio Group) */}
        {REMINDER_OPTIONS.map((item) => {
          const isSelected = selectedTime === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={t(item.labelKey)}
              onPress={() => void handleSelect(item.key)}
              style={({ pressed }) => [
                styles.optionCard,
                { backgroundColor: card },
                pressed && { opacity: 0.8 },
              ]}
            >
              {/* Radio circle on the left */}
              {isSelected ? (
                <View style={[styles.radioSelected, { backgroundColor: purple }]} />
              ) : (
                <View style={[styles.radioUnselected, { borderColor: circleBorder }]} />
              )}

              {/* Option label on the right */}
              <Text style={[styles.optionLabel, { color: fg }]}>{t(item.labelKey)}</Text>
            </Pressable>
          );
        })}

        {/* Error message if saving failed */}
        {!!error && <Text style={styles.errorText}>{translateFeedback(error, t)}</Text>}

        {/* Purple Informational Card at bottom (Not a button) */}
        <View style={[styles.infoCard, { backgroundColor: purple }]}>
          <Text style={styles.infoCardText}>{t('ui_stay_on_track_reminders_follow_your_selected_time')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  body: {
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 4,
  },
  optionCard: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  radioSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  radioUnselected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  infoCard: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardText: {
    color: (themeColors.isDark ? themeColors.textPrimary : '#FFFFFF'),
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: (themeColors.isDark ? themeColors.error : '#EF4444'),
    fontSize: 13,
    marginTop: 4,
  },
});
