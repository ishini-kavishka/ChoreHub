import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
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
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { NotificationBell, refreshMemberUnread } from '@/components/notifications/NotificationBell';
import { choreService, ChoreItem } from '@/services/choreService';
import { useLanguage } from '@/context/LanguageContext';

type TimeRange = 'week' | 'month' | 'all';

export default function ProgressDashboardScreen() {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await choreService.getMemberChores();
      setChores(response.chores ?? []);
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
    void refreshMemberUnread(true);
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

  // Categories and daily completion counts use the same authenticated chore data.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    filteredChores.forEach(chore => {
      const name = chore.category?.trim() || t('category_general');
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [filteredChores, t]);
  const weekly = useMemo(() => {
    const monday = new Date(); monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date(monday); start.setDate(start.getDate() + index);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      return chores.filter(chore => {
        if (chore.status !== 'completed' || !chore.completed_at) return false;
        const date = new Date(chore.completed_at);
        return date >= start && date < end;
      }).length;
    });
  }, [chores]);
  const chartColors = [themeColors.primary, '#9B79EE', '#FFBB55', '#4CCDA5', '#FF929F', '#6FA9F8'];
  const radius = 49, circumference = 2 * Math.PI * radius;
  let categoryOffset = 0;
  const chartMax = Math.max(1, ...weekly);
  const points = weekly.map((count, index) => `${24 + index * 42},${96 - count / chartMax * 76}`).join(' ');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} colors={[themeColors.primary]}/> }>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('admin_back')} style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}>
            <Ionicons name="arrow-back" size={22} color={themeColors.primary}/>
          </Pressable>
          <Text style={styles.title}>{t('my_progress')}</Text>
          <NotificationBell returnTo="/home/progress"/>
        </View>
        <View style={styles.filterContainer}>
          {(['week', 'month', 'all'] as TimeRange[]).map(tab => <Pressable key={tab} accessibilityRole="button" accessibilityState={{ selected: timeRange === tab }}
            onPress={() => setTimeRange(tab)} style={[styles.filterPill, timeRange === tab && styles.filterSelected]}>
            <Text style={[styles.filterText, timeRange === tab && styles.selectedText]}>{t({ week: 'this_week', month: 'this_month', all: 'all_time' }[tab])}</Text>
          </Pressable>)}
        </View>
        {loading ? <ActivityIndicator color={themeColors.primary}/> : <>
          <View style={styles.card}>
            <View style={styles.cardHeading}><Text style={styles.sectionTitle}>{t('overall_completion')}</Text><Text style={styles.percent}>{stats.completionPercentage}%</Text></View>
            <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: stats.completionPercentage }} style={styles.track}>
              <View style={[styles.fill, { width: `${stats.completionPercentage}%` }]}/>
            </View>
            <View style={styles.statsRow}>
              {[{ value: stats.total, label: t('total_chores_count'), color: themeColors.textPrimary }, { value: stats.completed, label: t('status_completed'), color: '#16B879' }, { value: stats.pending, label: t('status_pending'), color: '#F25968' }].map(item =>
                <View key={item.label} style={styles.stat}><Text style={[styles.statNumber, { color: item.color }]}>{item.value}</Text><Text style={styles.caption}>{item.label}</Text></View>)}
            </View>
            {stats.overdue > 0 && <Text style={styles.caption}>{t('status_overdue')}: {stats.overdue}</Text>}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('client_category_completion')}</Text>
            <View style={styles.categoryRow}>
              <View style={styles.donut} accessibilityLabel={t('total_chores_count') + ': ' + stats.total}>
                <Svg width={120} height={120} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx={60} cy={60} r={radius} fill="none" stroke={themeColors.surface} strokeWidth={20}/>
                  {categories.map((item, index) => {
                    const length = stats.total ? item.count / stats.total * circumference : 0;
                    const offset = categoryOffset; categoryOffset += length;
                    return <Circle key={item.name} cx={60} cy={60} r={radius} fill="none" stroke={chartColors[index % chartColors.length]} strokeWidth={20}
                      strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset}/>;
                  })}
                </Svg>
                <Text style={styles.donutNumber}>{stats.total}</Text><Text style={styles.caption}>{t('total_chores_count')}</Text>
              </View>
              <View style={styles.legend}>
                {categories.length ? categories.map((item, index) => <View key={item.name} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: chartColors[index % chartColors.length] }]}/>
                  <Text style={styles.legendName}>{item.name}</Text><Text style={styles.legendCount}>{item.count}</Text>
                </View>) : <Text style={styles.caption}>{t('no_chores_on_date')}</Text>}
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('client_weekly_progress')}</Text>
            <View accessibilityLabel={t('client_weekly_progress')}>
              <Svg width="100%" height={130} viewBox="0 0 300 120" preserveAspectRatio="none">
                {[0, .5, 1].map(value => <Line key={value} x1={24} x2={276} y1={96 - value * 76} y2={96 - value * 76} stroke={themeColors.border} strokeWidth={.5}/>)}
                <Polyline points={points} fill="none" stroke={themeColors.primary} strokeWidth={3} strokeLinejoin="round"/>
                {weekly.map((count, index) => <Circle key={index} cx={24 + index * 42} cy={96 - count / chartMax * 76} r={3} fill={themeColors.primary}/>)}
              </Svg>
              <View style={styles.days}>{['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day, index) => <View key={day} style={styles.day}><Text style={styles.caption}>{t(day)}</Text><Text style={styles.dailyCount}>{weekly[index]}</Text></View>)}</View>
            </View>
            <Text style={styles.caption}>{t('streak')}: {streakDays} {t('days')} ? {t('keep_going')}</Text>
          </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.isDark ? colors.background : '#FAFAFD' },
  scrollContent: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 16, paddingBottom: 32, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  backButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 4 },
  badgeText: { fontSize: 10, color: '#fff' },
  filterContainer: { flexDirection: 'row', backgroundColor: colors.surface, padding: 4, borderRadius: 12, gap: 4 },
  filterPill: { flex: 1, minHeight: 44, padding: 6, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  filterSelected: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: .2, shadowRadius: 4, elevation: 2 },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  selectedText: { color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: colors.border, shadowColor: colors.primary, shadowOpacity: .04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { flexShrink: 1, fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  percent: { color: colors.primary, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: '800', fontSize: 16 },
  track: { height: 9, borderRadius: 5, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  statsRow: { flexDirection: 'row', paddingVertical: 2 },
  stat: { flex: 1, alignItems: 'center', gap: 5 },
  statNumber: { fontSize: 23, fontWeight: '800' },
  caption: { color: colors.textSecondary, fontSize: 11, textAlign: 'center' },
  section: { gap: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donut: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  donutNumber: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  legend: { flex: 1, minWidth: 0, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 2 },
  legendName: { flex: 1, flexShrink: 1, fontSize: 12, color: colors.textSecondary },
  legendCount: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  days: { flexDirection: 'row' },
  day: { flex: 1, gap: 4 },
  dailyCount: { fontSize: 10, color: colors.primary, textAlign: 'center' },
});
