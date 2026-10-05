import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme } from '@/context/ThemeContext';
import { adminComponent04Service, Household } from '@/services/adminComponent04Service';
import { DEFAULT_SUPPORTED_LANGUAGES, NotificationSettings, settingsService, UserPreferences } from '@/services/settingsService';
import { Action, AdminGate, AdminPage, Label, s, useAdminColors } from './AdminComponent04Shared';

export default function AdminSettingsScreen() { return <AdminGate>{h => <Settings household={h} />}</AdminGate>; }
function Settings({ household }: { household: Household }) {
  const { t, setLanguage } = useLanguage(); const { setTheme } = useAppTheme(); const c = useAdminColors();
  const [name, setName] = useState(household.name); const [savedName, setSavedName] = useState(household.name);
  const [settings, setSettings] = useState<NotificationSettings | null>(null); const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [busy, setBusy] = useState(true); const [saving, setSaving] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<'name' | 'language' | 'theme' | 'reminder' | null>(null);
  const [clientLangs, setClientLangs] = useState<typeof DEFAULT_SUPPORTED_LANGUAGES>(DEFAULT_SUPPORTED_LANGUAGES);
  const load = useCallback(async () => {
    if (lock.current) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const [notifications, preferences, langs] = await Promise.all([
        settingsService.getNotificationSettings(true),
        settingsService.getPreferences(true),
        settingsService.getSupportedLanguages().catch(() => DEFAULT_SUPPORTED_LANGUAGES),
      ]);
      setSettings(notifications); setPrefs(preferences); setClientLangs(langs);
      await setTheme(preferences.theme, false); await setLanguage(preferences.language);
    } catch { setSettings(null); setPrefs(null); setError(t('admin_error')); }
    finally { setBusy(false); }
  }, [t, setTheme, setLanguage]);
  useEffect(() => { void load(); }, [load]);
  const save = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError(''); setNotice('');
    try { await operation(); setNotice(t('settings_saved')); }
    catch { setError(t('admin_save_error')); }
    finally { lock.current = false; setSaving(false); }
  };
  const preference = (next: UserPreferences) => void save(async () => {
    const persisted = await settingsService.savePreferences(next);
    setPrefs(persisted); await setTheme(persisted.theme, false); await setLanguage(persisted.language); setEditor(null);
  });
  const toggleClientLang = (code: 'en' | 'si' | 'ta', enabled: boolean) => void save(async () => {
    const updated = await settingsService.updateSupportedLanguage(code, enabled);
    setClientLangs(prev => prev.map(l => l.code === code ? { ...l, is_enabled: updated.is_enabled } : l));
  });
  const toggleEditor = (next: typeof editor) => setEditor(editor === next ? null : next);
  const languages = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' };
  const themeLabel = (theme: UserPreferences['theme']) => theme === 'system' ? t('admin_system_theme') : t(theme === 'light' ? 'light_theme' : 'dark_theme');
  const section = (title: string, children: React.ReactNode) => <View style={[styles.section, { backgroundColor: c.soft }]}><Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text><View style={[styles.rows, { backgroundColor: c.card }]}>{children}</View></View>;
  const row = (label: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void, value?: string, inline = false, expanded = false) => <Pressable accessibilityRole="button" accessibilityLabel={`${label}${value ? `, ${value}` : ''}`} accessibilityState={{ disabled: saving || busy, expanded }} disabled={saving || busy} onPress={onPress} style={({ pressed }) => [styles.row, { borderColor: c.border, opacity: pressed ? .65 : 1 }]}>
    <View style={[styles.icon, { backgroundColor: c.soft }]}><Ionicons name={icon} size={19} color={c.accent} /></View>
    <View style={styles.label}><Text style={[styles.primary, { color: c.text }]}>{label}</Text>{value && !inline && <Text style={[styles.secondary, { color: c.muted }]}>{value}</Text>}</View>
    {value && inline && <Text style={[styles.secondary, { color: c.muted }]}>{value}</Text>}<Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={17} color={c.muted} />
  </Pressable>;
  return <AdminPage title={t('admin_settings')} household={{ ...household, name: savedName }} busy={busy} error={error} refresh={() => void load()} compactHeader>
    {section(t('admin_household'), <>
      {row(t('admin_name'), 'person-outline', () => toggleEditor('name'), savedName, false, editor === 'name')}
      {editor === 'name' && <View style={styles.editor}><Label muted>{t('admin_shared')}</Label><TextInput accessibilityLabel={t('admin_name')} value={name} onChangeText={setName} editable={!saving} maxLength={100} style={[s.input, { color: c.text, backgroundColor: c.bg, borderColor: c.border }]} />
        <Action label={saving ? t('admin_saving') : t('admin_save')} disabled={saving || name.trim() === savedName} onPress={() => {
          if (!name.trim() || name.trim().length > 100) { setError(t('admin_name_invalid')); return; }
          void save(async () => { const result = await adminComponent04Service.rename(household.id, name.trim()); setSavedName(result.household.name); setName(result.household.name); setEditor(null); });
        }} /></View>}
      {prefs && row(t('language'), 'globe-outline', () => toggleEditor('language'), languages[prefs.language], false, editor === 'language')}
      {prefs && editor === 'language' && <View style={styles.editor}>
        <View style={s.wrap}>{(['en', 'si', 'ta'] as const).map(lang => <Action key={lang} label={languages[lang]} selected={prefs.language === lang} disabled={saving} onPress={() => preference({ ...prefs, language: lang })} />)}</View>
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
          <Label muted>{t('admin_client_languages')}</Label>
          <View style={{ gap: 8, marginTop: 6 }}>
            {clientLangs.map((item) => (
              <View key={item.code} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>{item.flag}</Text>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{item.name} ({item.native_name})</Text>
                    {item.code === 'en' && <Text style={{ fontSize: 11, color: c.muted }}>{t('admin_lang_default_desc')}</Text>}
                  </View>
                </View>
                <Switch
                  value={item.is_enabled}
                  disabled={saving || busy || item.code === 'en'}
                  accessibilityLabel={`${item.name} availability`}
                  trackColor={{ false: c.border, true: '#713DE8' }}
                  thumbColor="#FFFFFF"
                  onValueChange={(val) => toggleClientLang(item.code, val)}
                />
              </View>
            ))}
          </View>
        </View>
      </View>}
    </>)}
    {settings && section(t('admin_notification_preferences'), <>
      {(['chore_reminders', 'due_date_alerts', 'weekly_summary'] as const).map((key, i) => {
        const label = t(key === 'due_date_alerts' ? 'admin_due' : key === 'weekly_summary' ? 'admin_weekly' : 'chore_reminders');
        return <View key={key} style={[styles.row, { borderColor: c.border }]}><View style={styles.icon}><Ionicons name={i === 2 ? 'calendar-outline' : 'notifications-outline'} size={19} color={c.text} /></View><Text style={[styles.primary, styles.label, { color: c.text }]}>{label}</Text>
          <Switch value={settings[key]} disabled={saving || busy} accessibilityLabel={label} trackColor={{ false: c.border, true: '#713DE8' }} thumbColor="#FFFFFF" onValueChange={value => void save(async () => { setSettings(await settingsService.saveNotificationSettings({ ...settings, [key]: value })); })} />
        </View>;
      })}
    </>)}
    {prefs && section(t('admin_app'), <>
      {row(t('theme'), 'settings-outline', () => toggleEditor('theme'), themeLabel(prefs.theme), true, editor === 'theme')}
      {editor === 'theme' && <View style={styles.editor}><View style={s.wrap}>{(['light', 'dark', 'system'] as const).map(theme => <Action key={theme} label={themeLabel(theme)} selected={prefs.theme === theme} disabled={saving} onPress={() => preference({ ...prefs, theme })} />)}</View></View>}
      {row(t('admin_privacy'), 'shield-checkmark-outline', () => router.push('/profile/change-password'))}
    </>)}
    {(saving || !!notice) && <Text accessibilityLiveRegion="polite" style={[styles.secondary, { color: c.accent }]}>{saving ? t('admin_saving') : notice}</Text>}
    {settings && <View><Pressable accessibilityRole="button" accessibilityState={{ expanded: editor === 'reminder' }} onPress={() => toggleEditor('reminder')} style={styles.extra}><Text style={{ color: c.muted }}>{t('reminder_time')}</Text><Ionicons name="chevron-down" size={16} color={c.muted} /></Pressable>
      {editor === 'reminder' && <View style={styles.editor}><View style={s.wrap}>{(['10min', '30min', '1hour', '1day'] as const).map((value, i) => <Action key={value} label={t((['10_min', '30_min', '1_hour', '1_day'] as const)[i])} selected={settings.reminder_time === value} disabled={saving || !settings.chore_reminders} onPress={() => void save(async () => { setSettings(await settingsService.saveNotificationSettings({ ...settings, reminder_time: value })); })} />)}</View><Label muted>{t('admin_delivery')}</Label></View>}
    </View>}
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/admin/about', params: { family_id: household.id } })} style={styles.extra}><Text style={{ color: c.muted }}>{t('about_app')}</Text><Ionicons name="chevron-forward" size={16} color={c.muted} /></Pressable>
  </AdminPage>;
}
const styles = StyleSheet.create({
  section: { borderRadius: 14, padding: 5, overflow: 'hidden' },
  sectionTitle: { fontSize: 14, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 10 },
  rows: { borderRadius: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 12, paddingVertical: 9, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 }, primary: { fontSize: 14, fontWeight: '500' }, secondary: { fontSize: 12, marginTop: 2 },
  editor: { padding: 14, gap: 12 }, extra: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, paddingHorizontal: 12 },
});
