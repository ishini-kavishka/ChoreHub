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
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { authService, Member } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { choreService, ChoreItem, ChoreStats } from '@/services/choreService';
import { notificationService } from '@/services/notificationService';

export default function MemberHomeScreen() {
  const { colors } = useAppTheme();
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

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
        // Fallback
      }

      const memberRes = await choreService.getMemberChores();
      if (memberRes?.stats) {
        setStats(memberRes.stats);
      }
      if (memberRes?.chores) {
        setChores(memberRes.chores);
      }

      try {
        const unreadCount = await notificationService.getUnreadCount();
        setUnreadNotifsCount(unreadCount);
      } catch {
        // Fallback
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
      Alert.alert('Error', 'Could not update chore status.');
      loadData();
    }
  };

  const handleChoreClick = (chore: ChoreItem) => {
    router.push({
      pathname: '/home/chore-details',
      params: { id: chore.id, choreData: JSON.stringify(chore) },
    } as any);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning');
    if (hour < 18) return t('greeting_afternoon');
    return t('greeting_evening');
  };

  const firstName = profile?.name ? profile.name.trim().split(' ')[0] : t('role_member');
  const initial = firstName.charAt(0).toUpperCase();
  const completionPct = Math.round(stats.completionPercentage ?? 0);

  const getCategoryIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('garden') || cat.includes('plant') || cat.includes('yard')) {
      return { icon: 'leaf-outline' as const, bg: '#DCFCE7', color: '#16A34A' };
    }
    if (cat.includes('living') || cat.includes('mop') || cat.includes('floor') || cat.includes('clean')) {
      return { icon: 'construct-outline' as const, bg: '#DBEAFE', color: '#2563EB' };
    }
    if (cat.includes('bath') || cat.includes('trash') || cat.includes('wash')) {
      return { icon: 'trash-outline' as const, bg: '#FEE2E2', color: '#DC2626' };
    }
    return { icon: 'checkbox-outline' as const, bg: '#EDE9FE', color: '#713DE8' };
  };

  const formatDueTime = (dateString?: string | null) => {
    if (!dateString) return `${t('filter_today')}, 10:00 AM`;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return `${t('filter_today')}, 10:00 AM`;
    return `${t('filter_today')}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  const QUICK_ACTIONS = [
    {
      id: 'chores',
      label: t('quick_view_chores'),
      icon: 'clipboard-outline' as const,
      color: '#713DE8',
      onPress: () => router.push('/home/chores' as any),
    },
    {
      id: 'calendar',
      label: t('quick_view_calendar'),
      icon: 'calendar-outline' as const,
      color: '#EC4899',
      onPress: () => router.push('/home/calendar' as any),
    },
    {
      id: 'family',
      label: t('quick_family_members'),
      icon: 'people-outline' as const,
      color: '#2563EB',
      onPress: () => router.push('/home/family' as any),
    },
    {
      id: 'progress',
      label: t('quick_my_progress'),
      icon: 'bar-chart-outline' as const,
      color: '#713DE8',
      onPress: () => router.push('/home/progress' as any),
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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

          {/* Right Header Controls */}
          <View style={styles.headerRight}>
            {/* Notification Bell */}
            <Pressable
              style={({ pressed }) => [
                styles.bellBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setShowNotifications(true)}
              accessibilityLabel="Open notifications"
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
              {unreadNotifsCount > 0 ? (
                <View style={styles.bellBadgeDot}>
                  <Text style={styles.bellBadgeText}>
                    {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                  </Text>
                </View>
              ) : (
                <View style={styles.bellBadgeDot} />
              )}
            </Pressable>

            {/* Avatar Badge */}
            <Pressable
              onPress={() => router.push('/home/profile' as any)}
              style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.8 }]}
            >
              <Avatar name={profile?.name || 'N'} uri={profile?.avatarUri} size={42} />
            </Pressable>
          </View>
        </View>

          {/* ── Greeting Banner Section ── */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingTextGroup}>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>{getGreeting()} 👋</Text>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>{firstName}!</Text>
            <Text style={[styles.greetingCaption, { color: colors.textSecondary }]}>
              {t('make_today_productive')}
            </Text>
          </View>

          {/* Right Illustration Badge */}
          <View style={styles.illustrationWrap}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechBubbleText}>{t('small_steps_big_change')}</Text>
            </View>
            <View style={styles.avatarGraphicCircle}>
              <Text style={styles.graphicEmoji}>👩‍🌾</Text>
            </View>
          </View>
        </View>

        {/* ── My Progress Purple Gradient Card ── */}
        <View style={styles.progressCard}>
          {/* Card Header */}
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressCardTitle}>{t('my_progress')}</Text>
          <Pressable onPress={() => router.push('/home/progress' as any)} style={styles.viewLinkRow}>
              <Text style={styles.viewLinkText}>{t('view')}</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Gauge & Subtitle Row */}
          <View style={styles.gaugeRow}>
            {/* Circular Gauge */}
            <View style={styles.gaugeContainer}>
              <View style={styles.gaugeOuterRing}>
                <View style={styles.crownBadge}>
                  <Text style={styles.crownEmoji}>👑</Text>
                </View>
                <View style={styles.gaugeInnerCircle}>
                  <Text style={styles.gaugePercentText}>{completionPct}%</Text>
                </View>
              </View>
            </View>

            {/* Progress Text & Icon */}
            <View style={styles.gaugeRightCol}>
              <Text style={styles.gaugeMessage}>
                {stats.completed} / {stats.total} {t('chores_completed_this_week')}
              </Text>
              <View style={styles.chartIconBadge}>
                <Ionicons name="bar-chart" size={20} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Bottom 3 Stat Cards inside container */}
          <View style={styles.innerStatsRow}>
            {/* Completed */}
            <View style={[styles.innerStatCard, { backgroundColor: colors.card }]}>
              <View style={[styles.innerStatIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark" size={16} color="#16A34A" />
              </View>
              <Text style={[styles.innerStatNum, { color: colors.textPrimary }]}>{stats.completed}</Text>
              <Text style={styles.innerStatLabel}>{t('status_completed')}</Text>
            </View>

            {/* Pending */}
            <View style={[styles.innerStatCard, { backgroundColor: colors.card }]}>
              <View style={[styles.innerStatIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={16} color="#D97706" />
              </View>
              <Text style={[styles.innerStatNum, { color: colors.textPrimary }]}>{stats.pending}</Text>
              <Text style={styles.innerStatLabel}>{t('status_pending')}</Text>
            </View>

            {/* Overdue */}
            <View style={[styles.innerStatCard, { backgroundColor: colors.card }]}>
              <View style={[styles.innerStatIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert" size={16} color="#DC2626" />
              </View>
              <Text style={[styles.innerStatNum, { color: colors.textPrimary }]}>{stats.overdue}</Text>
              <Text style={styles.innerStatLabel}>{t('status_overdue')}</Text>
            </View>
          </View>
        </View>

        {/* ── Today's Chores Section ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>{t('todays_chores')}</Text>
            <Pressable
              onPress={() => router.push('/home/chores' as any)}
              style={styles.viewAllRow}
            >
              <Text style={styles.viewAllText}>{t('view_all')}</Text>
              <Ionicons name="chevron-forward" size={14} color="#713DE8" />
            </Pressable>
          </View>

          {chores.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>{t('all_caught_up')}</Text>
              <Text style={styles.emptySub}>{t('no_pending_chores_today')}</Text>
            </View>
          ) : (
            <View style={styles.choresList}>
              {chores.slice(0, 3).map((item) => {
                const catStyle = getCategoryIcon(item.category);
                const isDone = item.status === 'completed';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleChoreClick(item)}
                    style={({ pressed }) => [
                      styles.choreCard,
                      pressed && styles.choreCardPressed,
                    ]}
                  >
                    {/* Category Icon */}
                    <View
                      style={[
                        styles.choreIconBadge,
                        { backgroundColor: catStyle.bg },
                      ]}
                    >
                      <Ionicons name={catStyle.icon} size={22} color={catStyle.color} />
                    </View>

                    {/* Middle Info */}
                    <View style={styles.choreMetaGroup}>
                      <Text style={styles.choreTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.category ? (
                        <Text style={styles.choreCategory}>{item.category}</Text>
                      ) : null}
                      <View style={styles.dueTimeRow}>
                        <Ionicons name="calendar-outline" size={13} color="#8A879A" />
                        <Text style={styles.dueTimeText}>
                          {formatDueTime(item.due_date)}
                        </Text>
                      </View>
                    </View>

                    {/* Right Badge & Arrow */}
                    <View style={styles.choreRightCol}>
                      {item.status === 'pending' ? (
                        <View style={styles.pendingPill}>
                          <Text style={styles.pendingPillText}>{t('status_pending')}</Text>
                        </View>
                      ) : item.priority === 'high' ? (
                        <View style={styles.highPriorityPill}>
                          <Text style={styles.highPriorityText}>{t('priority_high')}</Text>
                        </View>
                      ) : (
                        <View style={styles.mediumPriorityPill}>
                          <Text style={styles.mediumPriorityText}>{t('priority_medium')}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={16} color="#C4C1D4" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Quick Actions Section ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>{t('quick_actions')}</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.quickCard,
                  pressed && styles.quickCardPressed,
                ]}
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Recent Notifications Section ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>{t('recent_notifications')}</Text>
            <Pressable onPress={() => router.push('/home/notifications' as any)} style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>{t('view_all')}</Text>
              <Ionicons name="chevron-forward" size={14} color="#713DE8" />
            </Pressable>
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notifLeftBorder} />
            <View style={styles.notifIconWrap}>
              <Ionicons name="notifications" size={20} color="#EF4444" />
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifTitleRow}>
                <Text style={styles.notifTitle}>{t('chore_due_today')}</Text>
                <Text style={styles.notifTime}>2h</Text>
              </View>
              <Text style={styles.notifSub}>
                {chores[0]?.title
                  ? `${chores[0].title} ${t('due_today_at')} 10:00 AM.`
                  : `Water plants ${t('due_today_at')} 10:00 AM.`}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Notification Panel Modal */}
      <NotificationPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadCountChange={setUnreadNotifsCount}
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
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
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
    flex: 1,
    gap: 2,
  },
  greetingSub: {
    fontSize: 15,
    fontWeight: '700',
    color: '#656276',
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.5,
  },
  greetingCaption: {
    fontSize: 13,
    color: '#8A879A',
    fontWeight: '500',
    marginTop: 2,
  },
  illustrationWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  speechBubble: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderBottomRightRadius: 2,
  },
  speechBubbleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#713DE8',
    textAlign: 'center',
  },
  avatarGraphicCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphicEmoji: {
    fontSize: 28,
  },

  // ── My Progress Purple Card ──
  progressCard: {
    backgroundColor: '#6D28D9',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeOuterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 7,
    borderColor: '#A78BFA',
    borderTopColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crownBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
  },
  crownEmoji: {
    fontSize: 14,
  },
  gaugeInnerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gaugeRightCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gaugeMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  chartIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerStatsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  innerStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  innerStatIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  innerStatNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  innerStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757288',
  },

  // ── Section Styles ──
  sectionContainer: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#713DE8',
  },

  // ── Today's Chores ──
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 6,
  },
  emptyIcon: { fontSize: 28 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B2E' },
  emptySub: { fontSize: 13, color: '#8A879A' },

  choresList: {
    gap: 10,
  },
  choreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  choreCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  choreIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choreMetaGroup: {
    flex: 1,
    gap: 2,
  },
  choreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  choreCategory: {
    fontSize: 12,
    color: '#8A879A',
    fontWeight: '500',
  },
  dueTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dueTimeText: {
    fontSize: 11,
    color: '#8A879A',
    fontWeight: '600',
  },
  choreRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  mediumPriorityPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mediumPriorityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#713DE8',
  },
  highPriorityPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  highPriorityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },

  // ── Quick Actions ──
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F4F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E1B2E',
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Recent Notifications ──
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notifLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#F97316',
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  notifTime: {
    fontSize: 11,
    color: '#8A879A',
    fontWeight: '600',
  },
  notifSub: {
    fontSize: 12,
    color: '#656276',
    lineHeight: 16,
  },
});
