import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChoreItem } from '@/services/choreService';
import { Avatar } from '@/components/profile/Avatar';

interface ChoreItemCardProps {
  chore: ChoreItem;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (chore: ChoreItem) => void;
  onPress?: (chore: ChoreItem) => void;
}

export function ChoreItemCard({
  chore,
  onToggleComplete,
  onDelete,
  onEdit,
  onPress,
}: ChoreItemCardProps) {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t, language } = useLanguage();
  const isCompleted = chore.status === 'completed';

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FEF2F2'), text: '#DC2626', border: '#FCA5A5' };
      case 'low':
        return { bg: (themeColors.isDark ? themeColors.surface : '#EFF6FF'), text: '#2563EB', border: '#BFDBFE' };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#F0EAFF'), text: '#713DE8', border: '#D8B4FE' };
    }
  };

  const priorityStyle = getPriorityStyle(chore.priority);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) return t('today');
    return date.toLocaleDateString(language, { month: 'short', day: 'numeric' });
  };

  const formattedDate = formatDate(chore.due_date);

  return (
    <Pressable
      onPress={() => onPress && onPress(chore)}
      style={({ pressed }) => [
        styles.card,
        isCompleted && styles.completedCard,
        pressed && styles.pressed,
      ]}
    >
      {/* Checkbox */}
      <Pressable
        onPress={() => onToggleComplete(chore.id)}
        style={({ pressed }) => [
          styles.checkbox,
          isCompleted && styles.checkboxCompleted,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityLabel={isCompleted ? t('ui_mark_pending') : t('ui_mark_completed')}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isCompleted && styles.completedTitle]}
            numberOfLines={1}
          >
            {chore.title}
          </Text>
        </View>

        {chore.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {chore.description}
          </Text>
        ) : null}

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
              {t('priority_' + chore.priority)}
            </Text>
          </View>

          {chore.assignee_name ? (
            <View style={styles.assigneeBadge}>
              <Text style={styles.assigneeText}>👤 {chore.assignee_name}</Text>
            </View>
          ) : null}

          {chore.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{['General', 'Cleaning', 'Kitchen', 'Laundry', 'Yard', 'Pets'].includes(chore.category) ? t('ui_' + chore.category.toLowerCase()) : chore.category}</Text>
            </View>
          ) : null}

          {formattedDate ? (
            <View style={styles.dateBadge}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
          ) : null}

          {chore.recurrence && chore.recurrence !== 'none' ? (
            <View style={styles.repeatBadge}>
              <Text style={styles.repeatText}>🔁 {t('repeat_' + chore.recurrence)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right Column: Assignee Avatar & Actions */}
      <View style={styles.rightColumn}>
        {chore.assignee_name ? (
          <Avatar
            name={chore.assignee_name}
            uri={chore.assignee_avatar || undefined}
            size={28}
          />
        ) : null}

        <View style={styles.actionButtonsRow}>
          {onEdit ? (
            <Pressable
              onPress={() => onEdit(chore)}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
              accessibilityLabel={t('ui_edit_chore')}
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => onDelete(chore.id)}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
            accessibilityLabel={t('ui_delete_chore')}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'),
    borderColor: (themeColors.isDark ? themeColors.border : '#EFEFF5'),
    opacity: 0.75,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
  },
  checkboxCompleted: {
    backgroundColor: '#713DE8',
    borderColor: '#713DE8',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  description: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#757288'),
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3F4F6'),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: (themeColors.isDark ? themeColors.textSecondary : '#4B5563'),
    fontWeight: '600',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#F9FAFB'),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateIcon: {
    fontSize: 10,
  },
  dateText: {
    fontSize: 11,
    color: (themeColors.isDark ? themeColors.textSecondary : '#6B7280'),
    fontWeight: '600',
  },
  repeatBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3E8FF'),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  repeatText: {
    fontSize: 11,
    color: '#6B21A8',
    fontWeight: '600',
  },
  assigneeBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#E0F2FE'),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  assigneeText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 15,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 14,
  },
});
