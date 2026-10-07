import { formatAdminMessage } from '@/i18n/adminGlobalTranslations';
import { useLanguage } from '@/context/LanguageContext';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
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

type ViewMode = 'day' | 'week' | 'month';

export default function AdminScheduleScreen() {
  const { t, language } = useLanguage();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const loadData = useCallback(async () => {
    try {
      const res = await choreService.getAdminStats();
      if (res?.chores) {
        setChores(res.chores);
      }
    } catch {
      try {
        const fallback = await choreService.getChores();
        if (fallback?.chores) setChores(fallback.chores);
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

  // Filter chores according to Day / Week / Month view
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

  // Group filtered chores by date string label
  const groupedChores = useMemo(() => {
    const map: Record<string, ChoreItem[]> = {};
    filteredChores.forEach((chore) => {
      const key = chore.due_date
        ? new Date(chore.due_date).toLocaleDateString(language, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : t('ag_unscheduled');
      if (!map[key]) map[key] = [];
      map[key].push(chore);
    });
    return map;
  }, [filteredChores, language, t]);

  const dateKeys = Object.keys(groupedChores);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEE2E2'), text: '#EF4444', label: t('priority_high') };
      case 'medium':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FFF4E6'), text: '#FF9F1C', label: t('priority_medium') };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#E6F9F0'), text: '#10B981', label: t('priority_low') };
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
          <Text style={styles.headerTitle}>{t('ag_schedule')}</Text>
          <Text style={styles.headerSubtitle}>{t('ag_schedule_description')}</Text>
        </View>

        {/* ── View Mode Toggle Pills (Day / Week / Month) ── */}
        <View style={styles.viewToggleContainer}>
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => {
            const isSelected = viewMode === mode;
            const labelMap: Record<ViewMode, string> = {
              day: t('ag_day_view'),
              week: t('ag_week_view'),
              month: t('ag_month_view'),
            };

            return (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                style={[
                  styles.togglePill,
                  isSelected && styles.togglePillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.togglePillText,
                    isSelected && styles.togglePillTextSelected,
                  ]}
                >
                  {labelMap[mode]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary Banner */}
        <View style={styles.summaryBar}>
          <Ionicons name="calendar-outline" size={18} color="#713DE8" />
          <Text style={styles.summaryText}>{formatAdminMessage(t, 'ag_schedule_summary', {count: filteredChores.length, period: viewMode === 'day' ? t('ag_today_schedule') : t(viewMode === 'week' ? 'filter_week' : 'filter_month')})}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
        ) : dateKeys.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>{t('ag_no_scheduled')}</Text>
            <Text style={styles.emptySubtitle}>
              {formatAdminMessage(t, 'ag_no_period_chores', {period: t('ag_' + viewMode + '_view')})}
            </Text>
          </View>
        ) : (
          <View style={styles.scheduleGroupList}>
            {dateKeys.map((dateLabel) => (
              <View key={dateLabel} style={styles.dateGroupSection}>
                {/* Date Group Header */}
                <View style={styles.dateGroupHeader}>
                  <View style={styles.dateHeaderBadge}>
                    <Ionicons name="time" size={14} color="#713DE8" />
                    <Text style={styles.dateHeaderTitle}>{dateLabel}</Text>
                  </View>

                  <Text style={styles.groupCountText}>
                    {groupedChores[dateLabel].length}{' '}
                    {groupedChores[dateLabel].length === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                {/* Chores under this date */}
                <View style={styles.choresContainer}>
                  {groupedChores[dateLabel].map((c) => {
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
                          styles.choreItemCard,
                          pressed && { opacity: 0.9 },
                        ]}
                      >
                        <View style={styles.choreRowTop}>
                          <View style={styles.titleWrap}>
                            <Text style={styles.choreTitle}>{c.title}</Text>
                            {c.description ? (
                              <Text style={styles.choreDesc} numberOfLines={1}>
                                {c.description}
                              </Text>
                            ) : null}
                          </View>

                          <View
                            style={[
                              styles.priorityBadge,
                              { backgroundColor: prio.bg },
                            ]}
                          >
                            <Text style={[styles.priorityText, { color: prio.text }]}>
                              {prio.label}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.choreRowBottom}>
                          {/* Assigned Member */}
                          <View style={styles.assigneeGroup}>
                            <Avatar
                              name={c.assignee_name || t('admin_unassigned')}
                              uri={c.assignee_avatar || undefined}
                              size={26}
                            />
                            <Text style={styles.assigneeText}>
                              {c.assignee_name ? c.assignee_name : t('admin_unassigned')}
                            </Text>
                          </View>

                          {/* Status */}
                          <View
                            style={[
                              styles.statusBadge,
                              isCompleted
                                ? styles.statusCompletedBg
                                : styles.statusPendingBg,
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
                              {isCompleted ? t('filter_completed') : t('filter_pending')}
                            </Text>
                          </View>
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

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },

  header: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },

  // View Mode Toggle
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: (themeColors.isDark ? themeColors.background : '#EAE7F5'),
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
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
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  togglePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  summaryText: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  boldText: {
    fontWeight: '800',
    color: '#713DE8',
  },

  scheduleGroupList: {
    gap: 20,
  },
  dateGroupSection: {
    gap: 10,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#713DE8',
  },
  groupCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },

  choresContainer: {
    gap: 10,
  },
  choreItemCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  choreRowTop: {
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
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  choreDesc: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
  },

  choreRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: (themeColors.isDark ? themeColors.border : '#F5F3FF'),
  },
  assigneeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assigneeText: {
    fontSize: 13,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#4B5563'),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusCompletedBg: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#D1FAE5'),
  },
  statusPendingBg: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF3C7'),
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  emptySubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    textAlign: 'center',
  },
});
