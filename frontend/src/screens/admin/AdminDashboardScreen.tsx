import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { choreService, ChoreStats } from '@/services/choreService';
import { AddChoreModal } from '@/components/chores/AddChoreModal';

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
  const initial = greetingName.charAt(0).toUpperCase();
  const completionPct = Math.round(stats.completionPercentage ?? 0);

  const QUICK_ACTIONS = [
    {
      id: 'users',
      title: 'Manage Users',
      subtitle: 'View, activate or\ndeactivate users',
      icon: 'people' as const,
      color: '#713DE8',
      bgTint: '#F5F3FF',
      btnBg: '#EDE9FE',
      onPress: () => router.push('/admin/members' as any),
    },
    {
      id: 'chores',
      title: 'Manage Chores',
      subtitle: 'Create, edit and\nassign chores',
      icon: 'list' as const,
      color: '#F59E0B',
      bgTint: '#FFFBEB',
      btnBg: '#FEF3C7',
      onPress: () => router.push('/admin/chores' as any),
    },
    {
      id: 'family',
      title: 'Manage Family',
      subtitle: 'View and manage\nfamily members',
      icon: 'people' as const,
      color: '#10B981',
      bgTint: '#ECFDF5',
      btnBg: '#D1FAE5',
      onPress: () => router.push('/admin/members' as any),
    },
    {
      id: 'progress',
      title: 'View Progress',
      subtitle: 'Check detailed\nprogress and reports',
      icon: 'bar-chart' as const,
      color: '#2563EB',
      bgTint: '#EFF6FF',
      btnBg: '#DBEAFE',
      onPress: () => {},
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
        {/* ── Top Header Bar ── */}
        <View style={styles.topHeader}>
          {/* ChoreHub Logo */}
          <View style={styles.logoRow}>
            <Text style={styles.logoChore}>Chore</Text>
            <Text style={styles.logoHub}>Hub</Text>
          </View>

          {/* Header Controls */}
          <View style={styles.headerRight}>
            <Pressable
              style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {}}
            >
              <Ionicons name="notifications-outline" size={24} color="#1E1B2E" />
              <View style={styles.bellBadgeDot} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/admin/profile' as any)}
              style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.8 }]}
            >
              <Avatar name={profile?.name || 'A'} uri={profile?.avatarUri} size={42} />
            </Pressable>
          </View>
        </View>

        {/* ── Greeting Banner Section ── */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingTextGroup}>
            <Text style={styles.greetingTitle}>Hello, {greetingName}! 👋</Text>
            <View style={styles.roleBadgePill}>
              <Ionicons name="shield-checkmark-sharp" size={14} color="#713DE8" />
              <Text style={styles.roleBadgeText}>Admin Dashboard</Text>
            </View>
          </View>

          {/* Right Character / Graphic Badge */}
          <View style={styles.graphicWrap}>
            <View style={styles.speechBubbleChart}>
              <Ionicons name="bar-chart-sharp" size={16} color="#713DE8" />
            </View>
            <View style={styles.characterCircle}>
              <Text style={styles.characterEmoji}>👩‍💼</Text>
            </View>
          </View>
        </View>

        {/* ── Household Progress Card ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardTopRow}>
            <View style={styles.progressTextGroup}>
              <Text style={styles.progressCardTitle}>Household Progress</Text>
              <Text style={styles.progressCardSubtitle}>
                Overall completion of assigned chores
              </Text>
            </View>

            {/* Circular Gauge */}
            <View style={styles.ringGaugeContainer}>
              <View style={styles.ringGaugeOuter}>
                <Text style={styles.ringGaugePercentText}>{completionPct}%</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(completionPct, 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* ── 4 Stat Cards Row ── */}
        <View style={styles.statsRow}>
          {/* Total Chores */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="list" size={18} color="#713DE8" />
            </View>
            <Text style={[styles.statNumber, { color: '#713DE8' }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Chores</Text>
          </View>

          {/* Pending */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={18} color="#D97706" />
            </View>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          {/* Completed */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            </View>
            <Text style={[styles.statNumber, { color: '#16A34A' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          {/* Overdue */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
            </View>
            <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {/* ── Quick Actions Grid ── */}
        <View style={styles.quickSectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>

          <View style={styles.quickGrid2x2}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.quickActionCard,
                  { backgroundColor: action.bgTint },
                  pressed && styles.quickActionPressed,
                ]}
              >
                <View
                  style={[
                    styles.quickActionIconWrap,
                    { backgroundColor: action.color },
                  ]}
                >
                  <Ionicons name={action.icon} size={24} color="#FFFFFF" />
                </View>

                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSub}>{action.subtitle}</Text>

                {/* Bottom Right Arrow Button */}
                <View style={styles.arrowRow}>
                  <View style={[styles.arrowCircle, { backgroundColor: action.color }]}>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 20,
  },

  // ── Top Header Bar ──
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoChore: {
    fontSize: 26,
    fontWeight: '900',
    color: '#713DE8',
    letterSpacing: -0.5,
  },
  logoHub: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FF9F1C',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  avatarWrap: {
    borderRadius: 21,
  },

  // ── Greeting Banner ──
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  greetingTextGroup: {
    gap: 6,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.5,
  },
  roleBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0EAFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#713DE8',
  },
  graphicWrap: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  speechBubbleChart: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  characterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterEmoji: {
    fontSize: 34,
  },

  // ── Household Progress Card ──
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  progressCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTextGroup: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  progressCardSubtitle: {
    fontSize: 13,
    color: '#8A879A',
    fontWeight: '500',
  },
  ringGaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGaugeOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: '#EDE9FE',
    borderTopColor: '#713DE8',
    borderRightColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGaugePercentText: {
    fontSize: 16,
    fontWeight: '900',
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

  // ── 4 Stat Cards Row ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A879A',
    textAlign: 'center',
  },

  // ── Quick Actions Grid ──
  quickSectionContainer: {
    gap: 14,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  quickGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  quickActionCard: {
    width: '47.5%',
    borderRadius: 22,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    position: 'relative',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  quickActionSub: {
    fontSize: 12,
    color: '#8A879A',
    lineHeight: 16,
    fontWeight: '500',
  },
  arrowRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
