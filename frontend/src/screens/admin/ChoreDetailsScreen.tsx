import { useAppAlert } from '@/components/ui/AppDialog';
import { useLanguage } from '@/context/LanguageContext';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,

  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { choreService, ChoreItem } from '@/services/choreService';

export default function ChoreDetailsScreen() {
  const alert = useAppAlert();
  const { t, language } = useLanguage();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ id?: string; choreData?: string }>();
  const choreId = params.id;

  const [chore, setChore] = useState<ChoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const loadChoreDetails = async () => {
    if (!choreId) {
      setLoading(false);
      return;
    }

    if (params.choreData) {
      try {
        const parsed = JSON.parse(params.choreData);
        setChore(parsed);
        setLoading(false);
        return;
      } catch {
        // Fallback to API load
      }
    }

    try {
      const res = await choreService.getChoreById(choreId);
      if (res?.chore) {
        setChore(res.chore);
      }
    } catch (err) {
      setError(t('ag_fetch_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChoreDetails();
  }, [choreId]);

  const handleToggleComplete = async () => {
    if (!chore) return;
    setToggling(true);
    try {
      const updatedStatus = chore.status === 'completed' ? 'pending' : 'completed';
      setChore((prev) => (prev ? { ...prev, status: updatedStatus } : null));
      await choreService.toggleChoreComplete(chore.id);
    } catch {
      alert(t('error'), t('ag_status_failed'));
      loadChoreDetails();
    } finally {
      setToggling(false);
    }
  };

  const handleEdit = () => {
    if (!chore) return;
    router.push({
      pathname: '/admin/edit-chore',
      params: { id: chore.id, choreData: JSON.stringify(chore) },
    } as any);
  };

  const handleDelete = () => {
    if (!chore) return;
    alert(
      t('ag_delete_chore'),
      {key: 'ag_delete_confirm', values: {title: chore.title}},
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await choreService.deleteChore(chore.id);
              alert(t('success'), t('ag_chore_deleted'));
              router.back();
            } catch (err) {
              alert(t('error'), t('ag_delete_failed'));
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t('not_set');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('not_set');
    return date.toLocaleDateString(language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
        return { bg: (themeColors.isDark ? themeColors.surface : '#DCFCE7'), text: '#16A34A', label: t('filter_completed'), dot: '#10B981' };
      case 'overdue':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEE2E2'), text: '#DC2626', label: t('status_overdue'), dot: '#EF4444' };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEF3C7'), text: '#D97706', label: t('filter_pending'), dot: '#F59E0B' };
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#713DE8" />
          <Text style={styles.loadingText}>{t('ag_loading_details')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chore) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('chore_details_title')}</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t('ag_chore_missing')}</Text>
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
  const assigneeInitial = chore.assignee_name
    ? chore.assignee_name.trim().charAt(0).toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel={t('back')}
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
        {/* Top Summary Card */}
        <View style={styles.topSummaryCard}>
          <View style={styles.topSummaryRow}>
            {/* Icon Badge */}
            <View style={styles.iconBadge}>
              <Text style={styles.iconSymbol}>🧹</Text>
            </View>

            {/* Title & Status */}
            <View style={styles.topTitleGroup}>
              <View style={styles.titleStatusRow}>
                <Text style={styles.choreTitle} numberOfLines={1}>
                  {chore.title}
                </Text>
                <View
                  style={[
                    styles.statusPillTop,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text style={[styles.statusTextTop, { color: statusStyle.text }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>

              {/* Subtitle / Category */}
              {chore.category ? (
                <Text style={styles.categoryText}>{chore.category}</Text>
              ) : null}

              {/* Description */}
              {chore.description ? (
                <Text style={styles.descriptionText}>{chore.description}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Details Items List */}
        <View style={styles.detailsListCard}>
          {/* Assigned to */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="person-outline" size={18} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
              <Text style={styles.detailLabel}>{t('ag_assigned_to')}</Text>
            </View>
            {chore.assignee_name ? (
              <View style={styles.assigneeValueRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{assigneeInitial}</Text>
                </View>
                <Text style={styles.detailValueText}>{chore.assignee_name}</Text>
              </View>
            ) : (
              <Text style={styles.detailValueTextMuted}>{t('admin_unassigned')}</Text>
            )}
          </View>

          {/* Priority */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="star-outline" size={18} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
              <Text style={styles.detailLabel}>{t('priority_label')}</Text>
            </View>
            <View
              style={[
                styles.priorityPill,
                { backgroundColor: priorityStyle.bg },
              ]}
            >
              <Text style={[styles.priorityPillText, { color: priorityStyle.text }]}>
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
            <View style={styles.valueWithIcon}>
              <Text style={styles.valueIcon}>📅</Text>
              <Text style={styles.detailValueText}>{formatDate(chore.due_date)}</Text>
            </View>
          </View>

          {/* Repeat */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="refresh-outline" size={18} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
              <Text style={styles.detailLabel}>{t('repeat_label')}</Text>
            </View>
            <View style={styles.valueWithIcon}>
              <Text style={styles.valueIcon}>🔄</Text>
              <Text style={styles.detailValueText}>{getRepeatLabel(chore.recurrence)}</Text>
            </View>
          </View>

          {/* Status */}
          <View style={styles.detailRowNoBorder}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="cog-outline" size={18} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
              <Text style={styles.detailLabel}>{t('ui_status')}</Text>
            </View>
            <View style={styles.valueWithIcon}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
              <Text style={styles.detailValueText}>{statusStyle.label}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Mark as Completed / Mark as Pending */}
          <Pressable
            onPress={handleToggleComplete}
            disabled={toggling}
            style={({ pressed }) => [
              styles.actionBtnOutline,
              pressed && { opacity: 0.8 },
            ]}
          >
            {toggling ? (
              <ActivityIndicator color="#713DE8" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isCompleted ? 'time-outline' : 'checkmark-sharp'}
                  size={20}
                  color="#713DE8"
                />
                <Text style={styles.actionBtnOutlineText}>
                  {isCompleted ? t('mark_as_pending') : t('mark_as_completed')}
                </Text>
              </>
            )}
          </Pressable>

          {/* Edit Chore */}
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.actionBtnOutline,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.actionBtnOutlineText}>{t('ui_edit_chore')}</Text>
          </Pressable>

          {/* Delete Chore */}
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.deleteBtnOutline,
              pressed && { opacity: 0.8 },
            ]}
          >
            {deleting ? (
              <ActivityIndicator color="#DC2626" size="small" />
            ) : (
              <Text style={styles.deleteBtnOutlineText}>{t('ag_delete_chore')}</Text>
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
  loadingText: {
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textSecondary : '#757288'),
    fontWeight: '600',
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  topSummaryCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
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
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: 28,
  },
  topTitleGroup: {
    flex: 1,
    gap: 4,
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
  statusPillTop: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextTop: {
    fontSize: 11,
    fontWeight: '800',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  descriptionText: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    marginTop: 2,
    lineHeight: 18,
  },
  detailsListCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  assigneeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: '800',
    color: '#713DE8',
  },
  detailValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  detailValueTextMuted: {
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  priorityPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priorityPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueIcon: {
    fontSize: 13,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionButtonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionBtnOutline: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderWidth: 1.5,
    borderColor: '#713DE8',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnOutlineText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#713DE8',
  },
  deleteBtnOutline: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFF5F5'),
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnOutlineText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
});
