import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChoreItem } from '@/services/choreService';
import { Avatar } from '@/components/profile/Avatar';

interface ChoreItemCardProps {
  chore: ChoreItem;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPress?: (chore: ChoreItem) => void;
}

export function ChoreItemCard({
  chore,
  onToggleComplete,
  onDelete,
  onPress,
}: ChoreItemCardProps) {
  const isCompleted = chore.status === 'completed';

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
      case 'low':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      default:
        return { bg: '#F0EAFF', text: '#713DE8', border: '#D8B4FE' };
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

    if (isToday) return 'Today';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
        accessibilityLabel={isCompleted ? 'Mark pending' : 'Mark completed'}
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
              {chore.priority.toUpperCase()}
            </Text>
          </View>

          {chore.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{chore.category}</Text>
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
              <Text style={styles.repeatText}>🔁 {chore.recurrence}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right Column: Assignee Avatar & Delete */}
      <View style={styles.rightColumn}>
        {chore.assignee_name ? (
          <Avatar
            name={chore.assignee_name}
            uri={chore.assignee_avatar || undefined}
            size={30}
          />
        ) : null}

        <Pressable
          onPress={() => onDelete(chore.id)}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel="Delete chore"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: '#FAFAFD',
    borderColor: '#EFEFF5',
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
    backgroundColor: '#FFFFFF',
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
    color: '#1E1B2E',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#8A879A',
  },
  description: {
    fontSize: 13,
    color: '#757288',
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateIcon: {
    fontSize: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  repeatBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  repeatText: {
    fontSize: 11,
    color: '#6B21A8',
    fontWeight: '600',
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 14,
  },
});
