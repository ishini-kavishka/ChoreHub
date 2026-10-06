import { translateFeedback } from '@/i18n/translations';
import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React, { useCallback, useRef, useState } from 'react';
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
import { settingsService } from '@/services/settingsService';

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

export default function ReminderTimeScreen() {
  const alert = useAppAlert();
  const styles = useThemedStyles(createStyles);
  const { theme, colors } = useAppTheme();
  const { t } = useLanguage();
  const dark = colors.isDark;

  const bg = colors.background;
  const card = colors.card;
  const fg = colors.textPrimary;
  const muted = colors.textSecondary;
  const circleBorder = colors.border;

  const [selectedTime, setSelectedTime] = useState<ReminderTimeKey>('10min');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [error, setError] = useState('');

  const loadSettings = useCallback(async () => {
    if (saveLock.current) return;
    setLoading(true);
    setError('');
    try {
      const fetched = await settingsService.getNotificationSettings(true);
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

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.navigate('/home/settings' as any);
  }, []);

  // Return to the screen that opened Reminder Time, with a direct-link fallback.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigateBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigateBack])
  );

  const handleSelect = (optionKey: ReminderTimeKey) => {
    if (saveLock.current || loading) return;
    setSelectedTime(optionKey);
    setError('');
  };

  const handleSave = async () => {
    if (saveLock.current || loading) return;
    saveLock.current = true;
    setSaving(true);
    setError('');

    try {
      await settingsService.saveNotificationSettings({ reminder_time: selectedTime });
      alert(t('success'), t('settings_saved'));
      navigateBack();
    } catch (e) {
      setError(t('admin_save_error'));
    } finally {
      saveLock.current = false; setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {/* Header with back button to Settings */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('admin_back')}
          onPress={navigateBack}
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
              accessibilityState={{ selected: isSelected, disabled: loading || saving }}
              disabled={loading || saving}
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('ui_stay_on_track_reminders_follow_your_selected_time')}
          accessibilityState={{ disabled: loading || saving, busy: saving }}
          disabled={loading || saving}
          onPress={() => void handleSave()}
          style={[styles.infoCard, { backgroundColor: purple }]}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : (
            <Text style={styles.infoCardText}>{t('ui_stay_on_track_reminders_follow_your_selected_time')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
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
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  body: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 4,
  },
  optionCard: {
    borderRadius: 16,
    paddingVertical: 16,
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
    paddingVertical: 16,
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
