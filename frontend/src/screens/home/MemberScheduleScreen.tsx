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

type ViewMode = 'day' | 'week' | 'month';

export default function MemberScheduleScreen() {
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');

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

  const filteredChores = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return chores.filter((c) => {
      if (!c.due_date) return true;
      const dueDate = new Date(c.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (viewMode === 'day') {
        return dueDate.getTime() === today.getTime();
      }

      if (viewMode === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return dueDate >= today && dueDate <= nextWeek;
      }

      if (viewMode === 'month') {
        return (
          dueDate.getMonth() === today.getMonth() &&
          dueDate.getFullYear() === today.getFullYear()
        );
      }

      return true;
    });
  }, [chores, viewMode]);

  const groupedChores = useMemo(() => {
    const map: Record<string, ChoreItem[]> = {};
    filteredChores.forEach((chore) => {
      const key = chore.due_date
        ? new Date(chore.due_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Flexible / Unscheduled';
      if (!map[key]) map[key] = [];
      map[key].push(chore);
    });
    return map;
  }, [filteredChores]);

  const dateKeys = Object.keys(groupedChores);

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
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color="#1E1B2E" />
          </Pressable>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* View Mode Toggle Pills */}
        <View style={styles.toggleContainer}>
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => {
            const isSelected = viewMode === mode;
            const labels: Record<ViewMode, string> = {
              day: 'Day',
              week: 'Week',
              month: 'Month',
            };
            return (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                style={[styles.togglePill, isSelected && styles.togglePillSelected]}
              >
                <Text
                  style={[
                    styles.togglePillText,
                    isSelected && styles.togglePillTextSelected,
                  ]}
                >
                  {labels[mode]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summaryBar}>
          <Ionicons name="calendar-outline" size={16} color="#713DE8" />
          <Text style={styles.summaryText}>
            <Text style={styles.boldText}>{filteredChores.length}</Text>{' '}
            {filteredChores.length === 1 ? 'chore' : 'chores'} in your{' '}
            {viewMode === 'day'
              ? "today's schedule"
              : viewMode === 'week'
              ? 'weekly schedule'
              : 'monthly schedule'}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
        ) : dateKeys.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>You don't have any chores scheduled</Text>
            <Text style={styles.emptySubtitle}>
              No chores assigned to you for the selected {viewMode} period.
            </Text>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {dateKeys.map((dateLabel) => (
              <View key={dateLabel} style={styles.dateGroup}>
                <View style={styles.dateGroupHeader}>
                  <Ionicons name="time" size={14} color="#713DE8" />
                  <Text style={styles.dateGroupTitle}>{dateLabel}</Text>
                </View>

                <View style={styles.choresContainer}>
                  {groupedChores[dateLabel].map((c) => {
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
                        <View style={styles.choreTopRow}>
                          <View style={styles.titleWrap}>
                            <Text
                              style={[
                                styles.choreTitle,
                                isCompleted && styles.choreCompleted,
                              ]}
                            >
                              {c.title}
                            </Text>
                            {c.description ? (
                              <Text style={styles.choreDesc} numberOfLines={1}>
                                {c.description}
                              </Text>
                            ) : null}
                          </View>

                          <View
                            style={[
                              styles.prioBadge,
                              { backgroundColor: prio.bg },
                            ]}
                          >
                            <Text style={[styles.prioText, { color: prio.text }]}>
                              {prio.label}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.choreBottomRow}>
                          <View
                            style={[
                              styles.statusBadge,
                              isCompleted
                                ? styles.completedBg
                                : styles.pendingBg,
                            ]}
                          >
                            <Ionicons
                              name={
                                isCompleted ? 'checkmark-circle' : 'time-outline'
                              }
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
              </View>
            ))}
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
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E1B2E',
  },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAE7F5',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePillSelected: {
    backgroundColor: '#713DE8',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  togglePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#656276',
  },
  togglePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  summaryText: {
    fontSize: 13,
    color: '#1E1B2E',
  },
  boldText: {
    fontWeight: '800',
    color: '#713DE8',
  },

  groupsList: {
    gap: 18,
  },
  dateGroup: {
    gap: 10,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateGroupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#713DE8',
  },

  choresContainer: {
    gap: 10,
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
  titleWrap: {
    flex: 1,
    marginRight: 10,
    gap: 2,
  },
  choreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  choreCompleted: {
    textDecorationLine: 'line-through',
    color: '#A09DB1',
  },
  choreDesc: {
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  completedBg: {
    backgroundColor: '#D1FAE5',
  },
  pendingBg: {
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A879A',
    textAlign: 'center',
  },
});
