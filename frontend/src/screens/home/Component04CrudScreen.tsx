import { translateFeedback } from '@/i18n/translations';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';
import { Action, Card, Label, s, useAdminColors } from '../admin/AdminComponent04Shared';
import { Announcement, Reminder, announcementService, reminderService } from '@/services/component04CrudService';
import { familyService } from '@/services/familyService';
import { ApiError } from '@/services/api';
import { useAppTheme } from '@/context/ThemeContext';
import { reminderDeviceService } from '@/services/reminderDeviceService';
import { reminderSnapshot } from '@/services/component04CrudService';

type RecordItem = Reminder | Announcement;
function localInput(value: string) {
  const d = new Date(value), pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function parseLocalTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number), date = new Date(y, m - 1, d, h, min);
  return localInput(date.toISOString()) === value && date.getTime() > Date.now() ? date.toISOString() : null;
}
export default function Component04CrudScreen({ kind, familyId, admin = false }: { kind: 'reminders' | 'announcements'; familyId?: string; admin?: boolean }) {
  const reminders = kind === 'reminders', c = useAdminColors(), { t, language } = useLanguage();
  const { colors } = useAppTheme();
  const scroll = useRef<ScrollView>(null);
  const reveal = () => requestAnimationFrame(() => scroll.current?.scrollTo({ y: 0, animated: true }));
  const [items, setItems] = useState<RecordItem[]>([]), [chores, setChores] = useState<{ id: string; title: string; due_date?: string | null }[]>([]);
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [pendingTime, setPendingTime] = useState('00:00');
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [family, setFamily] = useState(familyId || ''), [canManage, setCanManage] = useState(reminders);
  const [busy, setBusy] = useState(true), [saving, setSaving] = useState(false), lock = useRef(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [noFamily, setNoFamily] = useState(false);
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState<{ id?: string } | null>(null), [detail, setDetail] = useState<RecordItem | null>(null), [deleting, setDeleting] = useState<RecordItem | null>(null);
  const [title, setTitle] = useState(''), [body, setBody] = useState(''), [time, setTime] = useState(''), [chore, setChore] = useState(''), [status, setStatus] = useState('draft');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      if (reminders) { const r = await reminderService.list(); setItems(r.reminders);
        if (admin) setChores((await reminderService.chores()).chores);
        if (!admin && reminderDeviceService.supported()) await reminderDeviceService.reconcile(reminderSnapshot);
      }
      else {
        const id = familyId || (await familyService.getMyFamily()).family?.id;
        setNoFamily(!id); if (!id) { setCanManage(false); return; }
        setFamily(id); const result = await announcementService.list(id); setItems(result.announcements); setCanManage(result.can_manage);
      }
    } catch (e) { console.warn('Notification records load failed', e); setError(e instanceof ApiError && [401, 403].includes(e.status || 0) ? t('admin_denied') : t('crud_load_error')); }
    finally { setBusy(false); }
  }, [reminders, familyId, t, admin]);
  useFocusEffect(useCallback(() => { setEditor(null); setDetail(null); setDeleting(null); void load(); }, [load]));
  useFocusEffect(useCallback(() => {
    if (admin || !reminders) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (lock.current) return true;
      if (deleting) setDeleting(null);
      else if (editor || detail) { setEditor(null); setDetail(null); setError(''); }
      else router.navigate('/home/notifications');
      return true;
    });
    return () => subscription.remove();
  }, [admin, reminders, deleting, editor, detail]));
  const action = async (fn: () => Promise<void>) => {
    if (lock.current) return; lock.current = true; setSaving(true); setError(''); setNotice('');
    try { await fn(); } catch (e) {
      console.warn('Notification record action failed', e);
      setError(e instanceof ApiError ? ([401, 403].includes(e.status || 0) ? t('admin_denied') : t('crud_save_error')) : e instanceof Error ? translateFeedback(e.message,t,'crud_save_error') : t('crud_save_error'));
    }
    finally { lock.current = false; setSaving(false); }
  };
  const openEditor = (item?: RecordItem) => {
    setDetail(null); setDeleting(null); setEditor(item ? { id: item.id } : {}); setError(''); setNotice('');
    setTitle(item?.title || ''); setBody(item ? ('note' in item ? item.note : item.message) : '');
    setTime(item && 'remind_at' in item ? localInput(item.remind_at) : localInput(new Date(Date.now() + 3600000).toISOString()));
    if (admin) setChore(item && 'chore_id' in item ? item.chore_id || '' : ''); setStatus(item?.status || 'draft');
    setSound(item && 'sound' in item ? item.sound !== false : true);
    setVibrate(item && 'vibrate' in item ? item.vibrate !== false : true); setPicker(null);
    reveal();
  };
  const save = () => void action(async () => {
    if (!title.trim() || title.trim().length > 200 || body.trim().length > (reminders ? 2000 : 5000) || (!reminders && !body.trim())) throw new Error(t('crud_required'));
    if (reminders) {
    const iso = parseLocalTime(time); if (!iso) throw new Error(t('crud_future'));
      const result = await reminderService.save(editor?.id, { title, note: body, remind_at: iso, ...(!admin ? { vibrate, sound } : {}), ...(admin && !editor?.id ? { chore_id: chore || undefined } : {}) });
      if (!admin) setNotice(`${t('crud_saved')} ${result?.device_status ? t(`reminder_device_${result.device_status}` as TranslationKey) : ''}`);
    } else await announcementService.save(family, editor?.id, { title, message: body, status });
    if (reminders && !admin) { setQuery(''); setFilter('all'); }
    setEditor(null); setDetail(null); if (!reminders || admin) setNotice(t('crud_saved')); await load();
  });
  const date = (value: string) => new Date(value).toLocaleString(language);
  const labelStatus = (item: RecordItem) => t((`crud_${item.status}`) as TranslationKey);
  const shown = items.filter(item => `${item.title} ${'note' in item ? `${item.note} ${item.chore_name || ''}` : item.message}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
    (filter === 'all' || (reminders ? (filter === 'upcoming' ? item.status === 'pending' : 'remind_at' in item && Date.parse(item.remind_at) <= Date.now()) : item.status === filter)));
  const input = (label: string, value: string, change: (v: string) => void, max: number, multiline = false) => <View style={{ gap: 6 }}><Label>{label}</Label><TextInput accessibilityLabel={label} value={value} onChangeText={change} maxLength={max} multiline={multiline} editable={!saving} style={[s.input, { color: c.text, borderColor: c.border, minHeight: multiline ? 100 : 48 }]} /></View>;
  const screenTitle = t(reminders ? 'my_reminders' : canManage ? 'manage_announcements' : 'household_announcements');
  const back = () => admin ? router.navigate({ pathname: '/admin/notifications', params: familyId ? { family_id: familyId } : undefined }) : router.canGoBack() ? router.back() : router.replace('/home/notifications');
  // The normal-user presentation shares the existing authenticated CRUD handlers.
  // Admin reminders and announcements retain their existing presentation below.
  if (reminders && !admin) {
    const text = (value: React.ReactNode, muted = false, heading = false) => <Text style={{ color: muted ? colors.textSecondary : colors.textPrimary, fontSize: heading ? 19 : 15, fontWeight: heading ? '700' : '400', lineHeight: heading ? 27 : 22 }}>{value}</Text>;
    const card = (children: React.ReactNode) => <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>;
    const button = (label: string, onPress: () => void, primary = false, disabled = saving, danger = false) => <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.action, { backgroundColor: primary ? colors.primary : colors.surface, opacity: disabled ? .45 : pressed ? .7 : 1 }]}><Text style={{ color: danger ? c.error : primary ? '#fff' : colors.primary, fontWeight: '700', textAlign: 'center' }}>{label}</Text></Pressable>;
    const field = (label: string, value: string, change: (value: string) => void, maxLength: number, placeholder = '', multiline = false) => <View style={{ gap: 7 }}>{text(label)}<TextInput accessibilityLabel={label} value={value} onChangeText={change} maxLength={maxLength} editable={!saving} multiline={multiline} placeholder={placeholder} placeholderTextColor={colors.textSecondary}
      style={[s.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border, minHeight: multiline ? 96 : 48, textAlignVertical: multiline ? 'top' : 'center' }]} /></View>;
    const heading = t(editor ? editor.id ? 'reminder_edit' : 'reminder_add' : detail ? 'reminder_details' : 'my_reminders');
    const timeField = (mode: 'date' | 'time') => {
      const label = `${t(mode === 'date' ? 'reminder_date' : 'reminder_time')} *`;
      if (mode === 'time') return <View style={{ gap: 7 }}>{text(label)}<Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: saving }} disabled={saving}
        onPress={() => { setPendingTime(time.split(' ')[1] || '00:00'); setPicker('time'); }}
        style={[s.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        {text(time.split(' ')[1] || '')}<Ionicons name="time-outline" size={20} color={colors.primary}/>
      </Pressable></View>;
      const dateValue = time.split(' ')[0];
      const minimumDate = editor?.id ? undefined : localInput(new Date().toISOString()).split(' ')[0];
      const dateStyle = [s.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, minHeight: 48, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const }];
      const contents = <><Text style={{ color: colors.textPrimary, fontSize: 16, lineHeight: 22 }}>{dateValue}</Text><Ionicons name="calendar-outline" size={20} color={colors.primary}/></>;
      if (Platform.OS === 'web') return <View style={{ gap: 7 }}>{text(label)}<View style={dateStyle}>
        {contents}
        {React.createElement('input', {
          type: 'date', 'aria-label': label, value: dateValue, min: minimumDate, disabled: saving,
          // Keep the existing YYYY-MM-DD presentation; the native input covers the
          // entire field so its calendar also opens when the icon is tapped.
          style: { position: 'absolute', inset: 0, width: '100%', height: '100%', boxSizing: 'border-box', opacity: 0, cursor: 'pointer', colorScheme: colors.isDark ? 'dark' : 'light' },
          onClick: (event: React.MouseEvent<HTMLInputElement>) => {
            try { event.currentTarget.showPicker?.(); } catch { /* The native input remains available as a fallback. */ }
          },
          onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); try { event.currentTarget.showPicker?.(); } catch {} }
            else if (event.key !== 'Tab' && event.key !== 'Escape') event.preventDefault();
          },
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            if (value && event.target.validity.valid) setTime(current => value + ' ' + (current.split(' ')[1] || ''));
          },
        })}
      </View></View>;
      return <View style={{ gap: 7 }}>{text(label)}<Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => setPicker('date')} style={dateStyle}>{contents}</Pressable></View>;
    };
    const clientBack = () => { if (editor || detail) { setEditor(null); setDetail(null); setError(''); reveal(); } else router.navigate('/home/notifications'); };
    const showDetails = (item: Reminder) => void action(async () => { setDetail((await reminderService.get(item.id)).reminder); setEditor(null); reveal(); });
    const editReminder = (item: Reminder) => void action(async () => openEditor((await reminderService.get(item.id)).reminder));
    const schedule = (item: Reminder) => <View style={{ gap: 7 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="calendar-outline" size={18} color={colors.primary}/>{text(new Date(item.remind_at).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' }))}</View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="time-outline" size={18} color={colors.primary}/>{text(new Date(item.remind_at).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }))}</View>
    </View>;
    const recordActions = (item: Reminder, includeView = true) => <View style={s.wrap}>
      {includeView && button(t('crud_view'), () => showDetails(item))}
      {button(t(includeView ? 'crud_edit' : 'reminder_edit'), () => editReminder(item), false, saving || item.status !== 'pending')}
      {button(t('crud_delete'), () => setDeleting(item), false, saving, true)}
    </View>;
    return <SafeAreaView edges={['top', 'left', 'right']} style={[s.fill, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('admin_back')} disabled={saving} style={s.icon} onPress={clientBack}><Ionicons name="arrow-back" size={24} color={colors.primary}/></Pressable>
        <View style={{ flex: 1 }}>{text(heading, false, true)}</View>
        {!editor && !detail && <Pressable accessibilityRole="button" accessibilityLabel={t('crud_retry')} disabled={saving || busy} style={s.icon} onPress={() => void load()}><Ionicons name="refresh-outline" size={22} color={colors.primary}/></Pressable>}
      </View>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.body, { maxWidth: 560, padding: 16, gap: 12 }]}>
        {!!error && <Text accessibilityRole="alert" style={{ color: c.error, lineHeight: 22 }}>{translateFeedback(error, t)}</Text>}
        {!!notice && text(notice)}
        {busy && <ActivityIndicator color={colors.primary}/>}
        {editor ? card(<>
          {field(`${t('reminder_title')} *`, title, setTitle, 200)}
          {field(t('crud_note'), body, setBody, 2000, '', true)}
          {timeField('date')}{timeField('time')}
          {picker === 'date' && Platform.OS !== 'web' && React.createElement(require('@react-native-community/datetimepicker').default, {
            value: new Date(time.split(' ')[0] + 'T12:00:00'), mode: 'date', display: Platform.OS === 'ios' ? 'inline' : 'calendar',
            minimumDate: editor.id ? undefined : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
            themeVariant: colors.isDark ? 'dark' : 'light', accentColor: colors.primary,
            onChange: (event: { type: string }, value?: Date) => {
              setPicker(null);
              if (event.type !== 'dismissed' && value) setTime(current => localInput(value.toISOString()).split(' ')[0] + ' ' + (current.split(' ')[1] || ''));
            },
          })}
          {picker === 'time' && Platform.OS === 'android' && React.createElement(require('@react-native-community/datetimepicker').default, {
            value: new Date(2000, 0, 1, Number(pendingTime.split(':')[0]), Number(pendingTime.split(':')[1])), mode: 'time', display: 'clock', is24Hour: true,
            onChange: (event: { type: string }, value?: Date) => {
              setPicker(null);
              if (event.type === 'set' && value) setTime(current => `${current.split(' ')[0]} ${localInput(value.toISOString()).split(' ')[1]}`);
            },
          })}
          <Modal visible={picker === 'time' && Platform.OS !== 'android'} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
            <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 }}><View style={{ width: '100%', maxWidth: 440, alignSelf: 'center' }}>{card(<>
              {text(t('reminder_time'), false, true)}
              {Platform.OS === 'ios' ? React.createElement(require('@react-native-community/datetimepicker').default, {
                value: new Date(2000, 0, 1, Number(pendingTime.split(':')[0]), Number(pendingTime.split(':')[1])), mode: 'time', display: 'spinner', themeVariant: colors.isDark ? 'dark' : 'light',
                onChange: (_event: unknown, value?: Date) => { if (value) setPendingTime(localInput(value.toISOString()).split(' ')[1]); },
              }) : <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                {(['hour', 'minute'] as const).map((part, index) => React.createElement('select', {
                  key: part, 'aria-label': `${t('reminder_time')} (${index === 0 ? 'HH' : 'mm'})`, value: pendingTime.split(':')[index],
                  style: { backgroundColor: colors.inputBackground, color: colors.textPrimary, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 12, fontFamily: 'inherit', fontSize: 15 },
                  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = event.target.value;
                    setPendingTime(current => index === 0 ? `${value}:${current.split(':')[1]}` : `${current.split(':')[0]}:${value}`);
                  },
                }, Array.from({ length: index === 0 ? 24 : 60 }, (_, n) => {
                  const value = String(n).padStart(2, '0'); return React.createElement('option', { key: value, value }, value);
                })))}
              </View>}
              <View style={s.wrap}>{button(t('crud_cancel'), () => setPicker(null))}{button(t('crud_save'), () => {
                setTime(current => `${current.split(' ')[0]} ${pendingTime}`); setPicker(null);
              }, true)}</View>
            </>)}</View></View>
          </Modal>
          {text(t('reminder_local_time'), true)}
          {text(t('reminder_alert'), false, true)}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{text(t('reminder_sound'))}<Switch accessibilityLabel={t('reminder_sound')} value={sound} disabled={saving} onValueChange={setSound} trackColor={{ true: colors.primary }} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{text(t('reminder_vibrate'))}<Switch accessibilityLabel={t('reminder_vibrate')} value={vibrate} disabled={saving} onValueChange={setVibrate} trackColor={{ true: colors.primary }} /></View>
          {button(t(saving ? 'crud_saving' : editor.id ? 'reminder_save_changes' : 'reminder_create'), save, true, saving)}
          {button(t('crud_cancel'), clientBack)}
        </>) : detail && 'remind_at' in detail ? card(<>
          {text(detail.title, false, true)}
          {!!detail.note && <>{text(t('crud_note'), true)}{text(detail.note)}</>}
          {text(`${t('reminder_sound')}: ${detail.sound !== false ? '?' : '?'} ? ${t('reminder_vibrate')}: ${detail.vibrate !== false ? '?' : '?'}`, true)}
          {schedule(detail)}{text(labelStatus(detail), true)}
          {text(`${t('crud_created')}: ${date(detail.created_at)}`, true)}
          {text(`${t('crud_updated')}: ${date(detail.updated_at)}`, true)}
          {detail.status !== 'pending' && text(t('reminder_read_only'), true)}
          {recordActions(detail, false)}
        </>) : <>
          {card(<><Ionicons name="alarm-outline" size={28} color={colors.primary}/>{text(t('reminder_intro'), false, true)}{text(t('reminder_intro_body'), true)}{text(t('reminder_device_delivery'), true)}</>)}
          {button(`+ ${t('reminder_add')}`, () => openEditor(), true, saving || busy)}
          {items.length > 0 && <>
            {field(t('crud_search'), query, setQuery, 200)}
            <View style={s.wrap}>{['all', 'upcoming', 'past'].map(value => <React.Fragment key={value}>{button(t(`crud_${value}` as TranslationKey), () => setFilter(value), filter === value)}</React.Fragment>)}</View>
          </>}
          {!busy && !error && !items.length && card(<View style={{ gap: 12, alignItems: 'center', paddingVertical: 12 }}><Ionicons name="alarm-outline" size={40} color={colors.primary}/>{text(t('reminder_empty'), false, true)}{text(t('reminder_empty_body'), true)}</View>)}
          {!busy && items.length > 0 && !shown.length && text(t('crud_empty'), true)}
          {shown.map(item => 'remind_at' in item && <View key={item.id}>{card(<>{text(item.title, false, true)}{schedule(item)}
            <View style={{ alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.surface }}>{text(item.status === 'pending' ? t('crud_upcoming') : labelStatus(item))}</View>
            {recordActions(item)}</>)}</View>)}
        </>}
      </ScrollView>
      <Modal visible={!!deleting} transparent animationType="fade" onRequestClose={() => { if (!saving) setDeleting(null); }}>
        <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 }}><View style={{ width: '100%', maxWidth: 440, alignSelf: 'center' }}>{card(<>
          {text(t('reminder_delete_title'), false, true)}{text(t('reminder_delete_body'), true)}{text(deleting?.title)}
          {!!error && <Text accessibilityRole="alert" style={{ color: c.error }}>{translateFeedback(error, t)}</Text>}
          <View style={s.wrap}>{button(t('crud_cancel'), () => setDeleting(null))}{button(t(saving ? 'crud_saving' : 'crud_delete'), () => void action(async () => {
            if (!deleting) return;
            await reminderService.delete(deleting.id); setDeleting(null); setDetail(null); setEditor(null); setNotice(t('crud_deleted')); await load();
          }), false, saving, true)}</View>
        </>)}</View></View>
      </Modal>
    </SafeAreaView>;
  }
  return <SafeAreaView edges={admin ? ['top', 'left', 'right'] : undefined} style={[s.fill, { backgroundColor: c.bg }]}>
    {admin && <View style={[s.header, { borderColor: c.border }]}>
      <Pressable style={s.icon} accessibilityRole="button" accessibilityLabel={t('admin_back')} disabled={saving} onPress={back}><Ionicons name="arrow-back" size={23} color={c.accent} /></Pressable>
      <View style={{ flex: 1 }}><Label heading>{screenTitle}</Label></View>
      <Pressable style={s.icon} accessibilityRole="button" accessibilityLabel={t('crud_retry')} disabled={saving || busy} onPress={() => void load()}><Ionicons name="refresh-outline" size={22} color={c.accent} /></Pressable>
    </View>}
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
    {!admin && <><Action label={t('admin_back')} disabled={saving} onPress={back} /><Label heading>{screenTitle}</Label></>}
    {reminders && <Card><Label muted>{t('crud_delivery')}</Label></Card>}
    {!!error && <Card><Text accessibilityRole="alert" style={{ color: c.error, lineHeight: 21 }}>{translateFeedback(error, t)}</Text></Card>}{!!notice && <Card><Label>{translateFeedback(notice, t)}</Label></Card>}
    {busy && <ActivityIndicator color={c.accent} />}
    <View style={s.wrap}>{!admin && <Action label={t('crud_retry')} disabled={saving || busy} onPress={() => void load()} />}{canManage && <Action tone={admin ? 'primary' : undefined} label={t('crud_add')} disabled={saving || busy || (!!error && !items.length)} onPress={() => openEditor()} />}</View>
    {noFamily && <Label>{t('crud_no_family')}</Label>}
    {editor && <Card>
      <Label heading>{t(editor.id ? 'crud_edit' : 'crud_add')}</Label>
      {input(`${t('crud_title')} * (200)`, title, setTitle, 200)}
      {input(`${t(reminders ? 'crud_note' : 'crud_message')} ${reminders ? '(2000)' : '* (5000)'}`, body, setBody, reminders ? 2000 : 5000, true)}
      {reminders ? <>
        {!editor.id && <><Label>{t('crud_chore')} *</Label>{!chores.length && <Label>{t('crud_no_chores')}</Label>}{chores.map(ch => <Action key={ch.id} label={ch.title} selected={chore === ch.id} disabled={saving} onPress={() => setChore(ch.id)} />)}</>}
        {input(`${t('crud_time')} *`, time, setTime, 16)}
      </> : <View style={s.wrap}>{(['draft', 'published'] as const).map(st => <Action key={st} label={t(st === 'draft' ? 'crud_draft' : 'crud_published')} selected={status === st} disabled={saving || (status === 'published' && !!items.find(i => i.id === editor.id && 'published_at' in i && i.published_at))} onPress={() => setStatus(st)} />)}</View>}
      <View style={s.wrap}><Action tone={admin ? 'primary' : undefined} label={t(saving ? 'crud_saving' : 'crud_save')} disabled={saving || (reminders && !editor.id && !chores.length)} onPress={save} /><Action label={t('crud_cancel')} disabled={saving} onPress={() => setEditor(null)} /></View>
    </Card>}
    {detail && <Card><Label heading>{detail.title}</Label><Label>{'note' in detail ? detail.note : detail.message}</Label>
      {'remind_at' in detail && <><Label>{detail.chore_name || t('crud_unavailable')}</Label><Label>{date(detail.remind_at)}</Label></>}
      <Label>{labelStatus(detail)}</Label><Label muted>{t('crud_created')}: {date(detail.created_at)}</Label><Label muted>{t('crud_updated')}: {date(detail.updated_at)}</Label>
      {'published_at' in detail && detail.published_at && <Label muted>{t('crud_published')}: {date(detail.published_at)}</Label>}
      <Action label={t('crud_cancel')} disabled={saving} onPress={() => setDetail(null)} />
    </Card>}
    {deleting && <Card><Label heading>{t('crud_confirm')}</Label><Label>{deleting.title}</Label><View style={s.wrap}>
      <Action tone={admin ? 'danger' : undefined} label={t(saving ? 'crud_saving' : 'crud_delete')} disabled={saving} onPress={() => void action(async () => { if (reminders) await reminderService.delete(deleting.id); else await announcementService.delete(deleting.id); setDeleting(null); setDetail(null); setEditor(null); setNotice(t('crud_deleted')); await load(); })} />
      <Action label={t('crud_cancel')} disabled={saving} onPress={() => setDeleting(null)} /></View></Card>}
    {input(t('crud_search'), query, setQuery, 200)}
    <View style={s.wrap}>{(reminders ? ['all', 'upcoming', 'past'] : canManage ? ['all', 'draft', 'published'] : ['all']).map(f => <Action key={f} label={t(`crud_${f}` as TranslationKey)} selected={filter === f} disabled={saving} onPress={() => setFilter(f)} />)}</View>
    {!busy && !error && !noFamily && !shown.length && <Label>{t('crud_empty')}</Label>}
    {shown.map(item => <Card key={item.id}><Label heading>{item.title}</Label>
      {'remind_at' in item ? <><Label>{item.chore_name || t('crud_unavailable')}</Label><Label muted>{date(item.remind_at)}</Label></> : <Label muted>{date(item.published_at || item.created_at)}</Label>}
      <Label>{labelStatus(item)}</Label><View style={s.wrap}>
        <Action label={t('crud_view')} disabled={saving} onPress={() => void action(async () => { setDetail(reminders ? (await reminderService.get(item.id)).reminder : (await announcementService.get(item.id)).announcement); setEditor(null); setDeleting(null); reveal(); })} />
        {canManage && <><Action label={t('crud_edit')} disabled={saving || (reminders && item.status !== 'pending')} onPress={() => void action(async () => openEditor(reminders ? (await reminderService.get(item.id)).reminder : (await announcementService.get(item.id)).announcement))} />
          <Action tone={admin ? 'danger' : undefined} label={t('crud_delete')} disabled={saving} onPress={() => { setDeleting(item); setEditor(null); setDetail(null); reveal(); }} /></>}
      </View></Card>)}
  </ScrollView></SafeAreaView>;
}
