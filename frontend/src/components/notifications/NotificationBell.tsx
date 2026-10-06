import React, { useCallback, useSyncExternalStore } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { notificationService, isDemoNotificationMode } from '@/services/notificationService';
import { subscribeSession } from '@/services/authStorage';

// One live subscription and polling loop, even when Expo keeps multiple tabs mounted.
let unread = 0, generation = 0, refreshedAt = 0;
let pending: Promise<void> | undefined;
const listeners = new Set<() => void>();
let stop: (() => void) | undefined;
function publish(value: number) {
  unread = Math.max(0, value);
  listeners.forEach(listener => listener());
}
export function refreshMemberUnread(force = false) {
  if (!force && Date.now() - refreshedAt < 1000) return Promise.resolve();
  if (pending) return pending;
  const version = generation;
  const request = notificationService.getUnreadCount(true).then(count => {
    if (version === generation && listeners.size > 0) { refreshedAt = Date.now(); publish(count); }
  }).catch(() => { /* Preserve the last live count on failure. */ });
  pending = request;
  void request.finally(() => { if (pending === request) pending = undefined; });
  return request;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    const unsubscribe = notificationService.subscribeUnreadCount(count => {
      if (!isDemoNotificationMode()) { generation++; refreshedAt = Date.now(); publish(count); }
    });
    const session = subscribeSession(() => { generation++; refreshedAt = 0; pending = undefined; publish(0); void refreshMemberUnread(); });
    const timer = setInterval(() => {
      if (!AppState?.currentState || AppState.currentState === 'active') void refreshMemberUnread();
    }, 30_000);
    const foreground = AppState?.addEventListener('change', state => { if (state === 'active') void refreshMemberUnread(); });
    stop = () => { unsubscribe(); session(); clearInterval(timer); foreground?.remove(); generation++; refreshedAt = 0; pending = undefined; unread = 0; };
    void refreshMemberUnread();
  }
  return () => { listeners.delete(listener); if (!listeners.size) { stop?.(); stop = undefined; } };
}
export function useMemberUnreadCount() {
  const count = useSyncExternalStore(subscribe, () => unread, () => 0);
  useFocusEffect(useCallback(() => { void refreshMemberUnread(); }, []));
  return count;
}
export function NotificationBell({ returnTo = '/home' }: { returnTo?: string }) {
  const count = useMemberUnreadCount();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  return <Pressable accessibilityRole="button" accessibilityLabel={t('ui_open_notifications')}
    onPress={() => router.push({ pathname: '/home/notifications', params: { returnTo } })}
    style={({ pressed }) => [styles.bell, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: .7 }]}>
    <Ionicons name="notifications-outline" size={24} color={colors.primary}/>
    {count > 0 && <View style={styles.badge}><Text style={styles.count}>{count}</Text></View>}
  </Pressable>;
}
const styles = StyleSheet.create({
  bell: { width: 40, height: 44, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 1, right: 0, minWidth: 16, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#EF4444' },
  count: { color: '#fff', fontSize: 10, fontWeight: '800', textAlign: 'center' },
});
