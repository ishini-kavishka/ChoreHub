import { translateFeedback } from '@/i18n/translations';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useSettingsBack } from '@/hooks/useSettingsBack';
import { adminComponent04Service, Household } from '@/services/adminComponent04Service';
import { NotificationSettings, settingsService, UserPreferences } from '@/services/settingsService';
import { Action, AdminSettingsGate, AdminPage, Label, s, useAdminColors } from './AdminComponent04Shared';

export default function AdminSettingsScreen() { return <AdminSettingsGate>{h => <Settings household={h} />}</AdminSettingsGate>; }
function Settings({ household }: { household: Household }) {
  const { t } = useLanguage(); const { preference: themePreference } = useAppTheme(); const c = useAdminColors();
  const goBack = useSettingsBack('/admin/profile');
  const [name, setName] = useState(household.name); const [savedName, setSavedName] = useState(household.name);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [busy, setBusy] = useState(true); const [saving, setSaving] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<'name' | null>(null);
  const load = useCallback(async () => {
    if (lock.current) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const [notifications] = await Promise.all([
        settingsService.getNotificationSettings(true),
        settingsService.getPreferences(true),
      ]);
      setSettings(notifications);

    } catch { setSettings(null); setError(t('admin_error')); }
    finally { setBusy(false); }
  }, [t]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const save = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError(''); setNotice('');
    try { await operation(); setNotice(t('settings_saved')); }
    catch { setError(t('admin_save_error')); }
    finally { lock.current = false; setSaving(false); }
  };
  const toggleEditor = (next: typeof editor) => setEditor(editor === next ? null : next);
  const themeLabel = (theme: UserPreferences['theme']) => theme === 'system' ? t('admin_system_theme') : t(theme === 'light' ? 'light_theme' : 'dark_theme');
  const section = (title: string, children: React.ReactNode) => <View style={[styles.section, { backgroundColor: c.soft, borderColor: c.border }]}><Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text><View style={[styles.rows, { backgroundColor: c.card }]}>{children}</View></View>;
  const row = (label: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void, value?: string, inline = false, expanded = false) => <Pressable accessibilityRole="button" accessibilityLabel={`${label}${value ? `, ${value}` : ''}`} accessibilityState={{ disabled: saving || busy, expanded }} disabled={saving || busy} onPress={onPress} style={({ pressed }) => [styles.row, { borderColor: c.border, opacity: pressed ? .65 : 1 }]}>
    <View style={[styles.icon, { backgroundColor: c.soft }]}><Ionicons name={icon} size={19} color={c.accent} /></View>
    <View style={styles.label}><Text style={[styles.primary, { color: c.text }]}>{label}</Text>{value && !inline && <Text style={[styles.secondary, { color: c.muted }]}>{value}</Text>}</View>
    {value && inline && <Text style={[styles.secondary, { color: c.muted }]}>{value}</Text>}<Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={17} color={c.muted} />
  </Pressable>;
  const open = (pathname: '/admin/notification-settings' | '/admin/reminder-time' | '/admin/preferences' | '/admin/language' | '/admin/about') => router.push({ pathname, params: { family_id: household.id } });
  return <AdminPage title={t('menu_app_settings')} household={{ ...household, name: savedName }} busy={busy} error={translateFeedback(error, t)} refresh={() => void load()} compactHeader onBack={goBack}>
    {section(t('admin_household'), <>
      {row(t('admin_name'), 'person-outline', () => toggleEditor('name'), savedName, false, editor === 'name')}
      {editor === 'name' && <View style={styles.editor}><Label muted>{t('admin_shared')}</Label><TextInput accessibilityLabel={t('admin_name')} value={name} onChangeText={setName} editable={!saving} maxLength={100} style={[s.input, { color: c.text, backgroundColor: c.bg, borderColor: c.border }]} />
        <Action label={saving ? t('admin_saving') : t('admin_save')} disabled={saving || name.trim() === savedName} onPress={() => {
          if (!name.trim() || name.trim().length > 100) { setError(t('admin_name_invalid')); return; }
          void save(async () => { const result = await adminComponent04Service.rename(household.id, name.trim()); setSavedName(result.household.name); setName(result.household.name); setEditor(null); });
        }} /></View>}
    </>)}
    {section(t('admin_app'), <>
      {row(t('notification_settings'), 'notifications-outline', () => open('/admin/notification-settings'), t('notification_settings_sub'))}
      {row(t('reminder_time'), 'time-outline', () => open('/admin/reminder-time'), settings ? t(({ '10min': '10_min', '30min': '30_min', '1hour': '1_hour', '1day': '1_day' } as const)[settings.reminder_time]) : t('reminder_time_sub'))}
      {row(t('theme'), 'color-palette-outline', () => open('/admin/preferences'), `${t('theme_sub')} · ${themeLabel(themePreference)}`)}
      {row(t('language'), 'globe-outline', () => open('/admin/language'), t('language_sub'))}
      {row(t('about_app'), 'information-circle-outline', () => open('/admin/about'), t('about_app_sub'))}
      {row(t('admin_privacy'), 'shield-checkmark-outline', () => router.push('/profile/change-password'))}
    </>)}
    {(saving || !!notice) && <Text accessibilityLiveRegion="polite" style={[styles.secondary, { color: c.accent }]}>{saving ? t('admin_saving') : notice}</Text>}
  </AdminPage>;
}
const styles = StyleSheet.create({
  section: { borderRadius: 22, padding: 6, overflow: 'hidden', borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 12 },
  rows: { borderRadius: 17, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 76, paddingHorizontal: 14, paddingVertical: 15, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, minWidth: 0 }, primary: { fontSize: 16, fontWeight: '700' }, secondary: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  editor: { padding: 14, gap: 12 },
});
