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
import { MemberChoreCard } from '@/components/chores/MemberChoreCard';

export default function MemberHomeScreen() {
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

  const loadData = useCallback(async () => {
    try {
      const currentMember = await authService.getCurrentMember();
      if (currentMember) setProfile(currentMember);

      try {
        const freshProfile = await profileService.getProfile();
        setProfile(freshProfile);
      } catch {
        // Fallback to cached profile if profile API fails
      }

      // Fetch member's personal assigned chores and personal stats
      const memberRes = await choreService.getMemberChores();
      if (memberRes?.stats) {
        setStats(memberRes.stats);
      }
      if (memberRes?.chores) {
        setChores(memberRes.chores);
      }
    } catch {
      // Soft fail
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
      const refreshed = await choreService.getMemberChores();
      if (refreshed?.stats) setStats(refreshed.stats);
      if (refreshed?.chores) setChores(refreshed.chores);
    } catch {
      Alert.alert('Error', 'Could not update chore status. Please try again.');
      loadData();
    }
  };

  const handleProfilePress = () => {
    router.push('/home/profile');
  };

  const handleViewAllPress = () => {
    router.push('/home/chores');
  };

  const greetingName = profile?.name ? profile.name.split(' ')[0] : 'Member';

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
            <Text style={styles.welcomeTag}>WELCOME TO CHOREHUB</Text>
            <Text style={styles.greetingText}>Hello, {greetingName} 👋</Text>
          </View>
          <Pressable
            onPress={handleProfilePress}
            style={({ pressed }) => [
              styles.avatarButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Open profile"
          >
            <Avatar name={profile?.name || 'User'} uri={profile?.avatarUri} size={48} />
          </Pressable>
        </View>

        {/* My Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressCardTitle}>My Progress</Text>
              <Text style={styles.progressCardSubtitle}>
                Keep up the great work!
              </Text>
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
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.completedBadge]}>
                <Text style={styles.statIconText}>✓</Text>
              </View>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.overdueBadge]}>
                <Text style={styles.statIconText}>!</Text>
              </View>
              <Text style={styles.statNumber}>{stats.overdue}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        {/* My Chores Section */}
        <View style={styles.choresSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>My Chores</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{chores.length}</Text>
              </View>
            </View>
            {chores.length > 0 ? (
              <Pressable onPress={handleViewAllPress} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All ›</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Empty State / Assigned Chores List */}
          {loading ? (
            <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 20 }} />
          ) : chores.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>✨</Text>
              </View>
              <Text style={styles.emptyStateTitle}>No chores assigned yet!</Text>
              <Text style={styles.emptyStateSubtitle}>
                You have no pending chores assigned to you right now. Enjoy your free time!
              </Text>
            </View>
          ) : (
            <View style={styles.choresList}>
              {chores.slice(0, 5).map((item) => (
                <MemberChoreCard
                  key={item.id}
                  chore={item}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FC',
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
    color: '#1E1B2E',
  },
  avatarButton: {
    borderRadius: 24,
    padding: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#EAE7F5',
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
    color: '#1E1B2E',
  },
  progressCardSubtitle: {
    fontSize: 13,
    color: '#757288',
    marginTop: 2,
  },
  percentageBadge: {
    backgroundColor: '#F0EAFF',
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
    backgroundColor: '#F0EAFF',
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
    borderTopColor: '#F4F2FA',
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
  pendingBadge: { backgroundColor: '#FFF8E6' },
  completedBadge: { backgroundColor: '#ECFDF5' },
  overdueBadge: { backgroundColor: '#FEF2F2' },
  statIconText: { fontSize: 14, fontWeight: '800' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#1E1B2E' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#757288' },
  statDivider: { width: 1, height: 36, backgroundColor: '#EAE7F5' },
  choresSection: { gap: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B2E',
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
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    color: '#713DE8',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 10,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIcon: { fontSize: 26 },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#757288',
    textAlign: 'center',
    lineHeight: 19,
  },
  choresList: { gap: 12 },
});
