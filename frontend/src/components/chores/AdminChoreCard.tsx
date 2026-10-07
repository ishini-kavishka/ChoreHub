import { useLanguage } from '@/context/LanguageContext';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoreItem } from '@/services/choreService';

interface AdminChoreCardProps {
  chore: ChoreItem;
  onToggleComplete: (id: string) => void;
  onEdit: (chore: ChoreItem) => void;
  onPress?: (chore: ChoreItem) => void;
}

export function AdminChoreCard({
  chore,
  onToggleComplete,
  onEdit,
  onPress,
}: AdminChoreCardProps) {
  const { t, language } = useLanguage();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const isCompleted = chore.status === 'completed';

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEE2E2'), text: '#DC2626' };
      case 'low':
        return { bg: (themeColors.isDark ? themeColors.surface : '#DCFCE7'), text: '#16A34A' };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#EDE9FE'), text: '#713DE8' };
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: (themeColors.isDark ? themeColors.surface : '#DCFCE7'), text: '#16A34A', label: t('filter_completed') };
      case 'overdue':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEE2E2'), text: '#DC2626', label: t('status_overdue') };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEF3C7'), text: '#D97706', label: t('filter_pending') };
    }
  };

  const priorityStyle = getPriorityStyles(chore.priority);
  const statusStyle = getStatusStyles(chore.status);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString(language, { day: 'numeric', month: 'short' });
  };

  const formattedDate = formatDate(chore.due_date);
  const assigneeInitial = chore.assignee_name
    ? chore.assignee_name.trim().charAt(0).toUpperCase()
    : 'U';

  return (
    <Pressable
      onPress={() => (onPress ? onPress(chore) : onEdit(chore))}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Left Completion Toggle Circle */}
      <Pressable
        onPress={() => onToggleComplete(chore.id)}
        style={({ pressed }) => [
          styles.checkCircle,
          isCompleted && styles.checkCircleCompleted,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityLabel={isCompleted ? t('ui_mark_pending') : t('ag_mark_completed')}
      >
        {isCompleted ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </Pressable>

      {/* Middle Content */}
      <View style={styles.middleContent}>
        {/* Title */}
        <Text
          style={[styles.title, isCompleted && styles.completedText]}
          numberOfLines={1}
        >
          {chore.title}
        </Text>

        {/* Category Subtitle */}
        {chore.category ? (
          <Text style={styles.categoryText} numberOfLines={1}>
            {chore.category}
          </Text>
        ) : null}

        {/* Assignee Row */}
        {chore.assignee_name ? (
          <View style={styles.assigneeRow}>
            <View style={styles.initialAvatar}>
              <Text style={styles.initialText}>{assigneeInitial}</Text>
            </View>
            <Text style={styles.assigneeName} numberOfLines={1}>
              {chore.assignee_name}
            </Text>
          </View>
        ) : null}

        {/* Priority & Date Row */}
        <View style={styles.badgesRow}>
          {/* Priority Badge */}
          <View style={[styles.badgePill, { backgroundColor: priorityStyle.bg }]}>
            <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
              {t('priority_' + chore.priority)}
            </Text>
          </View>

          {/* Due Date Badge */}
          {formattedDate ? (
            <View style={styles.dateBadge}>
              <Text style={styles.badgeIcon}>📅</Text>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
          ) : null}

          {/* Recurrence Badge */}
          {chore.recurrence && chore.recurrence !== 'none' ? (
            <View style={styles.repeatBadge}>
              <Text style={styles.badgeIcon}>🔄</Text>
              <Text style={styles.repeatText}>{t('repeat_' + chore.recurrence)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right Status Badge & Chevron */}
      <View style={styles.rightColumn}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
      </View>
    </Pressable>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  checkCircleCompleted: {
    backgroundColor: '#713DE8',
    borderColor: '#713DE8',
  },
  middleContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  categoryText: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    fontWeight: '500',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 2,
  },
  initialAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#713DE8',
  },
  assigneeName: {
    fontSize: 13,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  repeatText: {
    fontSize: 12,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 2,
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
