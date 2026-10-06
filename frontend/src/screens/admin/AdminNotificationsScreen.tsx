import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { notificationService, AppNotification } from '@/services/notificationService';
import { Household, adminComponent04Service } from '@/services/adminComponent04Service';
import { familyService } from '@/services/familyService';
import { useAdminColors } from './AdminComponent04Shared';
import { ApiError } from '@/services/api';
import { notificationDisplay } from '@/i18n/clientTranslations';

// ─── Category predicates ────────────────────────────────────────────────────

export const isReminder = (n: AppNotification) =>
  n.type === 'chore_reminder' || n.type === 'reminder_due' || n.type === 'personal_reminder';

const isUpdate = (n: AppNotification) =>
  !isReminder(n) && n.type !== 'info';

// ─── Icon config per type ────────────────────────────────────────────────────

type IconConfig = {
  name: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  bgColorDark: string;
};

function getIconConfig(type: AppNotification['type'], dark: boolean): IconConfig {
  switch (type) {
    case 'chore_reminder':
    case 'reminder_due':
    case 'personal_reminder':
      return { name: 'alarm', iconColor: '#FFFFFF', bgColor: '#F59E0B', bgColorDark: '#B45309' };
    case 'chore_completed':
      return { name: 'checkmark-circle', iconColor: '#FFFFFF', bgColor: '#22C55E', bgColorDark: '#166534' };
    case 'client_chore_message':
      return { name:'chatbubble',iconColor:'#FFFFFF',bgColor:'#8B5CF6',bgColorDark:'#6D28D9' };
    case 'chore_assigned':
      return { name: 'clipboard', iconColor: '#FFFFFF', bgColor: '#8B5CF6', bgColorDark: '#6D28D9' };
    case 'family_update':
      return { name: 'person-add', iconColor: '#FFFFFF', bgColor: '#7C3AED', bgColorDark: '#5B21B6' };
    case 'weekly_progress':
      return { name: 'bar-chart', iconColor: '#FFFFFF', bgColor: '#6340D4', bgColorDark: '#4C1D95' };
    case 'announcement':
      return { name: 'megaphone', iconColor: '#FFFFFF', bgColor: '#0EA5E9', bgColorDark: '#0369A1' };
    default:
      return { name: 'notifications', iconColor: '#FFFFFF', bgColor: '#9CA3AF', bgColorDark: '#4B5563' };
  }
}

// ─── Relative time formatting ────────────────────────────────────────────────

function relativeTime(iso: string, language: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (typeof Intl.RelativeTimeFormat === 'function') {
    const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    if (minutes < 2) return format.format(0, 'minute');
    if (minutes < 60) return format.format(-minutes, 'minute');
    if (hours < 24) return format.format(-hours, 'hour');
    if (days < 7) return format.format(-days, 'day');
  }
  return new Date(iso).toLocaleDateString(language, { month: 'short', day: 'numeric' });
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function AdminNotificationsScreen() {
  const [household, setHousehold] = useState<Household | null>(null);
  const params = useLocalSearchParams<{ family_id?: string }>();

  useEffect(() => {
    adminComponent04Service
      .context()
      .then((res) => {
        if (res.households?.length) setHousehold(res.households.find(h => h.id === params.family_id) || res.households[0]);
      })
      .catch(() => {
        familyService
          .getMyFamily()
          .then((res) => {
            if (res.family) setHousehold({ id: res.family.id, name: res.family.name });
          })
          .catch(() => {});
      });
  }, [params.family_id]);

  return <Notifications household={household} />;
}

// ─── Main notifications component ────────────────────────────────────────────

function Notifications({ household }: { household: Household | null }) {
  const [deleteTarget,setDeleteTarget]=useState<AppNotification|null>(null);
  const [deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState('');
  const deleteLock=useRef(false),generation=useRef(0);

  const { t, language } = useLanguage();
  const c = useAdminColors();
  const dark = c.bg === '#14121F';

  const [items, setItems] = useState<AppNotification[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [category, setCategory] = useState<'all' | 'reminders' | 'updates'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const loaded = useRef(false);
  const loading = useRef(false);
  const active = useRef(false);
  const showError = useCallback((e: unknown, saving = false) => {
    console.warn('Admin notification request failed', e);
    setError(e instanceof ApiError && [401, 403].includes(e.status || 0) ? t('admin_denied') : t(saving ? 'admin_save_error' : 'admin_error'));
  }, [t]);

  // ── Load notifications ──────────────────────────────────────────────────
  const load = useCallback(async (background = false) => {
    if (loading.current) return;
    loading.current = true;
    const version=++generation.current;
    if (!background) setBusy(true);
    try {
      const result = await notificationService.getNotifications('all', true);
      if (active.current && version===generation.current) { setItems(result); setError(''); loaded.current = true; }
    } catch (e) {
      if (active.current) showError(e);
    } finally {
      loading.current = false;
      if (active.current) setBusy(false);
    }
  }, [showError]);

  useFocusEffect(useCallback(() => {
    active.current = true;
    void load(!loaded.current ? false : true);
    const timer = setInterval(() => void load(true), 30_000);
    return () => { active.current = false; clearInterval(timer); };
  }, [load]));

  // ── Derived counts ──────────────────────────────────────────────────────
  const allCount = items.filter((n) => !unreadOnly || !n.is_read).length;
  const updateCount = items.filter((n) => isUpdate(n) && (!unreadOnly || !n.is_read)).length;

  const filtered = items.filter(
    (n) =>
      (category === 'all' || (category === 'reminders' ? isReminder(n) : isUpdate(n))) &&
      (!unreadOnly || !n.is_read)
  );

  // ── Tap a notification ──────────────────────────────────────────────────
  const open = async (n: AppNotification) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (!n.is_read) {
        await notificationService.markRead(n.id, true);
        generation.current++;
        setItems((old) => old.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      }
      if (n.type === 'client_chore_message') return;
      else if (n.type === 'weekly_progress')
        router.push({ pathname: '/admin/progress', params: household ? { family_id: household.id } : undefined });
      else if (n.type === 'family_update') router.push('/admin/members');
      else if (n.type === 'announcement')
        router.push({ pathname: '/admin/announcements', params: household ? { family_id: household.id } : undefined });
      else if (isReminder(n)) router.push('/admin/reminders');
      else setNotice(t('admin_no_link'));
    } catch (e) {
      showError(e, true);
    } finally {
      setSaving(false);
    }
  };

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAll = () => {
    setSaving(true);
    setError('');
    void notificationService
      .markAllRead(true)
      .then(() => { generation.current++; setItems((old) => old.map((x) => ({ ...x, is_read: true }))); })
      .catch(e => showError(e, true))
      .finally(() => setSaving(false));
  };

  const removeMessage = async () => {
    if (!deleteTarget || deleteLock.current) return;
    deleteLock.current=true; setDeleting(true); setDeleteError('');
    try {
      await notificationService.deleteNotification(deleteTarget.id,true);
      generation.current++;
      setItems(old=>old.filter(n=>n.id!==deleteTarget.id)); setDeleteTarget(null);
    } catch { setDeleteError(t('pm_delete_error')); }
    finally { deleteLock.current=false; setDeleting(false); }
  };
  const hasUnread = items.some((n) => !n.is_read);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: c.bg }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('admin_back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/dashboard'))}
        >
          <Ionicons name="arrow-back" size={22} color={c.accent} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: c.text }]}>{t('notifications')}</Text>

        <Pressable style={styles.backBtn} accessibilityRole="button" accessibilityLabel={t('crud_retry')} disabled={busy || saving} onPress={() => void load()}>
          <Ionicons name="refresh-outline" size={21} color={c.accent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { maxWidth: 680, alignSelf: 'center', width: '100%' }]}
        refreshControl={
          <RefreshControl refreshing={busy} onRefresh={() => void load()} tintColor={c.accent} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Quick actions row ───────────────────────────────────────── */}
        <Text style={[styles.subtitle, { color: c.muted }]}>{t('notifications_subtitle')}</Text>

        {/* ── Filter chips ────────────────────────────────────────────── */}
        <View style={styles.chipRow}>
          {(
            [
              { key: 'all', label: t('filter_all'), count: allCount },
              { key: 'updates', label: t('admin_updates'), count: updateCount },
            ] as const
          ).map(({ key, label, count }) => {
            const active = category === key;
            return (
              <Pressable
                key={key}
                onPress={() => setCategory(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: active ? c.accent : c.soft,
                    borderColor: active ? c.accent : c.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? (dark ? '#211C35' : '#FFFFFF') : c.accent },
                  ]}
                >
                  {label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Controls row (unread toggle + mark all read) ────────────── */}
        <View style={styles.controlsRow}>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: c.muted }]}>{t('filter_unread')}</Text>
            <Switch
              value={unreadOnly}
              onValueChange={setUnreadOnly}
              trackColor={{ false: c.border, true: c.accent }}
              thumbColor="#FFFFFF"
              accessibilityLabel={t('filter_unread')}
            />
          </View>

          {hasUnread && (
            <Pressable
              style={({ pressed }) => [
                styles.markAllBtn,
                { backgroundColor: c.soft, opacity: pressed || saving ? 0.65 : 1 },
              ]}
              disabled={saving || busy}
              onPress={markAll}
              accessibilityRole="button"
              accessibilityLabel={t('mark_all_read')}
            >
              <Ionicons name="checkmark-done" size={14} color={c.accent} />
              <Text style={[styles.markAllText, { color: c.accent }]}>
                {saving ? t('admin_saving') : t('mark_all_read')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Notice / error banners ──────────────────────────────────── */}
        {!!notice && (
          <View style={[styles.banner, { backgroundColor: dark ? '#1A3A1A' : '#ECFDF5', borderColor: '#22C55E' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
            <Text style={[styles.bannerText, { color: dark ? '#76DEBB' : '#15803D' }]}>{notice}</Text>
          </View>
        )}
        {!!error && (
          <View style={[styles.banner, { backgroundColor: dark ? '#3A1A1A' : '#FEF2F2', borderColor: '#EF4444' }]}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={[styles.bannerText, { color: dark ? '#FFAAA8' : '#DC2626' }]}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retryBtn}>
              <Text style={{ color: c.accent, fontWeight: '700', fontSize: 13 }}>{t('admin_retry')}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {busy && !loaded.current && <ActivityIndicator accessibilityLabel={t('loading')} color={c.accent} style={{ marginVertical: 24 }} />}

        {/* ── Empty state ─────────────────────────────────────────────── */}
        {!busy && !error && filtered.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="notifications-off-outline" size={40} color={c.muted} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>{t('no_notifications')}</Text>
            <Text style={[styles.emptySubtitle, { color: c.muted }]}>
              {t('crud_empty')}
            </Text>
          </View>
        )}

        {/* ── Notification list ────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <View style={[styles.listCard, { backgroundColor: c.card, borderColor: c.border }]}>
            {filtered.map((n, i) => {
              const cfg = getIconConfig(n.type, dark);
              const isLast = i === filtered.length - 1;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => void open(n)}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={`${notificationDisplay(n, t).title}. ${n.is_read ? t('admin_read') : t('filter_unread')}.`}
                  style={({ pressed }) => [
                    styles.notifRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: c.border },
                    !n.is_read && { backgroundColor: dark ? '#1E1A30' : '#F5F2FF' },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  {/* Colored circular icon */}
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: dark ? cfg.bgColorDark : cfg.bgColor },
                    ]}
                  >
                    <Ionicons name={cfg.name} size={18} color={cfg.iconColor} />
                  </View>

                  {/* Content */}
                  <View style={styles.notifContent}>
                    <Text
                      style={[
                        styles.notifTitle,
                        { color: c.text, fontWeight: n.is_read ? '500' : '700' },
                      ]}
                    >
                      {notificationDisplay(n, t).title}
                    </Text>
                    {n.type==='client_chore_message' && <View style={{gap:4,marginTop:6}}>
                      <Text style={{color:c.muted}}>{t('pm_from')}: {n.sender_name || t('role_member')}</Text>
                      <Text style={{color:c.muted}}>{t('pm_chore')}: {n.chore_title || t('not_set')}</Text>
                      {n.chore_due_date && <Text style={{color:c.muted}}>{t('pm_assigned_time')}: {new Date(n.chore_due_date).toLocaleString(language)}</Text>}
                    </View>}
                    <Text style={[styles.notifMessage, { color: c.muted }]}>
                      {notificationDisplay(n, t).message}
                    </Text>
                    <Text style={[styles.notifTime, { color: c.muted }]}>{n.type==='client_chore_message' ? t('pm_sent_at')+': '+new Date(n.created_at).toLocaleString(language) : relativeTime(n.created_at, language)}</Text>
                  </View>

                  {/* Right side: relative time + unread dot */}
                  <View style={styles.notifRight}>
                    {n.type==='client_chore_message' && <Pressable accessibilityRole="button" accessibilityLabel={t('delete')+': '+(n.sender_name || n.title)} disabled={deleting} onPress={e=>{e.stopPropagation();setDeleteError('');setDeleteTarget(n);}} style={{padding:10}}><Ionicons name="trash-outline" size={20} color={c.accent}/></Pressable>}
                    {!n.is_read && (
                      <View style={[styles.unreadDot, { backgroundColor: c.accent }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Footer caption ───────────────────────────────────────────── */}
        {!busy && items.length > 0 && (
          <Text style={[styles.footerCaption, { color: c.muted }]}>
            {t('admin_latest')}
          </Text>
        )}
      </ScrollView>
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={()=>{if(!deleteLock.current)setDeleteTarget(null);}}>
        <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'rgba(0,0,0,.4)'}}>
          <View style={{maxWidth:440,width:'100%',alignSelf:'center',padding:24,gap:16,borderRadius:24,backgroundColor:c.card}}>
            <Text style={{fontSize:20,fontWeight:'700',color:c.text}}>{t('pm_delete_title')}</Text>
            <Text style={{color:c.muted}}>{t('pm_delete_body')}</Text>
            {!!deleteError && <Text accessibilityRole="alert" style={{color:c.error}}>{deleteError}</Text>}
            <View style={{flexDirection:'row',justifyContent:'flex-end',gap:12}}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('cancel')} disabled={deleting} onPress={()=>setDeleteTarget(null)} style={[styles.chip,{backgroundColor:c.soft,borderColor:c.border}]}><Text style={{color:c.accent}}>{t('cancel')}</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t('delete')} disabled={deleting} onPress={()=>void removeMessage()} style={[styles.chip,{backgroundColor:c.accent,borderColor:c.accent}]}>{deleting?<ActivityIndicator color="#fff"/>:<Text style={{color:dark?'#211C35':'#fff'}}>{t('delete')}</Text>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  // Body
  body: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  subtitle: { fontSize: 14, lineHeight: 21 },
  // Quick action pills
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickPill: {
    flexGrow: 1,
    flexBasis: 210,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickPillText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  // Filter chips
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Banners
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 6,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    gap: 10,
    padding: 36,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Notification list card
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  notifContent: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  notifTitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 19,
  },
  notifRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
    marginTop: 2,
  },
  notifTime: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  footerCaption: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
