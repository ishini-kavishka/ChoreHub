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
  const [vibrate, setVibrate] = useState(true), [quickMinutes, setQuickMinutes] = useState<number | null>(null);
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
      if (reminders) { const [r, ch] = await Promise.all([reminderService.list(), reminderService.chores()]); setItems(r.reminders); setChores(ch.chores);
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
    setChore(item && 'chore_id' in item ? item.chore_id || '' : ''); setStatus(item?.status || 'draft');
    setSound(item && 'sound' in item ? item.sound !== false : true);
    setVibrate(item && 'vibrate' in item ? item.vibrate !== false : true); setQuickMinutes(null); setPicker(null);
    reveal();
  };
  const save = () => void action(async () => {
    if (!title.trim() || title.trim().length > 200 || body.trim().length > (reminders ? 2000 : 5000) || (!reminders && !body.trim())) throw new Error(t('crud_required'));
    if (reminders) {
    const iso = parseLocalTime(time); if (!iso) throw new Error(t('crud_future'));
      const result = await reminderService.save(editor?.id, { title, note: body, remind_at: iso, ...(!admin ? { vibrate, sound } : {}), ...(!editor?.id ? { chore_id: chore || undefined } : {}) });
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
    const chosen = chores.find(ch => ch.id === chore);
    const due = chosen?.due_date;
    const chooseChore = (id: string) => { setChore(id); setQuickMinutes(null); };
    const chooseQuick = (minutes: number | null) => {
      setQuickMinutes(minutes); if (minutes !== null && due) setTime(localInput(new Date(Date.parse(due) - minutes * 60_000).toISOString()));
    };
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [calendarViewDate, setCalendarViewDate] = useState(() => {
      const parts = time.split(' ')[0]?.split('-');
      if (parts && parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) return new Date(y, m, 1);
      }
      return new Date();
    });

    const openPickerMode = (mode: 'date' | 'time') => {
      if (mode === 'date') {
        const parts = time.split(' ')[0]?.split('-');
        if (parts && parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(y) && !isNaN(m)) setCalendarViewDate(new Date(y, m, 1));
        }
        setShowCalendarModal(true);
      } else {
        setShowTimeModal(true);
      }
    };

    const timeField = (mode: 'date' | 'time') => {
      const isDate = mode === 'date';
      const label = `${t(isDate ? 'reminder_date' : 'reminder_time')} *`;
      const val = isDate ? time.split(' ')[0] : time.split(' ')[1] || '';
      const iconName = isDate ? 'calendar-outline' : 'time-outline';

      const updateVal = (v: string) => {
        setQuickMinutes(null);
        if (isDate) {
          setTime(`${v} ${time.split(' ')[1] || ''}`);
        } else {
          setTime(`${time.split(' ')[0]} ${v}`);
        }
      };

      return (
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{label}</Text>
          <View
            style={[
              s.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                borderRadius: 12,
                height: 50,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
              },
            ]}
          >
            <TextInput
              accessibilityLabel={label}
              value={val}
              onChangeText={updateVal}
              maxLength={isDate ? 10 : 5}
              editable={!saving}
              placeholder={isDate ? 'YYYY-MM-DD' : 'HH:mm'}
              placeholderTextColor={colors.textSecondary}
              style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '500', paddingVertical: 0 }}
            />
            <Pressable
              disabled={saving}
              onPress={() => openPickerMode(mode)}
              hitSlop={8}
              accessibilityLabel={`Open ${mode} picker`}
              accessibilityRole="button"
              style={({ pressed }) => [{ paddingLeft: 8, opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name={iconName} size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      );
    };
    const renderCalendarModal = () => {
      if (!showCalendarModal) return null;

      const year = calendarViewDate.getFullYear();
      const month = calendarViewDate.getMonth();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const firstDayIndex = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const prevMonthDays = new Date(year, month, 0).getDate();

      const cells: Array<{ day: number; currentMonth: boolean; dateStr: string }> = [];

      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const m = month === 0 ? 11 : month - 1;
        const y = month === 0 ? year - 1 : year;
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, currentMonth: false, dateStr });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, currentMonth: true, dateStr });
      }

      const remaining = (cells.length > 35 ? 42 : 35) - cells.length;
      for (let d = 1; d <= remaining; d++) {
        const m = month === 11 ? 0 : month + 1;
        const y = month === 11 ? year + 1 : year;
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, currentMonth: false, dateStr });
      }

      const currentDateVal = time.split(' ')[0] || '';

      const changeMonth = (delta: number) => {
        setCalendarViewDate(new Date(year, month + delta, 1));
      };

      const selectDate = (dateStr: string) => {
        setQuickMinutes(null);
        const currentTimePart = time.split(' ')[1] || '09:00';
        setTime(`${dateStr} ${currentTimePart}`);
        setShowCalendarModal(false);
      };

      return (
        <Modal visible animationType="fade" transparent onRequestClose={() => setShowCalendarModal(false)}>
          <Pressable onPress={() => setShowCalendarModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <Pressable style={{ width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
                  <Ionicons name="chevron-back" size={20} color={colors.primary} />
                </Pressable>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                  {`${monthNames[month]} ${year}`}
                </Text>
                <Pressable onPress={() => changeMonth(1)} style={{ padding: 8 }}>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </Pressable>
              </View>

              {/* Weekday Labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {dayNames.map(d => (
                  <Text key={d} style={{ width: 40, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {cells.map((cell, idx) => {
                  const isSelected = cell.dateStr === currentDateVal;
                  return (
                    <Pressable
                      key={`${cell.dateStr}-${idx}`}
                      onPress={() => selectDate(cell.dateStr)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        marginVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#FFFFFF' : cell.currentMonth ? colors.textPrimary : colors.textSecondary + '60',
                        }}
                      >
                        {cell.day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Close */}
              <Pressable
                onPress={() => setShowCalendarModal(false)}
                style={{ backgroundColor: colors.surface, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>{t('crud_cancel')}</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      );
    };

    const renderTimeModal = () => {
      if (!showTimeModal) return null;

      const presets = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
      const currentTimeVal = time.split(' ')[1] || '';

      const selectTime = (tVal: string) => {
        setQuickMinutes(null);
        const currentDatePart = time.split(' ')[0] || localInput(new Date().toISOString()).split(' ')[0];
        setTime(`${currentDatePart} ${tVal}`);
        setShowTimeModal(false);
      };

      return (
        <Modal visible animationType="fade" transparent onRequestClose={() => setShowTimeModal(false)}>
          <Pressable onPress={() => setShowTimeModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <Pressable style={{ width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' }}>
                {t('reminder_time')}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {presets.map(tVal => {
                  const isSel = tVal === currentTimeVal;
                  return (
                    <Pressable
                      key={tVal}
                      onPress={() => selectTime(tVal)}
                      style={{
                        backgroundColor: isSel ? colors.primary : colors.surface,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: isSel ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ color: isSel ? '#FFFFFF' : colors.textPrimary, fontWeight: '700', fontSize: 15 }}>
                        {tVal}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => setShowTimeModal(false)}
                style={{ backgroundColor: colors.surface, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>{t('crud_cancel')}</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      );
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
      {renderCalendarModal()}
      {renderTimeModal()}
      <View style={[s.header, { borderColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('admin_back')} disabled={saving} style={s.icon} onPress={clientBack}><Ionicons name="arrow-back" size={24} color={colors.primary}/></Pressable>
        <View style={{ flex: 1 }}>{text(heading, false, true)}</View>
        {!editor && !detail && <Pressable accessibilityRole="button" accessibilityLabel={t('crud_retry')} disabled={saving || busy} style={s.icon} onPress={() => void load()}><Ionicons name="refresh-outline" size={22} color={colors.primary}/></Pressable>}
      </View>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.body, { maxWidth: 560, padding: 16, gap: 12 }]}>
        {!!error && <Text accessibilityRole="alert" style={{ color: c.error, lineHeight: 22 }}>{translateFeedback(error, t)}</Text>}
        {!!notice && text(notice)}
        {busy && <ActivityIndicator color={colors.primary}/>}
        {editor ? (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 20, padding: 20, gap: 16 }]}>
            {/* Reminder Title */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                {`${t('reminder_title')} *`}
              </Text>
              <TextInput
                accessibilityLabel={`${t('reminder_title')} *`}
                value={title}
                onChangeText={setTitle}
                maxLength={200}
                editable={!saving}
                style={[
                  s.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    borderRadius: 12,
                    minHeight: 50,
                    paddingHorizontal: 16,
                  },
                ]}
              />
            </View>

            {/* Note (optional) */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                {t('crud_note')}
              </Text>
              <TextInput
                accessibilityLabel={t('crud_note')}
                value={body}
                onChangeText={setBody}
                maxLength={2000}
                editable={!saving}
                multiline
                style={[
                  s.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    borderRadius: 12,
                    minHeight: 100,
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                    textAlignVertical: 'top',
                  },
                ]}
              />
            </View>

            {!!due && (
              <View style={{ gap: 6 }}>
                {text(`${t('reminder_due')}: ${date(due)}`, true)}
                {text(t('reminder_before'))}
                <View style={s.wrap}>
                  {[5, 10, 15, 30, 60, null].map(minutes => (
                    <Pressable
                      key={String(minutes)}
                      accessibilityRole="radio"
                      accessibilityLabel={t(minutes === null ? 'reminder_custom' : `reminder_before_${minutes}` as TranslationKey)}
                      accessibilityState={{ selected: quickMinutes === minutes, disabled: saving }}
                      disabled={saving}
                      onPress={() => chooseQuick(minutes)}
                      style={[s.action, { backgroundColor: quickMinutes === minutes ? colors.primary : colors.surface, borderRadius: 10 }]}
                    >
                      <Text style={{ color: quickMinutes === minutes ? '#fff' : colors.primary }}>
                        {t(minutes === null ? 'reminder_custom' : `reminder_before_${minutes}` as TranslationKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Reminder Date */}
            {timeField('date')}

            {/* Reminder Time */}
            {timeField('time')}

            {/* DateTimePicker modal for native */}
            {picker && React.createElement(require('@react-native-community/datetimepicker').default, {
              value: new Date(parseLocalTime(time) || new Date(Date.now() + 60_000).toISOString()), mode: picker,
              onChange: (event: { type: string }, value?: Date) => { setPicker(null); if (event.type !== 'dismissed' && value) { setTime(localInput(value.toISOString())); setQuickMinutes(null); } },
            })}

            {/* Helper Subtext */}
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: -4 }}>
              {t('reminder_local_time')}
            </Text>

            {/* Alert Section */}
            <View style={{ gap: 12, marginTop: 4 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                {t('reminder_alert')}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
                  {t('reminder_sound')}
                </Text>
                <Switch
                  accessibilityLabel={t('reminder_sound')}
                  value={sound}
                  disabled={saving}
                  onValueChange={setSound}
                  trackColor={{ false: '#CBD5E1', true: colors.primary }}
                  thumbColor={sound ? '#10B981' : '#F1F5F9'}
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
                  {t('reminder_vibrate')}
                </Text>
                <Switch
                  accessibilityLabel={t('reminder_vibrate')}
                  value={vibrate}
                  disabled={saving}
                  onValueChange={setVibrate}
                  trackColor={{ false: '#CBD5E1', true: colors.primary }}
                  thumbColor={vibrate ? '#10B981' : '#F1F5F9'}
                />
              </View>
            </View>

            {/* Primary Action Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(saving ? 'crud_saving' : editor.id ? 'reminder_save_changes' : 'reminder_create')}
              disabled={saving}
              onPress={save}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 8,
                  opacity: saving ? 0.6 : pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                {t(saving ? 'crud_saving' : editor.id ? 'reminder_save_changes' : 'reminder_create')}
              </Text>
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('crud_cancel')}
              disabled={saving}
              onPress={clientBack}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.isDark ? colors.surface : '#F0EAFF',
                  borderRadius: 14,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>
                {t('crud_cancel')}
              </Text>
            </Pressable>
          </View>
        ) : detail && 'remind_at' in detail ? card(<>
          {text(detail.title, false, true)}
          {!!detail.note && <>{text(t('crud_note'), true)}{text(detail.note)}</>}
          {text(`${t('reminder_sound')}: ${detail.sound !== false ? '?' : '?'} ? ${t('reminder_vibrate')}: ${detail.vibrate !== false ? '?' : '?'}`, true)}
          {text(t('reminder_chore'), true)}{text(detail.chore_name || t(detail.chore_id ? 'crud_unavailable' : 'reminder_no_chore'))}
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
          {shown.map(item => 'remind_at' in item && <View key={item.id}>{card(<>{text(item.title, false, true)}{text(item.chore_name || t(item.chore_id ? 'crud_unavailable' : 'reminder_no_chore'), true)}{schedule(item)}
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
