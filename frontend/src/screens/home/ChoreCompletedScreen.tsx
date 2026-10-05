import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';

export default function ChoreCompletedScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ title?: string; completedAt?: string }>();
  const choreTitle = params.title || t('chores');

  const formatCompletionTime = (isoString?: string) => {
    const d = isoString ? new Date(isoString) : new Date();
    const dateStr = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr}, ${timeStr}`;
  };

  const formattedTimestamp = formatCompletionTime(params.completedAt);

  const handleDone = () => {
    router.replace('/home' as any);
  };

  const handleViewMyChores = () => {
    router.replace('/home/chores' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Celebration Graphic & Confetti */}
        <View style={styles.celebrationGraphicArea}>
          {/* Confetti Elements */}
          <Text style={[styles.confetti, { top: 10, left: 30, color: '#F59E0B' }]}>✨</Text>
          <Text style={[styles.confetti, { top: 25, right: 40, color: '#10B981' }]}>✦</Text>
          <Text style={[styles.confetti, { top: 60, left: 20, color: '#6366F1' }]}>✦</Text>
          <Text style={[styles.confetti, { top: 75, right: 30, color: '#EC4899' }]}>🎉</Text>
          <Text style={[styles.confetti, { bottom: 20, left: 45, color: '#EF4444' }]}>⚡</Text>
          <Text style={[styles.confetti, { bottom: 25, right: 50, color: '#8B5CF6' }]}>✨</Text>

          {/* Central Glossy Checkmark Badge */}
          <View style={styles.checkBadgeOuter}>
            <View style={styles.checkBadgeInner}>
              <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textGroup}>
          <Text style={styles.mainTitle}>{t('chore_completed_title')}</Text>
          <Text style={styles.subText}>
            {t('great_job_completed')}{'\n'}
            <Text style={styles.choreTitleHighlight}>"{choreTitle}"</Text>.
          </Text>
        </View>

        {/* Completion Timestamp Card */}
        <View style={styles.timestampCard}>
          <View style={styles.calendarIconWrap}>
            <Ionicons name="calendar-outline" size={24} color="#713DE8" />
          </View>
          <View style={styles.timestampTextGroup}>
            <Text style={styles.completedOnLabel}>{t('completed_on')}</Text>
            <Text style={styles.timestampValue}>{formattedTimestamp}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable
            onPress={handleDone}
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.doneBtnText}>{t('btn_done')}</Text>
          </Pressable>

          <Pressable
            onPress={handleViewMyChores}
            style={({ pressed }) => [styles.viewChoresBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.viewChoresBtnText}>{t('btn_view_my_chores')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  celebrationGraphicArea: {
    width: 220,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  confetti: {
    position: 'absolute',
    fontSize: 20,
  },
  checkBadgeOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  checkBadgeInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  textGroup: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E1B2E',
    textAlign: 'center',
  },
  subText: {
    fontSize: 15,
    color: '#656276',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  choreTitleHighlight: {
    fontWeight: '800',
    color: '#1E1B2E',
  },
  timestampCard: {
    width: '100%',
    backgroundColor: '#F4F0FF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E9E2FE',
  },
  calendarIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  timestampTextGroup: {
    flex: 1,
    gap: 2,
  },
  completedOnLabel: {
    fontSize: 12,
    color: '#8A879A',
    fontWeight: '600',
  },
  timestampValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  doneBtn: {
    backgroundColor: '#713DE8',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewChoresBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#713DE8',
  },
  viewChoresBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#713DE8',
  },
});
