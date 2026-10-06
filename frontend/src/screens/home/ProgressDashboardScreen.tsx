/**
 * ProgressDashboardScreen.tsx
 * Client side Progress Dashboard matching user design screenshot.
 */
import React, { useCallback, useMemo, useState } from 'react';
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
import Svg, { Circle } from 'react-native-svg';
import { Avatar } from '@/components/profile/Avatar';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { authService, Member } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { choreService, ChoreItem } from '@/services/choreService';
import { notificationService } from '@/services/notificationService';

type TimeRange = 'week' | 'month' | 'all';

// ─── Green Donut Ring Chart Component ─────────────────────────────────────────
function DonutRing({ percentage, size = 140 }: { percentage: number; size?: number }) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E6F7EC"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Filled Green Stroke */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {/* Donut Center Content */}
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#1E1B2E' }}>
          {Math.round(pct)}%
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#8A879A' }}>
          Completed
        </Text>
      </View>
    </View>
  );
}

export default function ProgressDashboardScreen() {
  const [profile, setProfile] = useState<Member | null>(null);
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [showNotifications, setShowNotifications] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const user = await authService.getCurrentMember();
      if (user) setProfile(user);

      try {
        const fresh = await profileService.getProfile();
        setProfile(fresh);
      } catch {
        // Soft fail
      }

      const [resChores, unread] = await Promise.allSettled([
        choreService.getMemberChores(),
        notificationService.getUnreadCount(),
      ]);

      if (resChores.status === 'fulfilled' && resChores.value?.chores) {
        setChores(resChores.value.chores);
      }
      if (unread.status === 'fulfilled') {
        setUnreadCount(unread.value);
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
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter chores by selected time range
  const filteredChores = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (timeRange === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      startOfWeek.setDate(diff);

      return chores.filter((c) => {
        const date = c.completed_at
          ? new Date(c.completed_at)
          : c.due_date
          ? new Date(c.due_date)
          : c.created_at
          ? new Date(c.created_at)
          : null;
        if (!date) return true;
        return date >= startOfWeek && date <= now;
      });
    }

    if (timeRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return chores.filter((c) => {
        const date = c.completed_at
          ? new Date(c.completed_at)
          : c.due_date
          ? new Date(c.due_date)
          : c.created_at
          ? new Date(c.created_at)
          : null;
        if (!date) return true;
        return date >= startOfMonth && date <= now;
      });
    }

    return chores;
  }, [chores, timeRange]);

  // Compute stats dynamically
  const stats = useMemo(() => {
    const total = filteredChores.length;
    let completed = 0;
    let pending = 0;
    let overdue = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredChores.forEach((c) => {
      if (c.status === 'completed') {
        completed++;
      } else if (c.status === 'overdue') {
        overdue++;
      } else {
        if (c.due_date && new Date(c.due_date) < today) {
          overdue++;
        } else {
          pending++;
        }
      }
    });

    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, completionPercentage };
  }, [filteredChores]);

  // Compute active streak (consecutive days with completed chores)
  const streakDays = useMemo(() => {
    const completedDates = chores
      .filter((c) => c.status === 'completed' && (c.completed_at || c.due_date || c.created_at))
      .map((c) => {
        const d = new Date(c.completed_at || c.due_date || c.created_at!);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });

    const uniqueDates = Array.from(new Set(completedDates)).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // If not completed today, check if completed yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak > 0 ? streak : Math.max(1, uniqueDates.length);
  }, [chores]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const firstName = profile?.name ? profile.name.trim().split(' ')[0] : 'Ishini';

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
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          {/* Left Avatar */}
          <Avatar name={profile?.name || 'I'} uri={profile?.avatarUri} size={54} />

          {/* Greeting Text Group */}
          <View style={styles.headerTextGroup}>
            <Text style={styles.greetingSub}>{getGreeting()}</Text>
            <Text style={styles.greetingTitle}>{firstName}! 👋</Text>
            <Text style={styles.greetingCaption}>Here's your progress</Text>
          </View>

          {/* Right Bell Icon */}
          <Pressable
            onPress={() => setShowNotifications(true)}
            style={styles.bellBtn}
          >
            <Ionicons name="notifications-outline" size={24} color="#713DE8" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── 3-Segment Time Range Filter Tab Bar ── */}
        <View style={styles.filterContainer}>
          {(['week', 'month', 'all'] as TimeRange[]).map((tab) => {
            const isSelected = timeRange === tab;
            const labels: Record<TimeRange, string> = {
              week: 'This Week',
              month: 'This Month',
              all: 'All Time',
            };

            return (
              <Pressable
                key={tab}
                onPress={() => setTimeRange(tab)}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextSelected,
                  ]}
                >
                  {labels[tab]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 30 }} />
        ) : (
          <>
            {/* ── Main Progress Donut Card ── */}
            <View style={styles.donutCard}>
              {/* Left Green Ring */}
              <DonutRing percentage={stats.completionPercentage} size={145} />

              {/* Right Breakdowns Column */}
              <View style={styles.breakdownColumn}>
                {/* Completed Row */}
                <View style={styles.breakdownRow}>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  <View style={styles.statGroup}>
                    <Text style={styles.statNum}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                </View>

                {/* Pending Row */}
                <View style={styles.breakdownRow}>
                  <View style={styles.purpleIconCircle}>
                    <Ionicons name="time" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.statGroup}>
                    <Text style={styles.statNum}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                </View>

                {/* Overdue Row */}
                <View style={styles.breakdownRow}>
                  <Ionicons name="alert-circle" size={22} color="#EF4444" />
                  <View style={styles.statGroup}>
                    <Text style={styles.statNum}>{stats.overdue}</Text>
                    <Text style={styles.statLabel}>Overdue</Text>
                  </View>
                </View>

                {/* Total Footnote */}
                <Text style={styles.totalFootnote}>
                  Total: {stats.total} {stats.total === 1 ? 'chore' : 'chores'}
                </Text>
              </View>
            </View>

            {/* ── Streak Card ── */}
            <View style={styles.streakCard}>
              <View style={styles.flameIconWrap}>
                <Text style={{ fontSize: 24 }}>🔥</Text>
              </View>

              <View style={styles.streakTextGroup}>
                <Text style={styles.streakCaption}>Streak</Text>
                <Text style={styles.streakTitle}>{streakDays} Days</Text>
                <Text style={styles.streakSub}>Keep going! 🎉</Text>
              </View>
            </View>

            {/* ── 2x2 Stats Grid ── */}
            <View style={styles.statsGrid}>
              {/* Grid 1: Completed */}
              <View style={styles.gridCard}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
                <View style={styles.gridTextGroup}>
                  <Text style={styles.gridNum}>{stats.completed}</Text>
                  <Text style={styles.gridLabel}>Completed</Text>
                </View>
              </View>

              {/* Grid 2: Pending */}
              <View style={styles.gridCard}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="time" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.gridTextGroup}>
                  <Text style={styles.gridNum}>{stats.pending}</Text>
                  <Text style={styles.gridLabel}>Pending</Text>
                </View>
              </View>

              {/* Grid 3: Overdue */}
              <View style={styles.gridCard}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                </View>
                <View style={styles.gridTextGroup}>
                  <Text style={styles.gridNum}>{stats.overdue}</Text>
                  <Text style={styles.gridLabel}>Overdue</Text>
                </View>
              </View>

              {/* Grid 4: Total */}
              <View style={styles.gridCard}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="list" size={20} color="#2563EB" />
                </View>
                <View style={styles.gridTextGroup}>
                  <Text style={styles.gridNum}>{stats.total}</Text>
                  <Text style={styles.gridLabel}>Total</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Notification Panel Modal */}
      <NotificationPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextGroup: {
    flex: 1,
    gap: 1,
  },
  greetingSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#656276',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.3,
  },
  greetingCaption: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A879A',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // 3-Segment Time Range Filter Tab Bar
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillSelected: {
    backgroundColor: '#713DE8',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#656276',
  },
  filterPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Main Donut Card
  donutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  breakdownColumn: {
    flex: 1,
    marginLeft: 20,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  purpleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statNum: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A879A',
  },
  totalFootnote: {
    fontSize: 13,
    fontWeight: '800',
    color: '#656276',
    marginTop: 4,
  },

  // Streak Card
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  flameIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTextGroup: {
    gap: 2,
  },
  streakCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A879A',
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  streakSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#656276',
  },

  // 2x2 Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTextGroup: {
    gap: 1,
  },
  gridNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A879A',
  },
});
