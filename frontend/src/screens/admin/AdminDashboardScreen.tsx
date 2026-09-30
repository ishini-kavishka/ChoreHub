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
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/profile/Avatar';
import { authService, Member } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { choreService, ChoreItem, ChoreStats } from '@/services/choreService';
import { AddChoreModal } from '@/components/chores/AddChoreModal';
import { EditChoreModal } from '@/components/chores/EditChoreModal';

export default function AdminDashboardScreen() {
  const [profile, setProfile] = useState<Member | null>(null);
  const [stats, setStats] = useState<ChoreStats>({
    completed: 0,
    pending: 0,
    overdue: 0,
    total: 0,
    completionPercentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEditChore, setSelectedEditChore] = useState<ChoreItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const currentMember = await authService.getCurrentMember();
      if (currentMember) setProfile(currentMember);

      try {
        const freshProfile = await profileService.getProfile();
        setProfile(freshProfile);
      } catch {
        // Fallback to cached profile
      }

      const adminData = await choreService.getAdminStats();
      if (adminData?.stats) setStats(adminData.stats);
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

  const greetingName = profile?.name ? profile.name.split(' ')[0] : 'Admin';
  const completionPct = Math.round(stats.completionPercentage ?? 0);

  const QUICK_ACTIONS = [
    {
      id: 'chores',
      label: 'Manage Chores',
      icon: 'list-outline' as const,
      onPress: () => router.push('/admin/chores' as any),
    },
    {
      id: 'family',
      label: 'Manage Family',
      icon: 'people-outline' as const,
      onPress: () => router.push('/admin/members' as any),
    },
    {
      id: 'calendar',
      label: 'View Calendar',
      icon: 'calendar-outline' as const,
      onPress: () => {},
    },
    {
      id: 'support',
      label: 'Support & Help',
      icon: 'headset-outline' as const,
      onPress: () => router.push('/support?role=admin' as any),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#713DE8" />
        </View>
      </SafeAreaView>
    );
  }

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
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
            <Text style={styles.greetingText}>
              Hello, {greetingName}! 👋
            </Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#713DE8" />
              <Text style={styles.roleBadgeText}>Admin Dashboard</Text>
            </View>
          </View>

          <Pressable onPress={() => router.push('/admin/profile' as any)}>
            <Avatar
              name={profile?.name ?? 'A'}
              uri={profile?.avatarUri ?? undefined}
              size={48}
            />
          </Pressable>
        </View>

        {/* ── Household Progress Card ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardTop}>
            <View>
              <Text style={styles.progressCardTitle}>Household Progress</Text>
              <Text style={styles.progressCardSubtitle}>Overall completion</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{completionPct}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(completionPct, 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="list-outline" size={22} color="#713DE8" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Chores</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color="#F59E0B" />
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.quickActionCard,
                pressed && styles.quickActionCardPressed,
              ]}
            >
              <View style={styles.quickActionIconWrap}>
                <Ionicons name={action.icon} size={28} color="#713DE8" />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Add / Edit Modals (retained for backward compatibility) */}
      <AddChoreModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onChoreCreated={loadData}
      />
      <EditChoreModal
        visible={!!selectedEditChore}
        chore={selectedEditChore}
        onClose={() => setSelectedEditChore(null)}
        onChoreUpdated={loadData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4FF',
  },
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    gap: 4,
  },
  welcomeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#713DE8',
    letterSpacing: 1.2,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#713DE8',
  },

  // ── Progress Card ──
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  progressCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  progressCardSubtitle: {
    fontSize: 12,
    color: '#8A879A',
    fontWeight: '500',
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  percentText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#713DE8',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#713DE8',
    borderRadius: 10,
  },

  // ── Stats Row ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#713DE8',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A879A',
    textAlign: 'center',
    lineHeight: 15,
  },

  // ── Quick Actions ──
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  quickActionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B2E',
    textAlign: 'center',
  },
});
