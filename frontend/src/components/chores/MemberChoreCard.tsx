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
  const isCompleted = chore.status === 'completed';

  const getPriorityStyle = () => {
    switch (chore.priority) {
      case 'high':
        return { badge: styles.highPriorityBadge, text: styles.highPriorityText, label: 'High' };
      case 'low':
        return { badge: styles.lowPriorityBadge, text: styles.lowPriorityText, label: 'Low' };
      default:
        return { badge: styles.mediumPriorityBadge, text: styles.mediumPriorityText, label: 'Medium' };
    }
  };

  const priorityStyle = getPriorityStyle();

  const formattedDate = chore.due_date
    ? new Date(chore.due_date).toLocaleDateString('en-US', {
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
            <Text style={styles.categoryTag}>• {chore.category}</Text>
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
              {chore.recurrence.charAt(0).toUpperCase() + chore.recurrence.slice(1)}
            </Text>
          </View>
        ) : null}

        {chore.creator_name ? (
          <View style={styles.tag}>
            <Text style={styles.tagIcon}>👤</Text>
            <Text style={styles.tagText}>By {chore.creator_name}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions row: View Details & Mark Complete */}
      <View style={styles.footerRow}>
        {onViewDetails ? (
          <Pressable onPress={() => onViewDetails(chore)} style={styles.detailsButton}>
            <Text style={styles.detailsText}>View Details</Text>
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
            {isCompleted ? 'Completed' : 'Mark Completed'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  completedCard: {
    backgroundColor: '#FAFAFD',
    borderColor: '#F0EDF9',
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
    color: '#1E1B2E',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9592A6',
  },
  categoryTag: {
    fontSize: 12,
    color: '#757288',
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  highPriorityBadge: { backgroundColor: '#FEE2E2' },
  highPriorityText: { color: '#EF4444' },
  mediumPriorityBadge: { backgroundColor: '#FEF3C7' },
  mediumPriorityText: { color: '#D97706' },
  lowPriorityBadge: { backgroundColor: '#E0E7FF' },
  lowPriorityText: { color: '#4F46E5' },
  priorityText: { fontSize: 11, fontWeight: '800' },
  description: {
    fontSize: 13,
    color: '#656276',
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
    backgroundColor: '#F4F2FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  tagIcon: { fontSize: 11 },
  tagText: { fontSize: 11, color: '#656276', fontWeight: '600' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F2FA',
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
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  completeIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
