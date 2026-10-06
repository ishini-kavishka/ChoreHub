import { translateFeedback } from '@/i18n/translations';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { adminComponent04Service, Household } from '@/services/adminComponent04Service';
import { familyService } from '@/services/familyService';
import { notificationService } from '@/services/notificationService';
import { ApiError } from '@/services/api';
import { authService } from '@/services/authService';
import { subscribeSession } from '@/services/authStorage';

export const purple = '#7C5CFC';
export function useAdminColors() {
  const { colors, theme } = useAppTheme();
  return { bg: colors.background, card: colors.card, text: colors.textPrimary, muted: colors.textSecondary, soft: colors.surface, accent: theme === 'dark' ? '#BEABFF' : '#6340D4', border: colors.border, error: colors.error, isDark: colors.isDark };
}
export function Action({ label, onPress, selected, disabled = false, tone }: { label: string; onPress: () => void; selected?: boolean; disabled?: boolean; tone?: 'primary' | 'danger' }) {
  const c = useAdminColors();
  const filled = selected || tone === 'primary';
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.action, { backgroundColor: tone === 'danger' ? (c.isDark ? c.soft : '#FEF2F2') : filled ? c.accent : c.soft, opacity: disabled ? .45 : pressed ? .75 : 1 }]}>
    <Text style={{ color: tone === 'danger' ? c.error : filled ? (c.isDark ? '#211C35' : '#fff') : c.accent, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
  </Pressable>;
}
export function Card({ children }: { children: React.ReactNode }) {
  const c = useAdminColors();
  return <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>;
}
export function Label({ children, muted = false, heading = false }: { children: React.ReactNode; muted?: boolean; heading?: boolean }) {
  const c = useAdminColors();
  return <Text style={{ color: muted ? c.muted : c.text, fontSize: heading ? 18 : 14, fontWeight: heading ? '700' : '400', lineHeight: heading ? 26 : 21 }}>{children}</Text>;
}
export function AdminGate({ children }: { children: (household: Household) => React.ReactNode }) {
  const { t } = useLanguage(); const c = useAdminColors();
  const params = useLocalSearchParams<{ family_id?: string }>();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selected, setSelected] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(true);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const result = await adminComponent04Service.context();
      setHouseholds(result.households);
    } catch (e) {
      try {
        const myFam = await familyService.getMyFamily();
        if (myFam?.family) {
          setHouseholds([{ id: myFam.family.id, name: myFam.family.name }]);
          return;
        }
      } catch {}
      setHouseholds([]);
      setError(e instanceof ApiError && [401, 403].includes(e.status || 0) ? 'denied' : 'load');
    } finally {
      setBusy(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const household = households.find(h => h.id === (selected || params.family_id)) || households[0];
  if (busy || !household) return <SafeAreaView style={[s.fill, { backgroundColor: c.bg }]}><View style={s.center}>
    {busy ? <ActivityIndicator color={purple} /> : (
      <View style={{ gap: 14, maxWidth: 440, alignItems: 'center' }}>
        <Label heading>{t(error === 'denied' ? 'admin_denied' : 'admin_error')}</Label>
        {error === 'denied' && (
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
            {t('ag_admin_tip')}
          </Text>
        )}
        <View style={s.wrap}>
          <Action label={t('admin_retry')} onPress={() => void load()} />
          <Action label={t('ag_sign_in')} onPress={() => router.replace('/auth/login')} />
          <Action label={t('admin_back')} onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')} />
        </View>
      </View>
    )}
  </View></SafeAreaView>;
  return <View style={[s.fill, { backgroundColor: c.bg }]}>
    {households.length > 1 && <ScrollView style={{ maxHeight: 144, flexGrow: 0 }} contentContainerStyle={s.selector} keyboardShouldPersistTaps="handled">{households.map(h => <Action key={h.id} label={h.name} selected={h.id === household.id} onPress={() => setSelected(h.id)} />)}</ScrollView>}
    <React.Fragment key={household.id}>{children(household)}</React.Fragment>
  </View>;
}
// Settings route ownership comes from the authenticated session, never a query
// parameter or a shared screen's visual style.
export function AdminSettingsGate({ children }: { children: (household: Household) => React.ReactNode }) {
  const c = useAdminColors();
  const [allowed, setAllowed] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    let generation = 0;
    const check = () => {
      const request = ++generation;
      setAllowed(false);
      void authService.getCurrentMember().then(user => {
        if (!active || request !== generation) return;
        if (!user) router.replace('/auth/login');
        else if (user.role !== 'admin') router.replace('/home/settings');
        else setAllowed(true);
      }).catch(() => { if (active && request === generation) router.replace('/auth/login'); });
    };
    check();
    const unsubscribe = subscribeSession(check);
    return () => { active = false; unsubscribe(); };
  }, []));
  return allowed ? <AdminGate>{children}</AdminGate> : <View style={[s.fill, s.center, { backgroundColor: c.bg }]}><ActivityIndicator color={c.accent} /></View>;
}
export function AdminPage({ title, household, busy, error, refresh, children, compactHeader = false, showNotificationBell = true, onBack }: {
  title: string; household: Household; busy: boolean; error: string; refresh: () => void; children: React.ReactNode; compactHeader?: boolean; showNotificationBell?: boolean; onBack?: () => void;
}) {
  const c = useAdminColors(); const { t } = useLanguage(); const [unread, setUnread] = useState<number | null>(null);
  useEffect(() => { if (!showNotificationBell || compactHeader) return; const off = notificationService.subscribeUnreadCount(setUnread); return () => { off(); }; }, [showNotificationBell, compactHeader]);
  useFocusEffect(useCallback(() => {
    if (!showNotificationBell || compactHeader) return;
    let active = true;
    const update = () => { void notificationService.getUnreadCount(true).then(n => { if (active) setUnread(n); }).catch(() => { if (active) setUnread(null); }); };
    update(); const timer = setInterval(update, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [showNotificationBell, compactHeader]));
  return <SafeAreaView edges={['top', 'left', 'right']} style={[s.fill, { backgroundColor: c.bg }]}>
    <View style={[s.header, { borderColor: c.border }]}>
      <Pressable style={s.icon} accessibilityRole="button" accessibilityLabel={t('admin_back')} onPress={onBack || (() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard'))}><Ionicons name="arrow-back" size={23} color={c.accent} /></Pressable>
      <View style={{ flex: 1, alignItems: compactHeader ? 'center' : 'flex-start' }}><Label heading>{title}</Label>{!compactHeader && <Label muted>{household.name}</Label>}</View>
      {compactHeader ? <View style={s.icon} /> : showNotificationBell ? <Pressable style={s.icon} accessibilityRole="button" accessibilityLabel={`${t('notifications')}${unread === null ? '' : `, ${t('filter_unread')} ${unread}`}`} onPress={() => router.push({ pathname: '/admin/notifications', params: { family_id: household.id } })}>
        <Ionicons name="notifications-outline" size={24} color={c.accent} />
        {!!unread && <View style={s.badge}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{unread > 99 ? '99+' : unread}</Text></View>}
      </Pressable> : null}
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh} tintColor={purple} />}>
      {!!error && <Card><Text accessibilityRole="alert" style={{ color: c.error }}>{translateFeedback(error, t)}</Text><Action label={t('admin_retry')} onPress={refresh} /></Card>}
      {busy && <ActivityIndicator color={purple} accessibilityLabel={t('admin_progress')} />}
      {children}
    </ScrollView>
  </SafeAreaView>;
}
export const s = StyleSheet.create({
  fill: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
  icon: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 18, borderRadius: 12, padding: 3, backgroundColor: '#6340D4', alignItems: 'center' },
  body: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 18, paddingBottom: 36, gap: 16 },
  card: { borderRadius: 20, padding: 18, gap: 14, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { minHeight: 44, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 13, justifyContent: 'center' },
  selector: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  input: { minHeight: 48, borderWidth: 1, padding: 12, borderRadius: 12, fontSize: 16 },
});
