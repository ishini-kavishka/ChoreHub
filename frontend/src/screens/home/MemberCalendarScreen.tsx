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
import { choreService, ChoreItem } from '@/services/choreService';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MemberCalendarScreen() {
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Only MY chores via getMemberChores (backend filters by assigned_to = userId)
  const loadData = useCallback(async () => {
    try {
      const res = await choreService.getMemberChores();
      if (res?.chores) {
        setChores(res.chores);
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

  // Month navigation
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    today.toISOString().split('T')[0]
  );

  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentYear, currentMonth]
  );
  const firstDayOfWeek = useMemo(
    () => new Date(currentYear, currentMonth, 1).getDay(),
    [currentYear, currentMonth]
  );

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', {
    month: 'long',
  });

  // Map MY chores by YYYY-MM-DD key
  const choresByDate = useMemo(() => {
    const map: Record<string, ChoreItem[]> = {};
    chores.forEach((c) => {
      if (c.due_date) {
        const d = new Date(c.due_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push(c);
      }
    });
    return map;
  }, [chores]);

  const selectedChores = choresByDate[selectedDateStr] || [];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#FEE2E2', text: '#EF4444', label: 'High' };
      case 'medium':
        return { bg: '#FFF4E6', text: '#FF9F1C', label: 'Medium' };
      default:
        return { bg: '#E6F9F0', text: '#10B981', label: 'Low' };
    }
  };

  const todayStr = today.toISOString().split('T')[0];

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>My Calendar</Text>
              <Text style={styles.headerSubtitle}>Your personal chore schedule</Text>
            </View>
            <Pressable
              onPress={() => router.push('/home/schedule' as any)}
              style={styles.schedulePill}
            >
              <Ionicons name="time" size={14} color="#713DE8" />
              <Text style={styles.schedulePillText}>Schedule</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Interactive Month Calendar ── */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthHeaderRow}>
            <Pressable onPress={handlePrevMonth} style={styles.navArrow} hitSlop={10}>
              <Ionicons name="chevron-back" size={20} color="#1E1B2E" />
            </Pressable>
            <Text style={styles.monthTitle}>
              {monthName} {currentYear}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.navArrow} hitSlop={10}>
              <Ionicons name="chevron-forward" size={20} color="#1E1B2E" />
            </Pressable>
          </View>

          {/* Day labels */}
          <View style={styles.dayLabelRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={styles.dayLabel}>
                {d}
              </Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`e-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const mStr = String(currentMonth + 1).padStart(2, '0');
              const dStr = String(dayNum).padStart(2, '0');
              const dateKey = `${currentYear}-${mStr}-${dStr}`;
              const isSelected = selectedDateStr === dateKey;
              const isToday = todayStr === dateKey;
              const hasChores = (choresByDate[dateKey] || []).length > 0;

              return (
                <Pressable
                  key={dateKey}
                  onPress={() => setSelectedDateStr(dateKey)}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && styles.selectedCircle,
                      !isSelected && isToday && styles.todayCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        isSelected && styles.selectedNum,
                        !isSelected && isToday && styles.todayNum,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>
                  {hasChores ? (
                    <View
                      style={[styles.dot, isSelected && styles.dotSelected]}
                    />
                  ) : (
                    <View style={styles.dotSpacer} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Selected Date Chores ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {selectedChores.length}{' '}
              {selectedChores.length === 1 ? 'chore' : 'chores'}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#713DE8" size="large" style={{ marginTop: 16 }} />
        ) : selectedChores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No chores scheduled for this day</Text>
            <Text style={styles.emptySubtitle}>Enjoy your free time! 🎉</Text>
          </View>
        ) : (
          <View style={styles.choreslist}>
            {selectedChores.map((c) => {
              const prio = getPriorityBadge(c.priority);
              const isCompleted = c.status === 'completed';

              return (
                <Pressable
                  key={c.id}
                  onPress={() =>
                    router.push({
                      pathname: '/home/chore-details' as any,
                      params: { id: c.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.choreCard,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <View style={styles.choreTop}>
                    <View style={styles.choreTitleGroup}>
                      <Text
                        style={[
                          styles.choreTitle,
                          isCompleted && styles.choreCompleted,
                        ]}
                      >
                        {c.title}
                      </Text>
                      {c.category ? (
                        <Text style={styles.categoryTag}>🏷️ {c.category}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.prioBadge, { backgroundColor: prio.bg }]}>
                      <Text style={[styles.prioText, { color: prio.text }]}>
                        {prio.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.choreBottom}>
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted ? styles.completedBg : styles.pendingBg,
                      ]}
                    >
                      <Ionicons
                        name={isCompleted ? 'checkmark-circle' : 'time-outline'}
                        size={13}
                        color={isCompleted ? '#059669' : '#D97706'}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isCompleted ? '#059669' : '#D97706' },
                        ]}
                      >
                        {isCompleted ? 'Completed' : 'Pending'}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#A09DB1" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFD' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 18,
  },
  header: { gap: 4 },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.4,
  },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: '#8A879A' },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  schedulePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#713DE8',
  },

  // Month Calendar
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAFAFD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  monthTitle: { fontSize: 17, fontWeight: '900', color: '#1E1B2E' },
  dayLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3FF',
    paddingBottom: 8,
    marginBottom: 8,
  },
  dayLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#8A879A',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 5 },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: { backgroundColor: '#713DE8' },
  todayCircle: { backgroundColor: '#EDE9FE' },
  dayNum: { fontSize: 13, fontWeight: '700', color: '#1E1B2E' },
  selectedNum: { color: '#FFFFFF' },
  todayNum: { color: '#713DE8' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#713DE8',
    marginTop: 2,
  },
  dotSelected: { backgroundColor: '#FFFFFF' },
  dotSpacer: { height: 7 },

  // Section header for selected date
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: '#1E1B2E' },
  countBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: { fontSize: 12, fontWeight: '800', color: '#713DE8' },

  // Chores List
  choreslist: { gap: 12 },
  choreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  choreTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  choreTitleGroup: { flex: 1, gap: 2 },
  choreTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B2E' },
  choreCompleted: { textDecorationLine: 'line-through', color: '#A09DB1' },
  categoryTag: { fontSize: 12, color: '#8A879A', fontWeight: '500' },
  prioBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  prioText: { fontSize: 11, fontWeight: '800' },
  choreBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F5F3FF',
    paddingTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  completedBg: { backgroundColor: '#D1FAE5' },
  pendingBg: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '800' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 8,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B2E', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#8A879A', textAlign: 'center' },
});
