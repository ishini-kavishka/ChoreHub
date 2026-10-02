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
import { Avatar } from '@/components/profile/Avatar';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminCalendarScreen() {
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Month navigation state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadData = useCallback(async () => {
    try {
      // Use getAdminStats or getChores to fetch all household chores
      const res = await choreService.getAdminStats();
      if (res?.chores) {
        setChores(res.chores);
      }
    } catch {
      // Fallback
      try {
        const fallbackRes = await choreService.getChores();
        if (fallbackRes?.chores) {
          setChores(fallbackRes.chores);
        }
      } catch {
        // Soft fail
      }
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

  // Map chores by YYYY-MM-DD date key
  const choresByDateKey = useMemo(() => {
    const map: Record<string, ChoreItem[]> = {};
    chores.forEach((c) => {
      if (c.due_date) {
        const dateObj = new Date(c.due_date);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;
        if (!map[key]) map[key] = [];
        map[key].push(c);
      }
    });
    return map;
  }, [chores]);

  // Calendar math for grid
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

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

  const selectedDateChores = choresByDateKey[selectedDateStr] || [];

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
          <Text style={styles.headerTitle}>Household Calendar</Text>
          <Text style={styles.headerSubtitle}>
            View scheduled chores across all family members
          </Text>
        </View>

        {/* ── Interactive Month Calendar Card ── */}
        <View style={styles.calendarCard}>
          {/* Month Header Navigation */}
          <View style={styles.monthHeaderRow}>
            <Pressable onPress={handlePrevMonth} style={styles.navArrowBtn} hitSlop={10}>
              <Ionicons name="chevron-back" size={20} color="#1E1B2E" />
            </Pressable>

            <Text style={styles.monthTitleText}>
              {monthName} {currentYear}
            </Text>

            <Pressable onPress={handleNextMonth} style={styles.navArrowBtn} hitSlop={10}>
              <Ionicons name="chevron-forward" size={20} color="#1E1B2E" />
            </Pressable>
          </View>

          {/* Days of Week Row */}
          <View style={styles.daysOfWeekRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={styles.dayOfWeekText}>
                {d}
              </Text>
            ))}
          </View>

          {/* Month Grid */}
          <View style={styles.gridContainer}>
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const mStr = String(currentMonth + 1).padStart(2, '0');
              const dStr = String(dayNum).padStart(2, '0');
              const dateKey = `${currentYear}-${mStr}-${dStr}`;

              const isSelected = selectedDateStr === dateKey;
              const hasChores = (choresByDateKey[dateKey] || []).length > 0;
              const isToday =
                new Date().toISOString().split('T')[0] === dateKey;

              return (
                <Pressable
                  key={dateKey}
                  onPress={() => setSelectedDateStr(dateKey)}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayNumberCircle,
                      isSelected && styles.selectedDayCircle,
                      !isSelected && isToday && styles.todayDayCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSelected && styles.selectedDayText,
                        !isSelected && isToday && styles.todayDayText,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>

                  {/* Chore indicator dot */}
                  {hasChores ? (
                    <View
                      style={[
                        styles.choreDot,
                        isSelected && styles.choreDotSelected,
                      ]}
                    />
                  ) : (
                    <View style={styles.choreDotSpacer} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Selected Date Chores Section ── */}
        <View style={styles.selectedDateHeader}>
          <Text style={styles.selectedDateTitle}>
            Chores for {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>

          <View style={styles.choreCountBadge}>
            <Text style={styles.choreCountText}>
              {selectedDateChores.length} {selectedDateChores.length === 1 ? 'chore' : 'chores'}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 20 }} />
        ) : selectedDateChores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Chores Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              There are no chores assigned on this date.
            </Text>
          </View>
        ) : (
          <View style={styles.choresList}>
            {selectedDateChores.map((c) => {
              const prio = getPriorityBadge(c.priority);
              const isCompleted = c.status === 'completed';

              return (
                <Pressable
                  key={c.id}
                  onPress={() =>
                    router.push({
                      pathname: '/admin/chore-details' as any,
                      params: { id: c.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.choreCard,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <View style={styles.choreTopRow}>
                    <View style={styles.choreTitleGroup}>
                      <Text style={styles.choreTitle}>{c.title}</Text>
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

                  {/* Assignee & Status Row */}
                  <View style={styles.choreBottomRow}>
                    <View style={styles.assigneeWrap}>
                      <Avatar
                        name={c.assignee_name || 'Unassigned'}
                        uri={c.assignee_avatar || undefined}
                        size={28}
                      />
                      <Text style={styles.assigneeName}>
                        {c.assignee_name ? c.assignee_name : 'Unassigned'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted ? styles.completedStatusBg : styles.pendingStatusBg,
                      ]}
                    >
                      <Ionicons
                        name={isCompleted ? 'checkmark-circle' : 'time-outline'}
                        size={14}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 18,
  },

  header: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A879A',
  },

  // Calendar Card
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
    marginBottom: 16,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFAFD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  monthTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B2E',
  },

  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3FF',
    paddingBottom: 8,
  },
  dayOfWeekText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#8A879A',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayCircle: {
    backgroundColor: '#713DE8',
  },
  todayDayCircle: {
    backgroundColor: '#EDE9FE',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B2E',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  todayDayText: {
    color: '#713DE8',
  },

  choreDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#713DE8',
    marginTop: 3,
  },
  choreDotSelected: {
    backgroundColor: '#713DE8',
  },
  choreDotSpacer: {
    height: 8,
  },

  // Selected Date Header
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  choreCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  choreCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#713DE8',
  },

  choresList: {
    gap: 12,
  },
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
  choreTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  choreTitleGroup: {
    flex: 1,
    gap: 2,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  categoryTag: {
    fontSize: 12,
    color: '#8A879A',
    fontWeight: '500',
  },
  prioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  prioText: {
    fontSize: 11,
    fontWeight: '800',
  },

  choreBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F3FF',
  },
  assigneeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assigneeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  completedStatusBg: {
    backgroundColor: '#D1FAE5',
  },
  pendingStatusBg: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A879A',
    textAlign: 'center',
  },
});
