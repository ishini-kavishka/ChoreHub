import { subscribeSession } from '@/services/authStorage';
import { NotificationBell, refreshMemberUnread } from '@/components/notifications/NotificationBell';
import { translateFeedback } from '@/i18n/translations';
import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import type { Household } from '@/services/adminComponent04Service';
import { notificationDisplay } from '@/i18n/clientTranslations';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { notificationService, AppNotification, isDemoNotificationMode } from '@/services/notificationService';
import { completedChoresService, CompletedChore } from '@/services/completedChoresService';
import { settingsService, NotificationSettings, settingsDemoMode, UserPreferences } from '@/services/settingsService';
import { useSettingsBack } from '@/hooks/useSettingsBack';

const purple = '#7C5CFC';
const defaultNotifications: NotificationSettings = { chore_reminders:true, chore_completions:true, family_updates:true, announcements:false, reminder_time:'10min' };

export function Component04Screen({ kind, adminFamily }: { kind: 'notifications'|'completed'|'settings'|'notificationSettings'|'preferences'|'about'; adminFamily?: Household }) {
  const settingsChild = kind === 'notificationSettings' || kind === 'preferences' || kind === 'about';
  const settingsBack = useSettingsBack(adminFamily ? '/admin/settings' : '/home/settings', adminFamily?.id, settingsChild);
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const notificationBack = useCallback(() => {
    const allowed = ['/support', '/home', '/home/progress', '/home/notification-settings', '/home/preferences', '/home/about', '/home/completed-chores'];
    const origin = typeof params.returnTo === 'string' && allowed.includes(params.returnTo) ? params.returnTo : undefined;
    if (origin) router.navigate(origin as '/home');
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [params.returnTo]);
  const alert = useAppAlert();
  const themeColors = useClientTheme().colors;
  const baseStyles = useThemedStyles(createS);
  // This component is also used by Admin: apply the redesign to members only.
  const clientStyles = useThemedStyles(createClientS);
  const s = adminFamily ? baseStyles : clientStyles;
  const { theme, preference: themePreference, setTheme, brightness, setBrightness, autoBrightness, setAutoBrightness, colors } = useAppTheme();
  const { t, language, setLanguage } = useLanguage();
  const dark = colors.isDark;
  const bg = colors.background, card = colors.card, fg = colors.textPrimary, muted = colors.textSecondary;
  const [sliderWidth, setSliderWidth] = useState(200);

  // ── Screen data state ──

  const [items, setItems] = useState<AppNotification[]>([]);
  const [chores, setChores] = useState<CompletedChore[]>([]);
  const [filter, setFilter] = useState<'all'|'today'|'week'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notificationNow, setNotificationNow] = useState(() => Date.now());
  const [range, setRange] = useState<'all'|'today'|'week'|'month'>('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(false);
  const [notice, setNotice] = useState('');
  const [notif, setNotif] = useState(defaultNotifications);
  const [prefs, setPrefs] = useState<UserPreferences>({ theme, language });

  // ── Reminder form state (Create / Edit modal) ──
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [formAt, setFormAt] = useState('');
  const [editId, setEditId] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppNotification|null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const saveLock = useRef(false);
  const deleteLock = useRef(false), notificationGeneration = useRef(0);

  const load = useCallback(async (background = false) => {
    if (!background) setBusy(true); setError('');
    try {
      if (kind === 'notifications') {
        const generation = ++notificationGeneration.current;
        const notifications = await notificationService.getNotifications('all', true);
        if (generation === notificationGeneration.current) { setItems(notifications); setDemo(false); if (!adminFamily) void refreshMemberUnread(true); }
      }
      else if (kind === 'completed') { setChores(await completedChoresService.get(range, query, adminFamily?.id)); }
      else if (kind === 'notificationSettings') { setNotif(await settingsService.getNotificationSettings(true)); setDemo(settingsDemoMode); }
      else if (kind === 'preferences') { setPrefs(await settingsService.getPreferences()); setDemo(settingsDemoMode); }
    } catch (e) { setError(t('admin_error')); }
    finally { if (!background) setBusy(false); }
  }, [kind, range, query, adminFamily?.id]);

  useEffect(() => {
    if (kind !== 'notifications' || adminFamily) return;
    return subscribeSession(() => { notificationGeneration.current++; setItems([]); setError(''); });
  }, [kind, adminFamily]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useFocusEffect(useCallback(() => {
    if (kind !== 'notifications' || adminFamily) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { notificationBack(); return true; });
    return () => subscription.remove();
  }, [kind, adminFamily, notificationBack]));
  useFocusEffect(useCallback(() => {
    if (kind !== 'notifications') return;
    setNotificationNow(Date.now());
    const timer = setInterval(() => { setNotificationNow(Date.now()); void load(true); }, 30000);
    return () => clearInterval(timer);
  }, [kind, load]));

  // ── Reminder form helpers ──
  const openCreate = () => { setFormTitle(''); setFormMsg(''); setFormAt(''); setEditId(null); setError(''); setShowForm(true); };
  const openEdit = (n: AppNotification) => {
    setFormTitle(n.title);
    setFormMsg(n.message);
    setFormAt(n.reminder_at ? new Date(n.reminder_at).toISOString().slice(0, 16).replace('T', ' ') : '');
    setEditId(n.id);
    setError('');
    setShowForm(true);
  };
  const saveForm = async () => {
    if (!formTitle.trim()) { setError(t('ui_title_is_required')); return; }
    if (!formMsg.trim()) { setError(t('ui_message_is_required')); return; }
    setSaving(true); setError('');
    try {
      const payload = { title: formTitle.trim(), message: formMsg.trim(), reminder_at: formAt.trim() || undefined };
      if (editId) {
        const updated = await notificationService.updateReminder(editId, payload);
        setItems(prev => prev.map(x => x.id === editId ? updated : x));
      } else {
        const created = await notificationService.createReminder(payload);
        setItems(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (e) { setError(t('admin_error')); }
    finally { setSaving(false); }
  };

  const panel = (children: React.ReactNode) => <View style={[s.panel, { backgroundColor: card }]}>{children}</View>;
  const banner = demo && <Text style={s.demo}>{t('ui_demo_offline_changes_shown_here_are_not_saved_to_the_backend')}</Text>;
  const title = kind==='notifications'?t('notifications'):kind==='completed'?t('completed_chores_title'):kind==='settings'?t('settings_title'):kind==='notificationSettings'?t('notification_settings'):kind==='preferences'?t('preferences_title'):t('about_title');

  // Header — bell icon opens notifications from the other screens.
  const top = (
    <View style={[s.head, adminFamily && settingsChild && { width: '100%', maxWidth: 800, alignSelf: 'center' }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('admin_back')}
        onPress={() => {
          // Settings sub-screens: navigate explicitly back through the settings hierarchy.
          // router.back() does not work correctly here because these screens are all
          // Tabs screens inside the home Tabs navigator — tab switches do not create
          // a stack that router.back() can pop through.
          if (settingsChild) {
            settingsBack();
          } else if (adminFamily) {
            if (router.canGoBack()) router.back();
            else router.navigate('/admin/progress');
          } else if (kind === 'settings') {
            router.navigate('/home/profile' as any);
          } else if (kind === 'notifications') {
            notificationBack();
          } else {
            router.back();
          }
        }}
        style={s.icon}
      >
        <Ionicons name="arrow-back" size={22} color={purple}/>
      </Pressable>
      <Text style={[s.title, { color: fg }]}>{title}</Text>
      {kind === 'notifications' && <Pressable accessibilityRole="button" accessibilityLabel={t('crud_retry')} disabled={busy} onPress={() => void load()} style={s.icon}><Ionicons name="refresh-outline" size={22} color={purple}/></Pressable>}
      {kind !== 'notifications' && (kind !== 'settings' || !!adminFamily) && !(adminFamily && settingsChild) && (adminFamily ?
          <Pressable accessibilityRole="button" accessibilityLabel={t('ui_open_notifications')} onPress={() => router.push(adminFamily ? '/admin/notifications' : '/home/notifications')} style={s.icon}>
            <Ionicons name="notifications-outline" size={22} color={purple}/>
          </Pressable> : <NotificationBell returnTo={{ completed: '/home/completed-chores', notificationSettings: '/home/notification-settings', preferences: '/home/preferences', about: '/home/about', settings: '/home/settings', notifications: '/home/notifications' }[kind]}/>)
      }
    </View>
  );

  const requestDelete = (n: AppNotification) => {
    if (deleteLock.current) return;
    setDeleteError(''); setDeleteTarget(n);
  };
  const confirmDelete = async () => {
    if (!deleteTarget || deleteLock.current) return;
    deleteLock.current = true; setDeleting(true); setDeleteError('');
    try {
      await notificationService.deleteNotification(deleteTarget.id, true);
      // Ignore any list response started before this deletion committed.
      notificationGeneration.current++;
      setItems(previous => previous.filter(n => n.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) { setDeleteError(t('notification_delete_error')); }
    finally { deleteLock.current = false; setDeleting(false); }
  };
  // Calendar weeks start Monday, matching the existing Progress convention.
  // Inbox periods use the device's local timezone and real backend created_at.
  const todayStart = new Date(notificationNow); todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
  const nextWeekStart = new Date(weekStart); nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const inPeriod = (n: AppNotification, period: 'all'|'today'|'week') => {
    if (period === 'all') return true;
    const received = Date.parse(n.created_at);
    return period === 'today'
      ? received >= todayStart.getTime() && received < tomorrowStart.getTime()
      : received >= weekStart.getTime() && received < nextWeekStart.getTime();
  };
  const todayCount = items.filter(n => inPeriod(n, 'today')).length;
  const weekCount = items.filter(n => inPeriod(n, 'week')).length;
  const visibleNotifications = items.filter(n => inPeriod(n, filter) && (!unreadOnly || !n.is_read));
  const timestamp = (value: string) => {
    const date = new Date(value); if (Number.isNaN(date.getTime())) return '';
    const elapsed = Math.max(0, Date.now() - date.getTime());
    if (typeof Intl.RelativeTimeFormat === 'function' && elapsed < 7 * 86400000) {
      const unit = elapsed < 3600000 ? 'minute' : elapsed < 86400000 ? 'hour' : 'day';
      const divisor = unit === 'minute' ? 60000 : unit === 'hour' ? 3600000 : 86400000;
      return new Intl.RelativeTimeFormat(language, { numeric:'auto' }).format(-Math.floor(elapsed / divisor), unit);
    }
    return date.toLocaleString(language);
  };

  // Existing long-press editing remains available; delete uses the same explicit confirmation.
  const handleLongPress = (n: AppNotification) => {
    const isPersonal = n.type === 'personal_reminder';
    alert(
      isPersonal ? t('ui_reminder_options') : t('ui_notification'),
      isPersonal ? t('ui_choose_an_action') : t('ui_remove_this_notification'),
      [
        ...(isPersonal ? [{ text: t('edit'), onPress: () => openEdit(n) }] : []),
        { text: t('delete'), style: 'destructive', onPress: () => requestDelete(n) },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
  };

  let content: React.ReactNode;

  if (kind === 'notifications') content = (
    <>
      {banner}
      <Text style={[s.subtitle, { color: muted }]}>{t('notifications_subtitle')}</Text>
      <View style={s.chips}><Pressable accessibilityRole="button" accessibilityLabel={t('my_reminders')} onPress={() => router.push('/home/reminders')} style={[s.chip, { backgroundColor:colors.surface, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
        <Ionicons name="alarm-outline" size={20} color={purple}/><Text style={{ color: purple, fontWeight: '700' }}>{t('my_reminders')}</Text>
      </Pressable></View>
      {adminFamily && <Pressable accessibilityRole="button" accessibilityLabel={t('mark_all_read')} style={s.primary} onPress={async () => { try { await notificationService.markAllRead(true); setItems(previous => previous.map(n => ({ ...n, is_read: true }))); } catch (e) { setError(t('admin_error')); } }}>
        <Text style={s.primaryText}>{t('mark_all_read')}</Text>
      </Pressable>}
      <View style={s.chips}>
        {(['all','today','week'] as const).map(v => (
          <Pressable key={v} accessibilityRole="button" accessibilityLabel={t(v==='all'?'filter_all':v==='today'?'filter_today':'filter_week')} accessibilityState={{selected:filter===v}} onPress={() => setFilter(v)} style={[s.chip,{backgroundColor:filter===v?purple:colors.surface}]}>
            <Text style={{ color: filter===v ? '#fff' : fg }}>{t(v==='all'?'filter_all':v==='today'?'filter_today':'filter_week')} ({v==='all'?items.length:v==='today'?todayCount:weekCount})</Text>
          </Pressable>
        ))}
      </View>
      <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Text style={{color:muted}}>{t('filter_unread')} ({items.filter(n=>!n.is_read).length})</Text><Switch accessibilityLabel={t('filter_unread')} value={unreadOnly} onValueChange={setUnreadOnly} trackColor={{false:colors.border,true:purple}} thumbColor={unreadOnly?colors.primary:colors.card}/></View>
      {busy ? <ActivityIndicator color={purple}/> : visibleNotifications.length===0 ? panel(<View style={{ alignItems:'center', gap:8, paddingVertical:12 }}><Ionicons name="notifications-off-outline" size={32} color={purple}/><Text style={[s.rowTitle,{color:fg}]}>{t(items.length?'notification_no_matches':'notification_empty')}</Text><Text style={{color:muted}}>{t(items.length?'crud_empty':'notification_caught_up')}</Text></View>) : visibleNotifications.map(n => (
        <View key={n.id} style={[s.panel, { backgroundColor: card }]}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
              <Pressable
          accessibilityRole="button" accessibilityLabel={`${notificationDisplay(n,t).title}. ${t(n.is_read?'filter_read':'filter_unread')}.`}
          onPress={async () => { if (!n.is_read) { try { await notificationService.markRead(n.id, true); setItems(previous => previous.map(x => x.id===n.id ? { ...x, is_read:true } : x)); } catch (e) { setError(t('admin_error')); } } }}
          onLongPress={() => handleLongPress(n)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
              <Ionicons
                name={n.type==='chore_completed' ? 'checkmark-circle' : n.type==='personal_reminder' ? 'alarm' : 'notifications'}
                size={24}
                color={n.type==='chore_completed' ? '#22C55E' : purple}
              />
              <View style={{ flex:1 }}>
                <Text style={[s.rowTitle, { color:fg }]}>{notificationDisplay(n, t).title}</Text>
                <Text style={{ color:muted }}>{notificationDisplay(n, t).message}</Text>
                <Text style={{color:muted,fontSize:12,marginTop:4}}>{timestamp(n.created_at)}</Text>
                {n.type==='chore_assigned' && n.chore_id && <View style={{gap:6,marginTop:8}}>
                  {n.chore_due_date && <Text style={{color:muted}}>{t('tr_due')}: {new Date(n.chore_due_date).toLocaleString(language)}</Text>}
                  {n.assigned_by && <Text style={{color:muted}}>{t('tr_assigned_by')}: {n.assigned_by}</Text>}
                </View>}
                {n.type==='personal_reminder' && n.reminder_at && (
                  <Text style={{ color:purple, fontSize:12, marginTop:2 }}>
                    🔔 {new Date(n.reminder_at).toLocaleString(language)}
                  </Text>
                )}
              </View>
              </Pressable>
              {n.type==='chore_assigned' && n.chore_id && <View style={[s.chips,{marginLeft:36,marginTop:8}]}>
                <Pressable accessibilityRole="button" accessibilityLabel={t('tr_chore')} onPress={()=>router.push({pathname:'/home/chore-details',params:{id:n.chore_id!}})} style={[s.chip,{backgroundColor:colors.surface}]}><Text style={{color:purple,fontWeight:'700'}}>{t('tr_chore')}</Text></Pressable>
              </View>}
              </View>
              {!n.is_read && <View style={s.dot}/>}
              <Pressable accessibilityRole="button" accessibilityLabel={`${t('notification_remove_action')}: ${n.title}`} disabled={deleting} onPress={event => { event.stopPropagation(); requestDelete(n); }} style={[s.icon, { opacity:deleting ? .45 : 1 }]}>
                <Ionicons name="trash-outline" size={19} color={purple}/>
              </Pressable>
            </View>
        </View>
      ))}
      <Text style={{color:muted,fontSize:12,textAlign:'center'}}>{t('admin_latest')}</Text>
    </>
  );

  else if (kind === 'completed') content=<><Text style={[s.subtitle,{color:muted}]}>{t('completed_chores_subtitle')}</Text><TextInput value={query} onChangeText={setQuery} placeholder={t('search_placeholder')} placeholderTextColor={muted} style={[s.input,{backgroundColor:card,color:fg}]} accessibilityLabel={t('search_placeholder')}/><View style={s.chips}>{(['all','today','week','month'] as const).map(v=><Pressable key={v} onPress={()=>setRange(v)} style={[s.chip,range===v&&s.selected]}><Text style={{color:range===v?'#fff':fg}}>{v==='all'?t('filter_all'):v==='today'?t('filter_today'):v==='week'?t('filter_week'):t('filter_month')}</Text></Pressable>)}</View>{busy?<ActivityIndicator color={purple}/>:error?<Text style={{color:'#EF4444'}}>{translateFeedback(error, t)}</Text>:chores.length===0?<Text style={{color:muted}}>{t('ui_no_completed_chores_match_this_search')}</Text>:chores.map(c=>panel(<View key={c.id} style={s.row}><Ionicons name="checkmark-circle" size={24} color="#22C55E"/><View style={{flex:1}}><Text style={[s.rowTitle,{color:fg}]}>{c.title}</Text><Text style={{color:muted}}>{t('by')}{' '}{c.assignee_name||c.creator_name||t('role_member')}</Text></View><Text style={{color:muted}}>{new Date(c.completed_at||c.updated_at).toLocaleDateString(language)}</Text></View>))}</>;

  else if (kind === 'settings') content=<>{banner}{[['notification_settings','notification_settings_sub','notifications','/home/notification-settings'],['reminder_time','reminder_time_sub','time','/home/reminder-time'],['theme','theme_sub','color-palette','/home/preferences'],['language','language_sub','language','/home/language'],['about_app','about_app_sub','information-circle','/home/about']].map(([a,b,icon,path])=><Pressable key={a} accessibilityRole="button" accessibilityLabel={t(a as any)} onPress={()=>router.push(path as any)}>{panel(<View style={s.row}><Ionicons name={icon as any} size={24} color={purple}/><View style={{flex:1}}><Text style={[s.rowTitle,{color:fg}]}>{t(a as any)}</Text><Text style={{color:muted}}>{t(b as any)}</Text></View><Ionicons name="chevron-forward" size={20} color={muted}/></View>)}</Pressable>)}</>;

  // ── Notification Settings — four individual toggle cards matching the reference design ──
  // Auto-saves each toggle immediately via settingsService.saveNotificationSettings().
  // Reminder Time is intentionally excluded from this screen (it lives in its own Settings entry).
  else if (kind === 'notificationSettings') {
    const notifCards: {
      key: keyof NotificationSettings;
      label: string;
      sub: string;
      icon: keyof typeof Ionicons.glyphMap;
      iconColor: string;
      iconBg: string;
    }[] = [
      { key: 'chore_reminders',   label: t('chore_reminders'),       sub: t('chore_reminders'),          icon: 'alarm-outline',            iconColor: '#EF4444', iconBg: (themeColors.isDark ? themeColors.surface : '#FEE2E2') },
      { key: 'chore_completions', label: t('chore_completions'),     sub: t('chore_completions'),        icon: 'checkmark-circle-outline', iconColor: '#22C55E', iconBg: (themeColors.isDark ? themeColors.surface : '#DCFCE7') },
      { key: 'family_updates',    label: t('family_updates_label'),  sub: t('family_updates_label'),     icon: 'people-outline',           iconColor: '#8B5CF6', iconBg: (themeColors.isDark ? themeColors.surface : '#EDE9FE') },
      { key: 'announcements',     label: t('announcements'),         sub: t('announcements'),            icon: 'megaphone-outline',        iconColor: '#3B82F6', iconBg: (themeColors.isDark ? themeColors.surface : '#DBEAFE') },
    ];

    if (adminFamily) notifCards.push(
      { key: 'due_date_alerts', label: t('admin_due'), sub: t('admin_due'), icon: 'notifications-outline', iconColor: purple, iconBg: colors.surface },
      { key: 'weekly_summary', label: t('admin_weekly'), sub: t('admin_weekly'), icon: 'calendar-outline', iconColor: purple, iconBg: colors.surface },
    );

    const toggleNotif = async (key: typeof notifCards[number]['key'], value: boolean) => {
      if (saveLock.current || busy) return;
      saveLock.current = true; setSaving(true);
      // Optimistically update UI, then persist only this preference
      const updated: NotificationSettings = { ...notif, [key]: value };
      setNotif(updated);
      try {
        const saved = await settingsService.saveNotificationSettings({ [key]: value });
        setNotif(saved);
        setDemo(false);
        setError('');
      } catch (e) {
        setDemo(false);
        setError(t('admin_save_error'));
        // Revert on failure so UI stays consistent with stored value
        setNotif(notif);
      } finally { saveLock.current = false; setSaving(false); }
    };

    content = (
      <>
        {banner}
        {/* Loading spinner while fetching settings from backend */}
        {busy && <ActivityIndicator color={purple} style={{ marginVertical: 8 }} />}
        <Text style={[s.sectionHead, { color: fg }]}>{t('notification_settings')}</Text>
        {notifCards.map(({ key, label, sub, icon, iconColor, iconBg }) => (
          <View key={key} style={[s.notifCard, { backgroundColor: card }]}>
            {/* Coloured icon badge */}
            <View style={[s.notifIcon, { backgroundColor: iconBg }]}>
              <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            {/* Title + subtitle */}
            <View style={{ flex: 1 }}>
              <Text style={[s.rowTitle, { color: fg }]}>{label}</Text>
              <Text style={{ color: muted, fontSize: 13, marginTop: 2 }}>{sub}</Text>
            </View>
            {/* Toggle — auto-saves on change */}
            <Switch
              disabled={busy || saving} value={Boolean(notif[key])}
              onValueChange={v => void toggleNotif(key, v)}
              trackColor={{ true: '#22C55E', false: dark ? '#3D3A4E' : '#D1D5DB' }}
              thumbColor="#fff"
              ios_backgroundColor={dark ? '#3D3A4E' : '#D1D5DB'}
              accessibilityLabel={label}
            />
          </View>
        ))}
      </>
    );
  }

  else if (kind === 'preferences') {
    const pct = Math.max(0, Math.min(100, ((brightness - 30) / 70) * 100));

    const updateBrightnessFromTouch = (locationX: number) => {
      if (sliderWidth > 0) {
        const ratio = Math.max(0, Math.min(1, locationX / sliderWidth));
        const val = Math.round(30 + ratio * 70);
        void setBrightness(val);
      }
    };

    content = (
      <>
        {banner}

        {/* ── Theme Section ── */}
        <Text style={[s.sectionHead, { color: fg }]}>{t('theme')}</Text>
        <View style={s.themeRow}>
          {/* LIGHT CARD */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ui_select_light_theme')}
            style={({ pressed }) => [
              s.themeCard,
              {
                backgroundColor: card,
                borderColor: theme === 'light' ? purple : colors.border,
                borderWidth: theme === 'light' ? 2.5 : 1.5,
              },
              pressed && { opacity: 0.8 },
            ]}
            onPress={async () => {
              await setTheme('light');
            }}
          >
            <Ionicons name="sunny" size={32} color="#0284C7" />
            <Text style={[s.themeCardText, { color: fg }]}>{t('light_theme').toUpperCase()}</Text>
          </Pressable>

          {/* DARK CARD */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ui_select_dark_theme')}
            style={({ pressed }) => [
              s.themeCard,
              {
                backgroundColor: (themeColors.isDark ? themeColors.background : '#161424'),
                borderColor: theme === 'dark' ? purple : '#2A263D',
                borderWidth: theme === 'dark' ? 2.5 : 1.5,
              },
              pressed && { opacity: 0.8 },
            ]}
            onPress={async () => {
              await setTheme('dark');
            }}
          >
            <Ionicons name="moon" size={28} color="#FFFFFF" />
            <Text style={[s.themeCardText, { color: '#FFFFFF' }]}>{t('dark_theme').toUpperCase()}</Text>
          </Pressable>
        </View>

        {/* ── Brightness Section ── */}
        {adminFamily && <Pressable accessibilityRole="button" accessibilityLabel={t('admin_system_theme')} accessibilityState={{ selected: themePreference === 'system' }} onPress={() => void setTheme('system').catch(() => setError(t('admin_save_error')))} style={[s.choice, { backgroundColor: card, borderColor: themePreference === 'system' ? purple : colors.border }]}>
          <Text style={[s.rowTitle, { color: fg }]}>{t('admin_system_theme')}</Text>
        </Pressable>}
        <Text style={[s.sectionHead, { color: fg, marginTop: 18, marginBottom: 8 }]}>
          {t('brightness')}
        </Text>
        <View style={s.brightnessRow}>
          <Ionicons name="sunny-outline" size={22} color={muted} />
          <View
            style={s.sliderTrackContainer}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => updateBrightnessFromTouch(e.nativeEvent.locationX)}
            onResponderMove={(e) => updateBrightnessFromTouch(e.nativeEvent.locationX)}
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
          >
            {/* Background Track */}
            <View style={[s.sliderBgTrack, { backgroundColor: dark ? '#2D2845' : (themeColors.isDark ? themeColors.surface : '#E2E8F0') }]} />
            {/* Filled Track */}
            <View
              style={[
                s.sliderFillTrack,
                {
                  width: `${pct}%`,
                  backgroundColor: purple,
                },
              ]}
            />
            {/* Thumb */}
            <View
              style={[
                s.sliderThumb,
                {
                  left: `${pct}%`,
                  backgroundColor: purple,
                },
              ]}
            />
          </View>
          <Text style={[s.percentText, { color: fg }]}>{Math.round(brightness)}%</Text>
        </View>

        {/* ── Auto Brightness Card ── */}
        <View style={[s.autoBrightnessCard, { backgroundColor: card }]}>
          <View style={[s.autoIconWrap, { backgroundColor: dark ? (themeColors.isDark ? themeColors.background : '#2A263D') : (themeColors.isDark ? themeColors.surface : '#F1F0F7') }]}>
            <Ionicons name="sunny-outline" size={22} color={muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowTitle, { color: fg }]}>{t('auto_brightness')}</Text>
            <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>
              {t('auto_brightness_sub')}
            </Text>
          </View>
          <Switch
            value={autoBrightness}
            onValueChange={(v) => void setAutoBrightness(v)}
            trackColor={{ true: purple, false: dark ? '#3D3A4E' : '#D1D5DB' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={dark ? '#3D3A4E' : '#D1D5DB'}
            accessibilityLabel={t('auto_brightness')}
          />
        </View>

        {/* ── Informational Card ── */}
        <View
          style={[
            s.infoBox,
            {
              backgroundColor: dark ? (themeColors.isDark ? themeColors.background : '#1E1B2E') : (themeColors.isDark ? themeColors.surface : '#F5F3FF'),
              borderColor: dark ? '#312B47' : (themeColors.isDark ? themeColors.border : '#EDE9FE'),
            },
          ]}
        >
          <Ionicons name="information-circle" size={24} color={purple} />
          <Text style={[s.infoBoxText, { color: muted }]}>{t('theme_pref_note')}</Text>
        </View>
      </>
    );
  }

  else content = panel(<View style={{alignItems:'center',gap:12,padding:20}}><Ionicons name="home" size={52} color={purple}/><Text style={[s.title,{color:fg}]}>ChoreSync</Text><Text style={{color:muted}}>{t('tagline')}</Text><Text style={{color:muted}}>{t('ui_version')} 1.0.0 | {t('ui_build')} 100</Text><Text style={{color:purple}}>{t('privacy_policy')} · {t('terms_of_service')}</Text></View>);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
      {top}
      {kind === 'notifications' && !!notice && <Text accessibilityLiveRegion="polite" style={{ color: colors.isDark ? '#76DEBB' : '#15803D', paddingHorizontal: 20, paddingVertical: 8 }}>{translateFeedback(notice, t)}</Text>}
      <ScrollView contentContainerStyle={[s.body, adminFamily && settingsChild && { width: '100%', maxWidth: 800, alignSelf: 'center' }]} refreshControl={<RefreshControl refreshing={busy} onRefresh={() => void load()} tintColor={purple}/>}>
        {content}
        {kind !== 'notifications' && !!notice && <Text style={{ color: '#22C55E' }}>{translateFeedback(notice, t)}</Text>}
        {!!error && kind !== 'completed' && <Text style={{ color: '#EF4444' }}>{translateFeedback(error, t)}</Text>}
      </ScrollView>

      <Modal visible={kind === 'notifications' && !!deleteTarget} transparent animationType="fade" onRequestClose={() => { if (!deleteLock.current) setDeleteTarget(null); }}>
        <View style={{flex:1,backgroundColor:'#0008',justifyContent:'center',padding:20}}><View style={[s.panel,{backgroundColor:card,borderWidth:1,borderColor:colors.border,width:'100%',maxWidth:440,alignSelf:'center',gap:14}]}>
          <Text style={[s.rowTitle,{color:fg}]}>{t('notification_remove_title')}</Text>
          <Text style={{color:muted,lineHeight:21}}>{t('notification_delete_body')}</Text>
          <Text style={{color:fg}}>{deleteTarget?.title}</Text>
          {!!deleteError && <Text accessibilityRole="alert" style={{color:dark ? '#FFAAA8' : '#B3261E'}}>{translateFeedback(deleteError, t)}</Text>}
          {deleting && <ActivityIndicator color={purple}/>}
          <View style={{flexDirection:'row',justifyContent:'flex-end',gap:10,flexWrap:'wrap'}}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('cancel')} disabled={deleting} onPress={() => setDeleteTarget(null)} style={[s.chip,{backgroundColor:colors.surface}]}><Text style={{color:fg}}>{t('cancel')}</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('notification_remove')} disabled={deleting} onPress={() => void confirmDelete()} style={[s.chip,{backgroundColor:purple,opacity:deleting ? .5 : 1}]}><Text style={{color:'#fff',fontWeight:'700'}}>{t(deleting ? 'notification_deleting' : 'notification_remove')}</Text></Pressable>
          </View>
        </View></View>
      </Modal>
      {/* ── Reminder Create / Edit Modal ───────────────────────────────────────
          Minimal form matching the existing card/input/button design.
          Appears only when the user taps "+" (create) or "Edit" (long-press on personal reminder).
      ─────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={s.overlay}>
          <View style={[s.formCard, { backgroundColor: card }]}>
            <Text style={[s.rowTitle, { color: fg, fontSize: 18, marginBottom: 4 }]}>
              {editId ? t('edit') : t('ui_new_reminder')}
            </Text>

            <TextInput
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder={t('ui_title')}
              placeholderTextColor={muted}
              style={[s.input, { backgroundColor: bg, color: fg }]}
              maxLength={200}
              accessibilityLabel={t('ui_reminder_title')}
            />
            <TextInput
              value={formMsg}
              onChangeText={setFormMsg}
              placeholder={t('ui_message')}
              placeholderTextColor={muted}
              style={[s.input, { backgroundColor: bg, color: fg, minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              multiline
              maxLength={1000}
              accessibilityLabel={t('ui_reminder_message')}
            />
            <TextInput
              value={formAt}
              onChangeText={setFormAt}
              placeholder={t('ui_remind_at_yyyy_mm_dd_hh_mm_optional')}
              placeholderTextColor={muted}
              style={[s.input, { backgroundColor: bg, color: fg }]}
              accessibilityLabel={t('ui_reminder_date_and_time')}
            />

            {!!error && <Text style={{ color: '#EF4444', fontSize: 13 }}>{translateFeedback(error, t)}</Text>}

            <Pressable style={[s.primary, saving && { opacity: 0.6 }]} onPress={saveForm} disabled={saving} accessibilityRole="button">
              <Text style={s.primaryText}>{saving ? t('saving') : t('save')}</Text>
            </Pressable>
            <Pressable style={{ marginTop: 6, alignItems: 'center', paddingVertical: 10 }} onPress={() => { setShowForm(false); setError(''); }} accessibilityRole="button">
              <Text style={{ color: muted, fontWeight: '600' }}>{t('cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createS = (themeColors: ThemeColors) => StyleSheet.create({
  safe: { flex:1 },
  head: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:8, gap:8 },
  icon: { width:44, height:44, alignItems:'center', justifyContent:'center' },
  title: { fontSize:20, fontWeight:'800', flex:1 },
  body: { padding:16, paddingBottom:36, gap:12 },
  subtitle: { fontSize:14, marginBottom:4 },
  panel: { borderRadius:16, padding:16, marginVertical:3 },
  row: { flexDirection:'row', alignItems:'center', gap:12 },
  rowTitle: { fontSize:15, fontWeight:'700' },
  primary: { backgroundColor:purple, minHeight:48, borderRadius:14, alignItems:'center', justifyContent:'center', paddingHorizontal:16 },
  primaryText: { color:'#fff', fontWeight:'700' },
  chips: { flexDirection:'row', gap:8, flexWrap:'wrap' },
  chip: { borderRadius:18, paddingVertical:9, paddingHorizontal:14, backgroundColor:(themeColors.isDark ? themeColors.surface : '#EFEAFF') },
  selected: { backgroundColor:purple },
  dot: { width:9, height:9, borderRadius:5, backgroundColor:purple },
  input: { minHeight:48, borderRadius:14, paddingHorizontal:14 },
  choice: { borderWidth:1.5, borderRadius:14, padding:16 },
  demo: { backgroundColor:(themeColors.isDark ? themeColors.surface : '#FFF3CD'), color:'#705400', padding:10, borderRadius:10, fontWeight:'700' },
  // ── Notification Settings cards ──
  sectionHead: { fontSize:17, fontWeight:'800', marginBottom:2, marginTop:2 },
  notifCard: { borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', gap:14, shadowColor:'#000', shadowOffset:{ width:0, height:1 }, shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  notifIcon: { width:46, height:46, borderRadius:15, alignItems:'center', justifyContent:'center', flexShrink:0 },
  // Modal
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'center', padding:20 },
  formCard: { borderRadius:20, padding:20, gap:10 },
  // ── Preferences / Theme ──
  themeRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  themeCard: { flex: 1, height: 110, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  themeCardText: { fontWeight: '800', fontSize: 15, marginTop: 8, letterSpacing: 0.5 },
  brightnessRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  sliderTrackContainer: { flex: 1, height: 32, justifyContent: 'center', position: 'relative' },
  sliderBgTrack: { height: 6, borderRadius: 3, width: '100%' },
  sliderFillTrack: { height: 6, borderRadius: 3, position: 'absolute', left: 0 },
  sliderThumb: { width: 22, height: 22, borderRadius: 11, position: 'absolute', top: 5, marginLeft: -11, shadowColor: purple, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 },
  percentText: { fontSize: 15, fontWeight: '700', width: 44, textAlign: 'right' },
  autoBrightnessCard: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  autoIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  langChoice: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  infoBox: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, marginTop: 16 },
  infoBoxText: { flex: 1, fontSize: 13, lineHeight: 18 },
});

const createClientS = (colors: ThemeColors) => StyleSheet.create({
  ...createS(colors),
  head: { ...createS(colors).head, width: '100%', maxWidth: 560, alignSelf: 'center' },
  body: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 16, paddingBottom: 36, gap: 12 },
  panel: { borderRadius: 16, padding: 14, marginVertical: 3, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 22, fontWeight: '800', flex: 1 },
  notifCard: { ...createS(colors).notifCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, shadowOpacity: .03 },
  rowTitle: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
});
