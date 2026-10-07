import { useThemedStyles, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChoreItem } from '@/services/choreService';

interface MemberChoreCardProps {
  chore: ChoreItem;
  onToggleComplete: (id: string) => void;
  onViewDetails?: (chore: ChoreItem) => void;
}

export function MemberChoreCard({
  chore,
  onToggleComplete,
  onViewDetails,
}: MemberChoreCardProps) {
  const styles = useThemedStyles(createStyles);
  const { t, language } = useLanguage();
  const isCompleted = chore.status === 'completed';

  const getPriorityStyle = () => {
    switch (chore.priority) {
      case 'high':
        return { badge: styles.highPriorityBadge, text: styles.highPriorityText, label: t('priority_high') };
      case 'low':
        return { badge: styles.lowPriorityBadge, text: styles.lowPriorityText, label: t('priority_low') };
      default:
        return { badge: styles.mediumPriorityBadge, text: styles.mediumPriorityText, label: t('priority_medium') };
    }
  };

  const priorityStyle = getPriorityStyle();

  const formattedDate = chore.due_date
    ? new Date(chore.due_date).toLocaleDateString(language, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      {/* Top Header */}
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, isCompleted && styles.completedTitle]}
            numberOfLines={1}
          >
            {chore.title}
          </Text>
          {chore.category ? (
            <Text style={styles.categoryTag}>• {['General', 'Cleaning', 'Kitchen', 'Laundry', 'Yard', 'Pets'].includes(chore.category) ? t('ui_' + chore.category.toLowerCase()) : chore.category}</Text>
          ) : null}
        </View>
        <View style={[styles.priorityBadge, priorityStyle.badge]}>
          <Text style={[styles.priorityText, priorityStyle.text]}>
            {priorityStyle.label}
          </Text>
        </View>
      </View>

      {/* Description */}
      {chore.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {chore.description}
        </Text>
      ) : null}

      {/* Tags row: Due date & Recurrence */}
      <View style={styles.tagsRow}>
        {formattedDate ? (
          <View style={styles.tag}>
            <Text style={styles.tagIcon}>📅</Text>
            <Text style={styles.tagText}>{formattedDate}</Text>
          </View>
        ) : null}

        {chore.recurrence && chore.recurrence !== 'none' ? (
          <View style={styles.tag}>
            <Text style={styles.tagIcon}>🔄</Text>
            <Text style={styles.tagText}>
              {t('repeat_' + chore.recurrence)}
            </Text>
          </View>
        ) : null}

        {chore.creator_name ? (
          <View style={styles.tag}>
            <Text style={styles.tagIcon}>👤</Text>
            <Text style={styles.tagText}>{t('by')}{' '}{chore.creator_name}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions row: View Details & Mark Complete */}
      <View style={styles.footerRow}>
        {onViewDetails ? (
          <Pressable onPress={() => onViewDetails(chore)} style={styles.detailsButton}>
            <Text style={styles.detailsText}>{t('ui_view_details')}</Text>
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable
          onPress={() => onToggleComplete(chore.id)}
          style={({ pressed }) => [
            styles.completeButton,
            isCompleted ? styles.completedButtonBg : styles.pendingButtonBg,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.completeIcon}>{isCompleted ? '✓' : '○'}</Text>
          <Text
            style={[
              styles.completeBtnText,
              isCompleted ? styles.completedBtnTextColor : styles.pendingBtnTextColor,
            ]}
          >
            {isCompleted ? t('filter_completed') : t('ui_mark_completed')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  completedCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'),
    borderColor: (themeColors.isDark ? themeColors.border : '#F0EDF9'),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: (themeColors.isDark ? themeColors.textSecondary : '#9592A6'),
  },
  categoryTag: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#757288'),
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  highPriorityBadge: { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEE2E2') },
  highPriorityText: { color: '#EF4444' },
  mediumPriorityBadge: { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF3C7') },
  mediumPriorityText: { color: '#D97706' },
  lowPriorityBadge: { backgroundColor: (themeColors.isDark ? themeColors.surface : '#E0E7FF') },
  lowPriorityText: { color: '#4F46E5' },
  priorityText: { fontSize: 11, fontWeight: '800' },
  description: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  tagIcon: { fontSize: 11 },
  tagText: { fontSize: 11, color: (themeColors.isDark ? themeColors.textSecondary : '#656276'), fontWeight: '600' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
    marginTop: 2,
  },
  detailsButton: {
    paddingVertical: 4,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#713DE8',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pendingButtonBg: {
    backgroundColor: '#713DE8',
  },
  completedButtonBg: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#ECFDF5'),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  completeIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#FFFFFF'),
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pendingBtnTextColor: {
    color: '#FFFFFF',
  },
  completedBtnTextColor: {
    color: '#059669',
  },
});
