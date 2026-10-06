import { translateFeedback } from '@/i18n/translations';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { choreService, ChoreItem } from '@/services/choreService';
import { notificationService } from '@/services/notificationService';
import { ApiError } from '@/services/api';

export default function PrivateChoreMessageForm({ visible, initialChoreId, onClose, onSent }: {
  visible: boolean; initialChoreId?: string; onClose: () => void; onSent: () => void;
}) {
  const { colors: c } = useAppTheme(), { t, language } = useLanguage();
  const [chores, setChores] = useState<ChoreItem[]>([]), [selected, setSelected] = useState('');
  const [message, setMessage] = useState(''), [error, setError] = useState('');
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [expanded, setExpanded] = useState(false);
  const lock = useRef(false), generation = useRef(0);
  const load = async () => {
    const version = ++generation.current;
    setLoading(true); setError('');
    try {
      const result = await choreService.getMemberChores();
      if (version !== generation.current) return;
      setChores(result.chores);
      setSelected(result.chores.some(chore => chore.id === initialChoreId) ? initialChoreId! : '');
    } catch { if (version === generation.current) setError(t('pm_load_error')); }
    finally { if (version === generation.current) setLoading(false); }
  };
  useEffect(() => {
    if (visible) { setMessage(''); setChores([]); setSelected(''); setExpanded(false); void load(); }
    return () => { generation.current++; };
  }, [visible, initialChoreId]);
  const close = () => { if (!lock.current) onClose(); };
  const send = async () => {
    if (lock.current || loading) return;
    if (!chores.some(chore => chore.id === selected) || !message.trim() || message.trim().length > 500) { setError(t('pm_valid')); return; }
    lock.current = true; setSaving(true); setError('');
    try { await notificationService.sendChoreMessage(selected, message.trim()); setMessage(''); onSent(); onClose(); }
    catch (error) {
      setError(t(error instanceof ApiError && error.status===409 ? 'pm_no_admin' : error instanceof ApiError && error.status===404 ? 'pm_not_assigned' : error instanceof ApiError && [401,403].includes(error.status || 0) ? 'pm_session_error' : 'pm_send_error'));
    }
    finally { lock.current = false; setSaving(false); }
  };
  const chosen = chores.find(chore => chore.id === selected);
  const buttonStyle = { padding: 12, borderRadius: 22, backgroundColor: c.surface };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,.4)' }}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, maxHeight: '85%', width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: c.card, borderRadius: 24 }} contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.textPrimary }}>{t('pm_message_admin')}</Text>
        <Text style={{ color: c.textSecondary }}>{t('pm_private')}</Text>
        {loading ? <ActivityIndicator color={c.primary} /> : <>
          <Pressable accessibilityRole="button" accessibilityLabel={t('pm_select_chore')} accessibilityState={{ expanded }} disabled={saving || !chores.length} onPress={() => setExpanded(!expanded)} style={buttonStyle}>
            <Text style={{ color: c.primary }}>{chosen?.title || t('pm_select_chore')} ▾</Text>
          </Pressable>
          {expanded && chores.map(chore => <Pressable key={chore.id} accessibilityRole="button" accessibilityState={{ selected: selected === chore.id }} disabled={saving} onPress={() => { setSelected(chore.id); setExpanded(false); }} style={{ padding: 10, borderBottomWidth: 1, borderColor: c.border }}>
            <Text style={{ color: selected === chore.id ? c.primary : c.textPrimary }}>{chore.title}</Text>
          </Pressable>)}
          {!chores.length && !error && <Text style={{ color: c.textSecondary }}>{t('pm_no_chores')}</Text>}
          {chosen?.due_date && <Text style={{ color: c.textSecondary }}>{t('pm_assigned_time')}: {new Date(chosen.due_date).toLocaleString(language)}</Text>}
          <TextInput accessibilityLabel={t('pm_message')} placeholder={t('pm_message')} placeholderTextColor={c.textSecondary} value={message} onChangeText={value => setMessage(value.slice(0, 500))} multiline maxLength={500} editable={!saving} style={{ minHeight: 110, padding: 12, borderWidth: 1, borderColor: c.border, borderRadius: 14, color: c.textPrimary, textAlignVertical: 'top' }} />
          <Text style={{ color: c.textSecondary, textAlign: 'right' }}>{message.length}/500</Text>
        </>}
        {!!error && <Text accessibilityRole="alert" style={{ color: c.isDark ? '#FFAAA8' : '#B3261E' }}>{translateFeedback(error, t)}</Text>}
        {!loading && !chores.length && <Pressable accessibilityRole="button" accessibilityLabel={t('crud_retry')} disabled={saving} onPress={() => void load()} style={buttonStyle}><Text style={{ color: c.primary }}>{t('crud_retry')}</Text></Pressable>}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('cancel')} disabled={saving} onPress={close} style={buttonStyle}><Text style={{ color: c.primary }}>{t('cancel')}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('pm_send')} disabled={saving || loading || !chores.length} onPress={() => void send()} style={[buttonStyle, { backgroundColor: c.primary, opacity: saving || loading || !chores.length ? .5 : 1 }]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>{t('pm_send')}</Text>}</Pressable>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}
