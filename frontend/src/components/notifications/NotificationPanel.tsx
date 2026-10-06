import { translateFeedback } from '@/i18n/translations';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { notificationDisplay } from '@/i18n/clientTranslations';
import { useLanguage } from '@/context/LanguageContext';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, AppNotification } from '@/services/notificationService';

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationPanel({
  visible,
  onClose,
  onUnreadCountChange,
}: NotificationPanelProps) {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setError('');
    try {
      const data = await notificationService.getNotifications(filter);
      setItems(data);
      const unread = data.filter((n) => !n.is_read).length;
      if (onUnreadCountChange) onUnreadCountChange(unread);
    } catch (err) {
      setError(t('admin_error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, onUnreadCountChange, t]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      await notificationService.markRead(id);
      loadNotifications();
    } catch {
      loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
      await notificationService.markAllRead();
      loadNotifications();
    } catch {
      loadNotifications();
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'chore_completed':
        return { name: 'checkmark-circle' as const, color: '#10B981', bg: (themeColors.isDark ? themeColors.surface : '#DCFCE7') };
      case 'chore_assigned':
        return { name: 'clipboard' as const, color: '#2563EB', bg: (themeColors.isDark ? themeColors.surface : '#DBEAFE') };
      case 'chore_reminder':
        return { name: 'alarm' as const, color: '#713DE8', bg: (themeColors.isDark ? themeColors.surface : '#EDE9FE') };
      case 'weekly_progress':
        return { name: 'stats-chart' as const, color: '#F59E0B', bg: (themeColors.isDark ? themeColors.surface : '#FEF3C7') };
      default:
        return { name: 'notifications' as const, color: '#713DE8', bg: (themeColors.isDark ? themeColors.surface : '#EDE9FE') };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return t('ui_just_now');
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('ui_just_now');
    if (diffMins < 60) return t('ui_count_minutes_ago').replace('{count}', String(diffMins));
    if (diffHours < 24) return t('ui_count_hours_ago').replace('{count}', String(diffHours));
    if (diffDays === 1) return t('yesterday');
    return t('ui_count_days_ago').replace('{count}', String(diffDays));
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop pressable */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Panel Sheet */}
        <View style={styles.panelContainer}>
          {/* Sheet Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>{t('notifications_title')}</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}{' '}{t('ui_new')}</Text>
                </View>
              )}
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
            </Pressable>
          </View>

          {/* Action Row & Chips */}
          <View style={styles.subHeaderRow}>
            {/* Filter Chips */}
            <View style={styles.chipsRow}>
              {(['all', 'unread', 'read'] as const).map((chip) => (
                <Pressable
                  key={chip}
                  onPress={() => setFilter(chip)}
                  style={[styles.chipPill, filter === chip && styles.chipPillSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filter === chip && styles.chipTextSelected,
                    ]}
                  >
                    {chip === 'all'
                      ? t('filter_all')
                      : chip === 'unread'
                      ? t('filter_unread')
                      : t('filter_read')}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
                <Ionicons name="checkmark-done" size={14} color="#713DE8" />
                <Text style={styles.markAllText}>{t('mark_all_read')}</Text>
              </Pressable>
            )}
          </View>

          {/* Notifications List */}
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#713DE8"
                colors={['#713DE8']}
              />
            }
          >
            {loading ? (
              <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
            ) : error ? (
              <Text style={styles.errorText}>{translateFeedback(error, t)}</Text>
            ) : items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🔔</Text>
                <Text style={styles.emptyTitle}>{t('no_notifications')}</Text>
                <Text style={styles.emptySubtitle}>{t('ui_you_re_all_caught_up')}</Text>
              </View>
            ) : (
              items.map((item) => {
                const iconInfo = getNotificationIcon(item.type);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleMarkRead(item.id, item.is_read)}
                    style={({ pressed }) => [
                      styles.notificationCard,
                      !item.is_read && styles.unreadCardBg,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    {/* Type Icon */}
                    <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
                    </View>

                    {/* Text Body */}
                    <View style={styles.cardTextGroup}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>{notificationDisplay(item, t).title}</Text>
                        <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
                      </View>
                      <Text style={styles.cardMessage}>{notificationDisplay(item, t).message}</Text>
                    </View>

                    {/* Unread indicator dot */}
                    {!item.is_read && <View style={styles.unreadDot} />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 29, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  panelContainer: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    minHeight: '50%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: '#1E1B2E',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EAE7F5'),
    alignSelf: 'center',
    marginBottom: 12,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    letterSpacing: -0.3,
  },
  unreadBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#713DE8',
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
  },

  // SubHeader & Chips
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chipPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'),
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
  },
  chipPillSelected: {
    backgroundColor: '#713DE8',
    borderColor: '#713DE8',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#713DE8',
  },

  // List
  listContent: {
    paddingBottom: 20,
    gap: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'),
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
  },
  unreadCardBg: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F5F3FF'),
    borderColor: (themeColors.isDark ? themeColors.border : '#DDD6FE'),
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextGroup: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  timeAgo: {
    fontSize: 11,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  cardMessage: {
    fontSize: 13,
    fontWeight: '500',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#713DE8',
    marginTop: 4,
  },

  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  emptySubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  errorText: {
    color: (themeColors.isDark ? themeColors.error : '#EF4444'),
    textAlign: 'center',
    marginTop: 16,
  },
});
