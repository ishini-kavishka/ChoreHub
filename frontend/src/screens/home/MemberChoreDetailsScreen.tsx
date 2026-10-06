import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import { choreService, ChoreItem } from '@/services/choreService';

export default function MemberChoreDetailsScreen() {
  const alert = useAppAlert();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{ id?: string; choreData?: string }>();
  const choreId = params.id;

  const [chore, setChore] = useState<ChoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const loadChoreDetails = async () => {
    if (!choreId) {
      setLoading(false);
      return;
    }

    if (params.choreData) {
      try {
        const parsed = JSON.parse(params.choreData);
        setChore(parsed);
        // Keep cached content as a fallback, then fetch the authoritative schedule.
      } catch {
        // Fallback to API call
      }
    }

    try {
      const res = await choreService.getChoreById(choreId);
      if (res?.chore) {
        setChore(res.chore);
      }
    } catch {
      // Soft fail
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { void loadChoreDetails(); }, [choreId]));

  const handleToggleComplete = async () => {
    if (!chore) return;
    setToggling(true);
    try {
      const isNowCompleted = chore.status !== 'completed';
      await choreService.toggleChoreComplete(chore.id);
      if (isNowCompleted) {
        router.push({
          pathname: '/home/chore-completed',
          params: {
            title: chore.title,
            completedAt: new Date().toISOString(),
          },
        } as any);
      } else {
        setChore((prev) => (prev ? { ...prev, status: 'pending' } : null));
      }
    } catch {
      alert(t('error'), t('admin_error'));
      loadChoreDetails();
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t('not_set');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('not_set');
    return date.toLocaleString(language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'high':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEE2E2'), text: '#DC2626', label: t('priority_high') };
      case 'low':
        return { bg: (themeColors.isDark ? themeColors.surface : '#DCFCE7'), text: '#16A34A', label: t('priority_low') };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#EDE9FE'), text: '#713DE8', label: t('priority_medium') };
    }
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'completed':
        return { bg: (themeColors.isDark ? themeColors.surface : '#DCFCE7'), text: '#16A34A', label: t('status_completed') };
      case 'overdue':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEE2E2'), text: '#DC2626', label: t('status_overdue') };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEF3C7'), text: '#D97706', label: t('status_pending') };
    }
  };

  const getRepeatLabel = (rec?: string) => {
    switch (rec) {
      case 'daily':
        return t('repeat_daily');
      case 'weekly':
        return t('repeat_weekly');
      case 'monthly':
        return t('repeat_monthly');
      default:
        return t('repeat_none');
    }
  };

  const getChoreIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('outdoor') || cat.includes('trash') || cat.includes('yard')) {
      return 'trash';
    }
    if (cat.includes('garden') || cat.includes('plant')) {
      return 'leaf';
    }
    if (cat.includes('kitchen') || cat.includes('dish')) {
      return 'restaurant';
    }
    return 'construct';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#713DE8" />
        </View>
      </SafeAreaView>
    );
  }

  if (!chore) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel={t('go_back')}>
            <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('chore_details_title')}</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t('chore_not_found')}</Text>
          <Pressable onPress={() => router.back()} style={styles.returnBtn}>
            <Text style={styles.returnBtnText}>{t('go_back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const priorityStyle = getPriorityStyle(chore.priority);
  const statusStyle = getStatusStyle(chore.status);
  const isCompleted = chore.status === 'completed';
  const iconName = getChoreIcon(chore.category);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel={t('go_back')}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('chore_details_title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Summary Card ── */}
        <View style={styles.topSummaryCard}>
          <View style={styles.topSummaryRow}>
            {/* Square Icon Badge */}
            <View style={styles.iconBadge}>
              <Ionicons name={iconName} size={32} color="#713DE8" />
            </View>

            {/* Title & Meta */}
            <View style={styles.topTitleGroup}>
              <View style={styles.titleStatusRow}>
                <Text style={styles.choreTitle} numberOfLines={1}>
                  {chore.title}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>

              {chore.category ? (
                <Text style={styles.categoryText}>{['General', 'Cleaning', 'Kitchen', 'Laundry', 'Yard', 'Pets'].includes(chore.category) ? t('ui_' + chore.category.toLowerCase()) : chore.category}</Text>
              ) : null}

              {chore.description ? (
                <Text style={styles.shortSummaryText} numberOfLines={2}>
                  {chore.description}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Detail Items List Rows ── */}
        <View style={styles.detailRowsCard}>
          {/* Priority */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="cog-outline" size={18} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
              <Text style={styles.detailLabel}>{t('priority_label')}</Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityStyle.bg },
              ]}
            >
              <Text style={[styles.priorityBadgeText, { color: priorityStyle.text }]}>
                {priorityStyle.label}
              </Text>
            </View>
          </View>

          {/* Due Date */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="calendar-outline" size={18} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
              <Text style={styles.detailLabel}>{t('due_date_label')}</Text>
            </View>
            <Text style={styles.detailValueText}>{formatDate(chore.due_date)}</Text>
          </View>

          {/* Repeat */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="refresh-outline" size={18} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
              <Text style={styles.detailLabel}>{t('repeat_label')}</Text>
            </View>
            <Text style={styles.detailValueText}>{getRepeatLabel(chore.recurrence)}</Text>
          </View>

          {/* Assigned by */}
          <View style={styles.detailRowNoBorder}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="swap-horizontal-outline" size={18} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
              <Text style={styles.detailLabel}>{t('assigned_by_label')}</Text>
            </View>
            <Text style={styles.detailValueText}>
              {chore.creator_name ? `${chore.creator_name} (${t('role_admin')})` : t('role_admin')}
            </Text>
          </View>
        </View>

        {/* ── Description Card Box ── */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionHeader}>{t('description_label')}</Text>
          <Text style={styles.descriptionBody}>
            {chore.description || t('no_description_provided')}
          </Text>
        </View>

        {/* ── Bottom Full-Width Action Button ── */}
        <View style={styles.actionContainer}>
          <Pressable
            onPress={handleToggleComplete}
            disabled={toggling}
            style={({ pressed }) => [
              styles.mainActionBtn,
              isCompleted && styles.completedActionBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            {toggling ? (
              <ActivityIndicator color={isCompleted ? '#713DE8' : '#FFFFFF'} size="small" />
            ) : (
              <>
                <Ionicons
                  name={isCompleted ? 'time-outline' : 'checkmark-sharp'}
                  size={22}
                  color={isCompleted ? '#713DE8' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.mainActionBtnText,
                    isCompleted && styles.completedActionBtnText,
                  ]}
                >
                  {isCompleted ? t('mark_as_pending') : t('mark_as_completed')}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: (themeColors.isDark ? themeColors.error : '#DC2626'),
    fontWeight: '600',
  },
  returnBtn: {
    backgroundColor: '#713DE8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  scrollContent: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },

  // ── Top Summary Card ──
  topSummaryCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleGroup: {
    flex: 1,
    gap: 3,
  },
  titleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  shortSummaryText: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    marginTop: 2,
    lineHeight: 18,
  },

  // ── Detail Rows Card ──
  detailRowsCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
  },
  detailRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  detailValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Description Box ──
  descriptionCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 16,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  descriptionBody: {
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 20,
  },

  // ── Action Button ──
  actionContainer: {
    marginTop: 8,
  },
  mainActionBtn: {
    backgroundColor: '#713DE8',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  completedActionBtn: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderWidth: 2,
    borderColor: '#713DE8',
    shadowOpacity: 0.05,
  },
  mainActionBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  completedActionBtnText: {
    color: '#713DE8',
  },
});
