import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { notificationService, AppNotification, isDemoNotificationMode } from '@/services/notificationService';
import { completedChoresService, CompletedChore } from '@/services/completedChoresService';
import { settingsService, NotificationSettings, settingsDemoMode, UserPreferences } from '@/services/settingsService';

const purple = '#7C5CFC';
const defaultNotifications: NotificationSettings = { chore_reminders:true, chore_completions:true, family_updates:true, announcements:false, reminder_time:'10min' };

export function Component04Screen({ kind }: { kind: 'notifications'|'completed'|'settings'|'notificationSettings'|'preferences'|'about' }) {
  const { theme, setTheme, brightness, setBrightness, autoBrightness, setAutoBrightness, colors } = useAppTheme();
  const { t, language, setLanguage } = useLanguage();
  const dark = colors.isDark;
  const bg = colors.background, card = colors.card, fg = colors.textPrimary, muted = colors.textSecondary;
  const [sliderWidth, setSliderWidth] = useState(200);

  // ── Screen data state ──
  const [items, setItems] = useState<AppNotification[]>([]);
  const [chores, setChores] = useState<CompletedChore[]>([]);
  const [filter, setFilter] = useState<'all'|'unread'|'read'>('all');
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

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      if (kind === 'notifications') { setItems(await notificationService.getNotifications(filter)); setDemo(isDemoNotificationMode()); }
      else if (kind === 'completed') { setChores(await completedChoresService.get(range, query)); }
      else if (kind === 'notificationSettings') { setNotif(await settingsService.getNotificationSettings()); setDemo(settingsDemoMode); }
      else if (kind === 'preferences') { setPrefs(await settingsService.getPreferences()); setDemo(settingsDemoMode); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load data.'); }
    finally { setBusy(false); }
  }, [kind, filter, range, query]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

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
    if (!formTitle.trim()) { setError('Title is required.'); return; }
    if (!formMsg.trim()) { setError('Message is required.'); return; }
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
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save reminder.'); }
    finally { setSaving(false); }
  };

  const panel = (children: React.ReactNode) => <View style={[s.panel, { backgroundColor: card }]}>{children}</View>;
  const banner = demo && <Text style={s.demo}>DEMO / OFFLINE — changes shown here are not saved to the backend.</Text>;
  const title = kind==='notifications'?t('notifications'):kind==='completed'?t('completed_chores_title'):kind==='settings'?t('settings_title'):kind==='notificationSettings'?t('notification_settings'):kind==='preferences'?t('preferences_title'):t('about_title');

  // Header — shows "+" for notifications screen, bell icon for all other screens
  const top = (
    <View style={s.head}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => {
          // Settings sub-screens: navigate explicitly back through the settings hierarchy.
          // router.back() does not work correctly here because these screens are all
          // Tabs screens inside the home Tabs navigator — tab switches do not create
          // a stack that router.back() can pop through.
          if (kind === 'notificationSettings' || kind === 'preferences' || kind === 'about') {
            router.navigate('/home/settings' as any);
          } else if (kind === 'settings') {
            router.navigate('/home/profile' as any);
          } else {
            router.back();
          }
        }}
        style={s.icon}
      >
        <Ionicons name="arrow-back" size={22} color={purple}/>
      </Pressable>
      <Text style={[s.title, { color: fg }]}>{title}</Text>
      {kind === 'notifications'
        ? <Pressable accessibilityRole="button" accessibilityLabel="Add reminder" onPress={openCreate} style={s.icon}>
            <Ionicons name="add" size={28} color={purple}/>
          </Pressable>
        : <Pressable accessibilityRole="button" accessibilityLabel="Open notifications" onPress={() => router.push('/home/notifications')} style={s.icon}>
            <Ionicons name="notifications-outline" size={22} color={purple}/>
          </Pressable>
      }
    </View>
  );

  // ── Per-notification long-press: personal reminders get Edit+Delete, system notifications get Delete only ──
  const handleLongPress = (n: AppNotification) => {
    const isPersonal = n.type === 'personal_reminder';
    const doDelete = async () => {
      try {
        await notificationService.deleteNotification(n.id);
        setItems(prev => prev.filter(x => x.id !== n.id));
        setDemo(isDemoNotificationMode());
      } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete.'); }
    };
    Alert.alert(
      isPersonal ? 'Reminder Options' : 'Notification',
      isPersonal ? 'Choose an action:' : 'Remove this notification?',
      [
        ...(isPersonal ? [{ text: 'Edit', onPress: () => openEdit(n) }] : []),
        { text: 'Delete', style: 'destructive', onPress: doDelete },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  let content: React.ReactNode;

  if (kind === 'notifications') content = (
    <>
      {banner}
      <Text style={[s.subtitle, { color: muted }]}>{t('notifications_subtitle')}</Text>
      <Pressable style={s.primary} onPress={async () => { try { await notificationService.markAllRead(); setItems(items.map(n => ({ ...n, is_read: true }))); setDemo(isDemoNotificationMode()); } catch (e) { setError(e instanceof Error ? e.message : 'Could not update notifications.'); } }}>
        <Text style={s.primaryText}>{t('mark_all_read')}</Text>
      </Pressable>
      <View style={s.chips}>
        {(['all','unread','read'] as const).map(v => (
          <Pressable key={v} onPress={() => setFilter(v)} style={[s.chip, filter===v && s.selected]}>
            <Text style={{ color: filter===v ? '#fff' : fg }}>{v==='all'?t('filter_all'):v==='unread'?`${t('filter_unread')} (${items.filter(i=>!i.is_read).length})`:t('filter_read')}</Text>
          </Pressable>
        ))}
      </View>
      {busy ? <ActivityIndicator color={purple}/> : items.length===0 ? <Text style={{ color: muted }}>{t('no_notifications')}</Text> : items.map(n => (
        <Pressable key={n.id}
          onPress={async () => { if (!n.is_read) { try { await notificationService.markRead(n.id); setItems(items.map(x => x.id===n.id ? { ...x, is_read:true } : x)); setDemo(isDemoNotificationMode()); } catch (e) { setError(e instanceof Error ? e.message : 'Could not update notification.'); } } }}
          onLongPress={() => handleLongPress(n)}
        >
          {panel(
            <View style={s.row}>
              <Ionicons
                name={n.type==='chore_completed' ? 'checkmark-circle' : n.type==='personal_reminder' ? 'alarm' : 'notifications'}
                size={24}
                color={n.type==='chore_completed' ? '#22C55E' : purple}
              />
              <View style={{ flex:1 }}>
                <Text style={[s.rowTitle, { color:fg }]}>{n.title}</Text>
                <Text style={{ color:muted }}>{n.message}</Text>
                {n.type==='personal_reminder' && n.reminder_at && (
                  <Text style={{ color:purple, fontSize:12, marginTop:2 }}>
                    🔔 {new Date(n.reminder_at).toLocaleString()}
                  </Text>
                )}
              </View>
              {!n.is_read && <View style={s.dot}/>}
            </View>
          )}
        </Pressable>
      ))}
    </>
  );

  else if (kind === 'completed') content=<><Text style={[s.subtitle,{color:muted}]}>{t('completed_chores_subtitle')}</Text><TextInput value={query} onChangeText={setQuery} placeholder={t('search_placeholder')} placeholderTextColor={muted} style={[s.input,{backgroundColor:card,color:fg}]} accessibilityLabel={t('search_placeholder')}/><View style={s.chips}>{(['all','today','week','month'] as const).map(v=><Pressable key={v} onPress={()=>setRange(v)} style={[s.chip,range===v&&s.selected]}><Text style={{color:range===v?'#fff':fg}}>{v==='all'?t('filter_all'):v==='today'?t('filter_today'):v==='week'?t('filter_week'):t('filter_month')}</Text></Pressable>)}</View>{busy?<ActivityIndicator color={purple}/>:error?<Text style={{color:'#EF4444'}}>{error}</Text>:chores.length===0?<Text style={{color:muted}}>No completed chores match this search.</Text>:chores.map(c=>panel(<View key={c.id} style={s.row}><Ionicons name="checkmark-circle" size={24} color="#22C55E"/><View style={{flex:1}}><Text style={[s.rowTitle,{color:fg}]}>{c.title}</Text><Text style={{color:muted}}>By {c.assignee_name||c.creator_name||'Member'}</Text></View><Text style={{color:muted}}>{new Date(c.completed_at||c.updated_at).toLocaleDateString()}</Text></View>))}</>;

  else if (kind === 'settings') content=<>{banner}{[['notification_settings','notification_settings_sub','notifications','/home/notification-settings'],['reminder_time','reminder_time_sub','time','/home/reminder-time'],['theme','theme_sub','color-palette','/home/preferences'],['language','language_sub','language','/home/preferences'],['about_app','about_app_sub','information-circle','/home/about']].map(([a,b,icon,path])=><Pressable key={a} onPress={()=>router.push(path as any)}>{panel(<View style={s.row}><Ionicons name={icon as any} size={24} color={purple}/><View style={{flex:1}}><Text style={[s.rowTitle,{color:fg}]}>{t(a as any)}</Text><Text style={{color:muted}}>{t(b as any)}</Text></View><Ionicons name="chevron-forward" size={20} color={muted}/></View>)}</Pressable>)}</>;

  // ── Notification Settings — four individual toggle cards matching the reference design ──
  // Auto-saves each toggle immediately via settingsService.saveNotificationSettings().
  // Reminder Time is intentionally excluded from this screen (it lives in its own Settings entry).
  else if (kind === 'notificationSettings') {
    const notifCards: {
      key: 'chore_reminders' | 'chore_completions' | 'family_updates' | 'announcements';
      label: string;
      sub: string;
      icon: keyof typeof Ionicons.glyphMap;
      iconColor: string;
      iconBg: string;
    }[] = [
      { key: 'chore_reminders',  label: 'Chore Reminders',  sub: 'Upcoming chores',              icon: 'alarm-outline',           iconColor: '#EF4444', iconBg: '#FEE2E2' },
      { key: 'chore_completions',label: 'Chore Completions', sub: 'When chores are completed',    icon: 'checkmark-circle-outline', iconColor: '#22C55E', iconBg: '#DCFCE7' },
      { key: 'family_updates',   label: 'Family Updates',    sub: 'Assignments and activity',     icon: 'people-outline',           iconColor: '#8B5CF6', iconBg: '#EDE9FE' },
      { key: 'announcements',    label: 'Announcements',     sub: 'Important household updates',  icon: 'megaphone-outline',        iconColor: '#3B82F6', iconBg: '#DBEAFE' },
    ];

    const toggleNotif = async (key: typeof notifCards[number]['key'], value: boolean) => {
      // Optimistically update UI, then persist to backend
      const updated: NotificationSettings = { ...notif, [key]: value };
      setNotif(updated);
      try {
        await settingsService.saveNotificationSettings(updated);
        setDemo(false);
        setError('');
      } catch (e) {
        setDemo(true);
        setError(e instanceof Error ? e.message : 'Could not save setting.');
        // Revert on failure so UI stays consistent with stored value
        setNotif(notif);
      }
    };

    content = (
      <>
        {banner}
        {/* Loading spinner while fetching settings from backend */}
        {busy && <ActivityIndicator color={purple} style={{ marginVertical: 8 }} />}
        <Text style={[s.sectionHead, { color: fg }]}>Notification Types</Text>
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
              value={notif[key]}
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
            accessibilityLabel="Select Light Theme"
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
            <Text style={[s.themeCardText, { color: fg }]}>LIGHT</Text>
          </Pressable>

          {/* DARK CARD */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Dark Theme"
            style={({ pressed }) => [
              s.themeCard,
              {
                backgroundColor: '#161424',
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
            <Text style={[s.themeCardText, { color: '#FFFFFF' }]}>DARK</Text>
          </Pressable>
        </View>

        {/* ── Brightness Section ── */}
        <Text style={[s.sectionHead, { color: fg, marginTop: 18, marginBottom: 8 }]}>
          Brightness
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
            <View style={[s.sliderBgTrack, { backgroundColor: dark ? '#2D2845' : '#E2E8F0' }]} />
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
          <View style={[s.autoIconWrap, { backgroundColor: dark ? '#2A263D' : '#F1F0F7' }]}>
            <Ionicons name="sunny-outline" size={22} color={muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowTitle, { color: fg }]}>Auto Brightness</Text>
            <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>
              Adjust brightness based on your device settings
            </Text>
          </View>
          <Switch
            value={autoBrightness}
            onValueChange={(v) => void setAutoBrightness(v)}
            trackColor={{ true: purple, false: dark ? '#3D3A4E' : '#D1D5DB' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={dark ? '#3D3A4E' : '#D1D5DB'}
            accessibilityLabel="Auto Brightness"
          />
        </View>

        {/* ── Language Section ── */}
        <Text style={[s.sectionHead, { color: fg, marginTop: 18, marginBottom: 8 }]}>
          {t('language')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['en', 'si', 'ta'] as const).map((v) => (
            <Pressable
              key={v}
              style={[
                s.langChoice,
                {
                  backgroundColor: card,
                  borderColor: language === v ? purple : colors.border,
                },
              ]}
              onPress={async () => {
                await setLanguage(v);
                await settingsService.savePreferences({ language: v }).catch(() => {});
              }}
            >
              <Text style={{ color: language === v ? purple : fg, fontWeight: '700' }}>
                {v === 'en' ? t('english') : v === 'si' ? t('sinhala') : t('tamil')}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Informational Card ── */}
        <View
          style={[
            s.infoBox,
            {
              backgroundColor: dark ? '#1E1B2E' : '#F5F3FF',
              borderColor: dark ? '#312B47' : '#EDE9FE',
            },
          ]}
        >
          <Ionicons name="information-circle" size={24} color={purple} />
          <Text style={[s.infoBoxText, { color: muted }]}>
            Choose your preferred theme and adjust the brightness to make the app comfortable for you.
          </Text>
        </View>
      </>
    );
  }

  else content = panel(<View style={{alignItems:'center',gap:12,padding:20}}><Ionicons name="home" size={52} color={purple}/><Text style={[s.title,{color:fg}]}>ChoreSync</Text><Text style={{color:muted}}>{t('tagline')}</Text><Text style={{color:muted}}>Version 1.0.0 · Build 100</Text><Text style={{color:purple}}>{t('privacy_policy')} · {t('terms_of_service')}</Text></View>);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
      {top}
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={busy} onRefresh={() => void load()} tintColor={purple}/>}>
        {content}
        {!!notice && <Text style={{ color: '#22C55E' }}>{notice}</Text>}
        {!!error && kind !== 'completed' && <Text style={{ color: '#EF4444' }}>{error}</Text>}
      </ScrollView>

      {/* ── Reminder Create / Edit Modal ───────────────────────────────────────
          Minimal form matching the existing card/input/button design.
          Appears only when the user taps "+" (create) or "Edit" (long-press on personal reminder).
      ─────────────────────────────────────────────────────────────────────── */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={s.overlay}>
          <View style={[s.formCard, { backgroundColor: card }]}>
            <Text style={[s.rowTitle, { color: fg, fontSize: 18, marginBottom: 4 }]}>
              {editId ? 'Edit Reminder' : 'New Reminder'}
            </Text>

            <TextInput
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="Title *"
              placeholderTextColor={muted}
              style={[s.input, { backgroundColor: bg, color: fg }]}
              maxLength={200}
              accessibilityLabel="Reminder title"
            />
            <TextInput
              value={formMsg}
              onChangeText={setFormMsg}
              placeholder="Message *"
              placeholderTextColor={muted}
              style={[s.input, { backgroundColor: bg, color: fg, minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              multiline
              maxLength={1000}
              accessibilityLabel="Reminder message"
            />
            <TextInput
              value={formAt}
              onChangeText={setFormAt}
              placeholder="Remind at: YYYY-MM-DD HH:MM (optional)"
              placeholderTextColor={muted}
              style={[s.input, { backgroundColor: bg, color: fg }]}
              accessibilityLabel="Reminder date and time"
            />

            {!!error && <Text style={{ color: '#EF4444', fontSize: 13 }}>{error}</Text>}

            <Pressable style={[s.primary, saving && { opacity: 0.6 }]} onPress={saveForm} disabled={saving} accessibilityRole="button">
              <Text style={s.primaryText}>{saving ? 'Saving…' : 'Save Reminder'}</Text>
            </Pressable>
            <Pressable style={{ marginTop: 6, alignItems: 'center', paddingVertical: 10 }} onPress={() => { setShowForm(false); setError(''); }} accessibilityRole="button">
              <Text style={{ color: muted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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
  chip: { borderRadius:18, paddingVertical:9, paddingHorizontal:14, backgroundColor:'#EFEAFF' },
  selected: { backgroundColor:purple },
  dot: { width:9, height:9, borderRadius:5, backgroundColor:purple },
  input: { minHeight:48, borderRadius:14, paddingHorizontal:14 },
  choice: { borderWidth:1.5, borderRadius:14, padding:16 },
  demo: { backgroundColor:'#FFF3CD', color:'#705400', padding:10, borderRadius:10, fontWeight:'700' },
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
