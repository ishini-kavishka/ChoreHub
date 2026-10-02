/**
 * Screen 1 – Progress Dashboard (Home tab)
 * Replaces the old MemberHomeScreen as the primary home screen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { authService, Member } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { progressService, ProgressSummary, MemberProgress, isDemoProgressMode } from '@/services/progressService';
import { notificationService } from '@/services/notificationService';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

// ─── Circular Ring (pure RN – no SVG dependency) ──────────────────────────────
function CircularRing({ percentage, size = 140 }: { percentage: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, percentage));

  // We fake the ring with a bordered View + a solid quarter arc approach
  // using a simple segmented arc via View transforms (compatible without react-native-svg)
  const strokeDashoffset = circumference * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke="#EFEAFF" strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size/2} cy={size/2} r={radius} stroke="#7C5CFC" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </Svg>
      {/* Text inside ring */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#7C5CFC' }}>
          {Math.round(pct)}%
        </Text>
      </View>
    </View>
  );
}

// ─── Animated Member Bar ──────────────────────────────────────────────────────
function MemberBar({ member, index }: { member: MemberProgress; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: member.percentage,
      duration: 800 + index * 150,
      useNativeDriver: false,
    }).start();
  }, [member.percentage, anim, index]);

  const COLORS = ['#7C5CFC', '#22C55E', '#F59E0B', '#EF4444'];
  const color = COLORS[index % COLORS.length];
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.memberRow}>
      <View style={[styles.memberAvatar, { backgroundColor: color + '20' }]}>
        <Text style={[styles.memberInitials, { color }]}>{initials}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.memberLabelRow}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={[styles.memberPct, { color }]}>{member.percentage}%</Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: color,
                width: anim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ProgressDashboardScreen() {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const dark = theme === 'dark';

  const [profile, setProfile] = useState<Member | null>(null);
  const [summary, setSummary] = useState<ProgressSummary>({ total: 0, completed: 0, pending: 0, percentage: 0 });
  const [members, setMembers] = useState<MemberProgress[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [demo, setDemo] = useState(false);

  const load = useCallback(async () => {
    try {
      const currentMember = await authService.getCurrentMember();
      if (currentMember) setProfile(currentMember);
      try {
        const fresh = await profileService.getProfile();
        setProfile(fresh);
      } catch { /* ignore */ }

      const [sumRes, membersRes, unread] = await Promise.allSettled([
        progressService.getSummary(),
        progressService.getMembers(),
        notificationService.getUnreadCount(),
      ]);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (membersRes.status === 'fulfilled') setMembers(membersRes.value);
      setDemo(isDemoProgressMode());
      if (unread.status === 'fulfilled') setUnreadCount(unread.value);
    } catch { /* soft fail */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const bg = dark ? '#14121F' : '#F8F7FC';
  const card = dark ? '#1F1B2E' : '#FFFFFF';
  const textPrimary = dark ? '#FFFFFF' : '#1E1B2E';
  const textSecondary = dark ? '#A09ABD' : '#757288';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7C5CFC" colors={['#7C5CFC']} />
        }
      >
        {demo && <Text accessibilityRole="text" style={styles.demo}>DEMO / OFFLINE — progress values are sample data.</Text>}
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.appTitle, { color: '#7C5CFC' }]}>CH ChoreSync</Text>
            <Text style={[styles.greeting, { color: textPrimary }]}>
              {t('greeting_prefix')} {profile?.name?.split(' ')[0] ?? 'there'} {t('greeting_suffix')}
            </Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('greeting_subtitle')}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/home/notifications')}
            style={styles.bellBtn}
            accessibilityLabel="Open notifications"
          >
            <Ionicons name="notifications-outline" size={24} color="#7C5CFC" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push('/home/settings')} style={styles.bellBtn} accessibilityRole="button" accessibilityLabel="Open settings">
            <Ionicons name="settings-outline" size={23} color="#7C5CFC" />
          </Pressable>
        </View>

        {/* ── Overall Completion Card ── */}
        <View style={[styles.card, { backgroundColor: card }]}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>{t('overall_completion')}</Text>
          <View style={styles.ringRow}>
            <CircularRing percentage={summary.percentage} size={130} />
            <View style={styles.ringInfo}>
              <Text style={[styles.bigCount, { color: textPrimary }]}>
                {summary.completed} / {summary.total}
              </Text>
              <Text style={[styles.ringCaption, { color: textSecondary }]}>{t('chores_completed_week')}</Text>
            </View>
          </View>
          {/* Tiles */}
          <View style={styles.tilesRow}>
            <View style={[styles.tile, { backgroundColor: '#E6F7EC' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
              <Text style={[styles.tileNum, { color: '#22C55E' }]}>{summary.completed}</Text>
              <Text style={styles.tileLabel}>{t('completed_chores')}</Text>
            </View>
            <View style={[styles.tile, { backgroundColor: '#FDECEC' }]}>
              <Ionicons name="time" size={22} color="#EF4444" />
              <Text style={[styles.tileNum, { color: '#EF4444' }]}>{summary.pending}</Text>
              <Text style={styles.tileLabel}>{t('pending_chores')}</Text>
            </View>
          </View>
        </View>

        {/* ── Member Progress ── */}
        <View style={[styles.card, { backgroundColor: card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>{t('progress_by_member')}</Text>
            <Pressable onPress={() => router.push('/home/completed-chores')} style={styles.historyPill}>
              <Text style={styles.historyPillText}>{t('all_history')}</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color="#7C5CFC" style={{ marginTop: 12 }} />
          ) : members.length === 0 ? (
            <Text style={[styles.emptyText, { color: textSecondary }]}>No member data yet</Text>
          ) : (
            members.map((m, i) => <MemberBar key={m.id} member={m} index={i} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  appTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  greeting: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  bellBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  card: { borderRadius: 20, padding: 20, gap: 16, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringInfo: { flex: 1, gap: 6 },
  bigCount: { fontSize: 32, fontWeight: '800' },
  ringCaption: { fontSize: 13 },
  tilesRow: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  tileNum: { fontSize: 22, fontWeight: '800' },
  tileLabel: { fontSize: 12, color: '#555', fontWeight: '600', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyPill: { backgroundColor: '#EFEAFF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  historyPillText: { color: '#7C5CFC', fontWeight: '700', fontSize: 13 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 14, fontWeight: '800' },
  memberLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1E1B2E' },
  memberPct: { fontSize: 14, fontWeight: '700' },
  barTrack: { height: 8, backgroundColor: '#F0EAFF', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  emptyText: { textAlign: 'center', marginTop: 8 },
  demo: { color: '#705400', backgroundColor: '#FFF3CD', padding: 9, borderRadius: 9, fontWeight: '700' },
});
