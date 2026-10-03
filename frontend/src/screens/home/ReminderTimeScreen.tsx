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
import { settingsService, NotificationSettings } from '@/services/settingsService';

const purple = '#7C5CFC';

type ReminderTimeKey = '10min' | '30min' | '1hour' | '1day';

interface ReminderOption {
  key: ReminderTimeKey;
  label: string;
}

const REMINDER_OPTIONS: ReminderOption[] = [
  { key: '10min', label: '10 minutes before' },
  { key: '30min', label: '30 minutes before' },
  { key: '1hour', label: '1 hour before' },
  { key: '1day', label: '1 day before' },
];

const DEFAULT_SETTINGS: NotificationSettings = {
  chore_reminders: true,
  chore_completions: true,
  family_updates: true,
  announcements: false,
  reminder_time: '10min',
};

export default function ReminderTimeScreen() {
  const { theme, colors } = useAppTheme();
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
      setError(e instanceof Error ? e.message : 'Unable to load reminder time.');
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
      setError(e instanceof Error ? e.message : 'Could not save reminder time.');
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
          accessibilityLabel="Go back"
          onPress={() => router.navigate('/home/settings' as any)}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={purple} />
        </Pressable>
        <Text style={[styles.title, { color: fg }]}>Reminder Time</Text>
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
        <Text style={[styles.description, { color: muted }]}>
          Choose when to be notified before a chore is due.
        </Text>

        {loading && <ActivityIndicator color={purple} style={{ marginVertical: 12 }} />}

        {/* 4 Selectable Reminder Time Options (Radio Group) */}
        {REMINDER_OPTIONS.map((item) => {
          const isSelected = selectedTime === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.label}
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
              <Text style={[styles.optionLabel, { color: fg }]}>{item.label}</Text>
            </Pressable>
          );
        })}

        {/* Error message if saving failed */}
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* Purple Informational Card at bottom (Not a button) */}
        <View style={[styles.infoCard, { backgroundColor: purple }]}>
          <Text style={styles.infoCardText}>
            Stay on track — reminders follow your selected time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 4,
  },
});
