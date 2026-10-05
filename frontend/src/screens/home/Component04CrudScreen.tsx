import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';
import { Action, Card, Label, s, useAdminColors } from '../admin/AdminComponent04Shared';
import { Announcement, Reminder, announcementService, reminderService } from '@/services/component04CrudService';
import { familyService } from '@/services/familyService';

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
export default function Component04CrudScreen({ kind, familyId }: { kind: 'reminders' | 'announcements'; familyId?: string }) {
  const reminders = kind === 'reminders', c = useAdminColors(), { t, language } = useLanguage();
  const scroll = useRef<ScrollView>(null);
  const reveal = () => requestAnimationFrame(() => scroll.current?.scrollTo({ y: 0, animated: true }));
  const [items, setItems] = useState<RecordItem[]>([]), [chores, setChores] = useState<{ id: string; title: string }[]>([]);
  const [family, setFamily] = useState(familyId || ''), [canManage, setCanManage] = useState(reminders);
  const [busy, setBusy] = useState(true), [saving, setSaving] = useState(false), lock = useRef(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [noFamily, setNoFamily] = useState(false);
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState<{ id?: string } | null>(null), [detail, setDetail] = useState<RecordItem | null>(null), [deleting, setDeleting] = useState<RecordItem | null>(null);
  const [title, setTitle] = useState(''), [body, setBody] = useState(''), [time, setTime] = useState(''), [chore, setChore] = useState(''), [status, setStatus] = useState('draft');
  const load = useCallback(async () => {
    setBusy(true); setError(''); setItems([]);
    try {
      if (reminders) { const [r, ch] = await Promise.all([reminderService.list(), reminderService.chores()]); setItems(r.reminders); setChores(ch.chores); }
      else {
        const id = familyId || (await familyService.getMyFamily()).family?.id;
        setNoFamily(!id); if (!id) { setCanManage(false); return; }
        setFamily(id); const result = await announcementService.list(id); setItems(result.announcements); setCanManage(result.can_manage);
      }
    } catch (e) { setError(`${t('crud_load_error')} ${e instanceof Error ? e.message : ''}`); }
    finally { setBusy(false); }
  }, [reminders, familyId, t]);
  useFocusEffect(useCallback(() => { setEditor(null); setDetail(null); setDeleting(null); void load(); }, [load]));
  const action = async (fn: () => Promise<void>) => {
    if (lock.current) return; lock.current = true; setSaving(true); setError(''); setNotice('');
    try { await fn(); } catch (e) { setError(`${t('crud_save_error')} ${e instanceof Error ? e.message : ''}`); }
    finally { lock.current = false; setSaving(false); }
  };
  const openEditor = (item?: RecordItem) => {
    setDetail(null); setDeleting(null); setEditor(item ? { id: item.id } : {}); setError(''); setNotice('');
    setTitle(item?.title || ''); setBody(item ? ('note' in item ? item.note : item.message) : '');
    setTime(item && 'remind_at' in item ? localInput(item.remind_at) : localInput(new Date(Date.now() + 3600000).toISOString()));
    setChore(item && 'chore_id' in item ? item.chore_id || '' : ''); setStatus(item?.status || 'draft');
    reveal();
  };
  const save = () => void action(async () => {
    if (!title.trim() || title.trim().length > 200 || body.trim().length > (reminders ? 2000 : 5000) || (!reminders && !body.trim()) || (reminders && !editor?.id && !chore)) throw new Error(t('crud_required'));
    if (reminders) {
    const iso = parseLocalTime(time); if (!iso) throw new Error(t('crud_future'));
      await reminderService.save(editor?.id, { title, note: body, remind_at: iso, ...(!editor?.id ? { chore_id: chore } : {}) });
    } else await announcementService.save(family, editor?.id, { title, message: body, status });
    setEditor(null); setDetail(null); setNotice(t('crud_saved')); await load();
  });
  const date = (value: string) => new Date(value).toLocaleString(language);
  const labelStatus = (item: RecordItem) => t((`crud_${item.status}`) as TranslationKey);
  const shown = items.filter(item => `${item.title} ${'note' in item ? `${item.note} ${item.chore_name || ''}` : item.message}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
    (filter === 'all' || (reminders ? (filter === 'upcoming' ? item.status === 'pending' : 'remind_at' in item && Date.parse(item.remind_at) <= Date.now()) : item.status === filter)));
  const input = (label: string, value: string, change: (v: string) => void, max: number, multiline = false) => <View style={{ gap: 6 }}><Label>{label}</Label><TextInput accessibilityLabel={label} value={value} onChangeText={change} maxLength={max} multiline={multiline} editable={!saving} style={[s.input, { color: c.text, borderColor: c.border, minHeight: multiline ? 100 : 48 }]} /></View>;
  return <SafeAreaView style={[s.fill, { backgroundColor: c.bg }]}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
    <Action label={t('admin_back')} disabled={saving} onPress={() => router.back()} />
    <Label heading>{t(reminders ? 'my_reminders' : canManage ? 'manage_announcements' : 'household_announcements')}</Label>
    {reminders && <Card><Label muted>{t('crud_delivery')}</Label></Card>}
    {!!error && <Card><Label>{error}</Label></Card>}{!!notice && <Card><Label>{notice}</Label></Card>}
    {busy && <ActivityIndicator color={c.accent} />}
    <View style={s.wrap}><Action label={t('crud_retry')} disabled={saving || busy} onPress={() => void load()} />{canManage && <Action label={t('crud_add')} disabled={saving || busy || (!!error && !items.length)} onPress={() => openEditor()} />}</View>
    {noFamily && <Label>{t('crud_no_family')}</Label>}
    {editor && <Card>
      <Label heading>{t(editor.id ? 'crud_edit' : 'crud_add')}</Label>
      {input(`${t('crud_title')} * (200)`, title, setTitle, 200)}
      {input(`${t(reminders ? 'crud_note' : 'crud_message')} ${reminders ? '(2000)' : '* (5000)'}`, body, setBody, reminders ? 2000 : 5000, true)}
      {reminders ? <>
        {!editor.id && <><Label>{t('crud_chore')} *</Label>{!chores.length && <Label>{t('crud_no_chores')}</Label>}{chores.map(ch => <Action key={ch.id} label={ch.title} selected={chore === ch.id} disabled={saving} onPress={() => setChore(ch.id)} />)}</>}
        {input(`${t('crud_time')} *`, time, setTime, 16)}
      </> : <View style={s.wrap}>{(['draft', 'published'] as const).map(st => <Action key={st} label={t(st === 'draft' ? 'crud_draft' : 'crud_published')} selected={status === st} disabled={saving || (status === 'published' && !!items.find(i => i.id === editor.id && 'published_at' in i && i.published_at))} onPress={() => setStatus(st)} />)}</View>}
      <View style={s.wrap}><Action label={t(saving ? 'crud_saving' : 'crud_save')} disabled={saving || (reminders && !editor.id && !chores.length)} onPress={save} /><Action label={t('crud_cancel')} disabled={saving} onPress={() => setEditor(null)} /></View>
    </Card>}
    {detail && <Card><Label heading>{detail.title}</Label><Label>{'note' in detail ? detail.note : detail.message}</Label>
      {'remind_at' in detail && <><Label>{detail.chore_name || t('crud_unavailable')}</Label><Label>{date(detail.remind_at)}</Label></>}
      <Label>{labelStatus(detail)}</Label><Label muted>{t('crud_created')}: {date(detail.created_at)}</Label><Label muted>{t('crud_updated')}: {date(detail.updated_at)}</Label>
      {'published_at' in detail && detail.published_at && <Label muted>{t('crud_published')}: {date(detail.published_at)}</Label>}
      <Action label={t('crud_cancel')} disabled={saving} onPress={() => setDetail(null)} />
    </Card>}
    {deleting && <Card><Label heading>{t('crud_confirm')}</Label><Label>{deleting.title}</Label><View style={s.wrap}>
      <Action label={t(saving ? 'crud_saving' : 'crud_delete')} disabled={saving} onPress={() => void action(async () => { if (reminders) await reminderService.delete(deleting.id); else await announcementService.delete(deleting.id); setDeleting(null); setDetail(null); setEditor(null); setNotice(t('crud_deleted')); await load(); })} />
      <Action label={t('crud_cancel')} disabled={saving} onPress={() => setDeleting(null)} /></View></Card>}
    {input(t('crud_search'), query, setQuery, 200)}
    <View style={s.wrap}>{(reminders ? ['all', 'upcoming', 'past'] : canManage ? ['all', 'draft', 'published'] : ['all']).map(f => <Action key={f} label={t(`crud_${f}` as TranslationKey)} selected={filter === f} disabled={saving} onPress={() => setFilter(f)} />)}</View>
    {!busy && !error && !noFamily && !shown.length && <Label>{t('crud_empty')}</Label>}
    {shown.map(item => <Card key={item.id}><Label heading>{item.title}</Label>
      {'remind_at' in item ? <><Label>{item.chore_name || t('crud_unavailable')}</Label><Label muted>{date(item.remind_at)}</Label></> : <Label muted>{date(item.published_at || item.created_at)}</Label>}
      <Label>{labelStatus(item)}</Label><View style={s.wrap}>
        <Action label={t('crud_view')} disabled={saving} onPress={() => void action(async () => { setDetail(reminders ? (await reminderService.get(item.id)).reminder : (await announcementService.get(item.id)).announcement); setEditor(null); setDeleting(null); reveal(); })} />
        {canManage && <><Action label={t('crud_edit')} disabled={saving || (reminders && item.status !== 'pending')} onPress={() => void action(async () => openEditor(reminders ? (await reminderService.get(item.id)).reminder : (await announcementService.get(item.id)).announcement))} />
          <Action label={t('crud_delete')} disabled={saving} onPress={() => { setDeleting(item); setEditor(null); setDetail(null); reveal(); }} /></>}
      </View></Card>)}
  </ScrollView></SafeAreaView>;
}
