import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Avatar } from '@/components/profile/Avatar';
import { authService, Member } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { choreService, ChoreItem, ChoreStats } from '@/services/choreService';
import { ChoreItemCard } from '@/components/chores/ChoreItemCard';
import { AddChoreModal } from '@/components/chores/AddChoreModal';

export default function HomeScreen() {
  const alert = useAppAlert();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Member | null>(null);
  const [stats, setStats] = useState<ChoreStats>({
    completed: 0,
    pending: 0,
    overdue: 0,
    total: 0,
    completionPercentage: 0,
  });
  const [chores, setChores] = useState<ChoreItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load user profile
      const currentMember = await authService.getCurrentMember();
      if (currentMember) setProfile(currentMember);

      try {
        const freshProfile = await profileService.getProfile();
        setProfile(freshProfile);
      } catch {
        // Fallback to cached member profile if profile API is offline
      }

      // Load statistics & today's chores from backend API
      const statsRes = await choreService.getStats();
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }
      if (statsRes?.todaysChores) {
        setChores(statsRes.todaysChores);
      }
    } catch (err) {
      // Soft fail or fallback if network unavailable
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleComplete = async (id: string) => {
    try {
      // Optimistic update
      setChores((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: c.status === 'completed' ? 'pending' : 'completed',
              }
            : c
        )
      );

      await choreService.toggleChoreComplete(id);
      // Auto-refresh real dashboard stats from server
      const refreshedStats = await choreService.getStats();
      if (refreshedStats?.stats) setStats(refreshedStats.stats);
      if (refreshedStats?.todaysChores) setChores(refreshedStats.todaysChores);
    } catch (err) {
      alert(t('error'), t('admin_error'));
      loadData();
    }
  };

  const handleDeleteChore = (id: string) => {
    alert(t('ui_delete_chore'), t('ui_are_you_sure_you_want_to_delete_this_chore'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setChores((prev) => prev.filter((c) => c.id !== id));
            await choreService.deleteChore(id);
            const refreshedStats = await choreService.getStats();
            if (refreshedStats?.stats) setStats(refreshedStats.stats);
            if (refreshedStats?.todaysChores) setChores(refreshedStats.todaysChores);
          } catch {
            alert(t('error'), t('admin_error'));
            loadData();
          }
        },
      },
    ]);
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const greetingName = profile?.name ? profile.name.split(' ')[0] : t('ui_housemate');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#713DE8"
            colors={['#713DE8']}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeTag}>{t('ui_welcome_to_chorehub')}</Text>
            <Text style={styles.greetingText}>{t('ui_hello')}{' '}{greetingName}{t('greeting_suffix')}</Text>
          </View>
          <Pressable
            onPress={handleProfilePress}
            style={({ pressed }) => [
              styles.avatarButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel={t('ui_open_profile')}
          >
            <Avatar name={profile?.name || t('ui_user')} uri={profile?.avatarUri} size={48} />
          </Pressable>
        </View>

        {/* Today's Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressCardTitle}>{t('ui_today_s_progress')}</Text>
              <Text style={styles.progressCardSubtitle}>{t('ui_keep_up_the_good_work')}</Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>
                {Math.round(stats.completionPercentage)}%
              </Text>
            </View>
          </View>

          {/* Visual Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, stats.completionPercentage))}%` },
              ]}
            />
          </View>

          {/* Statistics Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.pendingBadge]}>
                <Text style={styles.statIconText}>⏳</Text>
              </View>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>{t('filter_pending')}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.completedBadge]}>
                <Text style={styles.statIconText}>✓</Text>
              </View>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>{t('filter_completed')}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.overdueBadge]}>
                <Text style={styles.statIconText}>!</Text>
              </View>
              <Text style={styles.statNumber}>{stats.overdue}</Text>
              <Text style={styles.statLabel}>{t('status_overdue')}</Text>
            </View>
          </View>
        </View>

        {/* Today's Chores Section */}
        <View style={styles.choresSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('todays_chores')}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{chores.length}</Text>
            </View>
          </View>

          {/* Empty State / Chores List */}
          {chores.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>✨</Text>
              </View>
              <Text style={styles.emptyStateTitle}>{t('ui_no_chores_scheduled_for_today')}</Text>
              <Text style={styles.emptyStateSubtitle}>{t('ui_you_re_all_caught_up_enjoy_your_free_time_or_add_a_new_chore_below_to_keep_your_household_organized')}</Text>
            </View>
          ) : (
            <View style={styles.choresList}>
              {chores.map((item) => (
                <ChoreItemCard
                  key={item.id}
                  chore={item}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteChore}
                />
              ))}
            </View>
          )}

          {/* Add New Chore Button */}
          <Pressable
            onPress={() => setIsAddModalOpen(true)}
            style={({ pressed }) => [
              styles.addChoreButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.addChoreButtonIcon}>+</Text>
            <Text style={styles.addChoreButtonText}>{t('ui_add_new_chore')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Add Chore Modal */}
      <AddChoreModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onChoreCreated={loadData}
      />
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#F8F7FC'),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  buttonPressed: {
    opacity: 0.9,
    backgroundColor: '#5C2ECE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  welcomeTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#713DE8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  avatarButton: {
    borderRadius: 24,
    padding: 2,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  // Progress Card
  progressCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  progressCardSubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#757288'),
    marginTop: 2,
  },
  percentageBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F0EAFF'),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#713DE8',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F0EAFF'),
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#713DE8',
    borderRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pendingBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FFF8E6'),
  },
  completedBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#ECFDF5'),
  },
  overdueBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF2F2'),
  },
  statIconText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#757288'),
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EAE7F5'),
  },

  // Chores Section
  choresSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  countBadge: {
    backgroundColor: '#713DE8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyStateCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    gap: 10,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#F0EAFF'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIcon: {
    fontSize: 26,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#757288'),
    textAlign: 'center',
    lineHeight: 19,
  },
  choresList: {
    gap: 12,
  },
  addChoreButton: {
    backgroundColor: '#713DE8',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  addChoreButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  addChoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
