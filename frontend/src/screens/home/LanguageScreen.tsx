import { translateFeedback } from '@/i18n/translations';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
/**
 * LanguageScreen
 * Accessible from: Profile → App Settings → Settings → Language
 * Back navigates to: /home/settings
 *
 * Displays the shared catalog; unavailable translations cannot be selected.
 * Selected language is applied immediately across the whole app.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Language, translations } from '@/i18n/translations';
import { SupportedLanguageItem } from '@/services/settingsService';

const purple = '#7C5CFC';

export default function LanguageScreen({ settingsPath = '/home/settings', familyId }: { settingsPath?: '/home/settings' | '/admin/settings'; familyId?: string }) {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const { language, setLanguage, t, availableLanguages, refreshAvailableLanguages } = useLanguage();
  const dark = colors.isDark;
  const bg = colors.background;
  const card = colors.card;
  const fg = colors.textPrimary;
  const muted = colors.textSecondary;
  const border = colors.border;

  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<Language | null>(null);

  // Refresh available languages from admin configuration on screen focus
  useFocusEffect(
    useCallback(() => {
      void refreshAvailableLanguages().catch(() => setError(t('admin_error')));
    }, [refreshAvailableLanguages, t])
  );

  const goBack = useCallback(() => router.navigate({ pathname: settingsPath, ...(familyId ? { params: { family_id: familyId } } : {}) }), [settingsPath, familyId]);

  // Hardware back button → Settings
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]));

  const clientVisibleLanguages = availableLanguages;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientVisibleLanguages;
    return clientVisibleLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native_name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [clientVisibleLanguages, search]);

  const selectLanguage = useCallback(
    async (code: Language) => {
      if (code === language || saving) return;
      setSaving(code);
      try {
        setError('');
        await setLanguage(code, true);
      } catch {
        setError(t('admin_save_error'));
      } finally {
        setSaving(null);
      }
    },
    [language, saving, setLanguage, t]
  );


  // ── Row renderer ──
  const renderItem = ({ item }: { item: SupportedLanguageItem }) => {
    const isSelected = item.code === language;
    const isSaving = saving === item.code;
    const selectable = item.is_enabled && item.translation_supported && Object.hasOwn(translations, item.code);
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected, checked: isSelected, disabled: !selectable || saving !== null }}
        disabled={!selectable || saving !== null}
        accessibilityLabel={`${item.name} (${item.native_name})`}
        onPress={() => void selectLanguage(item.code as Language)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: card, borderColor: isSelected ? purple : border },
          isSelected && styles.rowSelected,
          !selectable && { opacity: 0.55 },
          pressed && { opacity: 0.75 },
        ]}
      >
        {/* Flag + Names */}
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.nameWrap}>
          <Text style={[styles.langName, { color: fg }]}>{item.native_name}</Text>
          <Text style={[styles.nativeName, { color: muted }]}>{item.name}</Text>
          {!selectable && <Text style={[styles.nativeName, { color: muted }]}>{t(item.translation_supported ? 'disabled_by_admin' : 'ui_translations_unavailable')}</Text>}
        </View>
        {/* Radio indicator */}
        <View
          style={[
            styles.radio,
            {
              borderColor: isSelected ? purple : (dark ? '#4B4870' : (themeColors.isDark ? themeColors.border : '#CBD5E1')),
              backgroundColor: isSelected ? purple : 'transparent',
            },
          ]}
        >
          {isSelected && <View style={styles.radioDot} />}
          {isSaving && !isSelected && (
            <View style={[styles.radioDot, { backgroundColor: muted }]} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable
          onPress={goBack}
          accessibilityLabel={t('go_back')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={26} color={fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: fg }]}>
          {t('language_screen_title')}
        </Text>
        {/* Spacer to keep title centred */}
        <View style={styles.backBtn} />
      </View>

      {/* ── Search Input ── */}
      <View style={[styles.searchWrap, { backgroundColor: card, borderColor: border }]}>
        <Ionicons name="search" size={18} color={muted} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('search_languages')}
          placeholderTextColor={muted}
          style={[styles.searchInput, { color: fg }]}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel={t('search_languages')}
        />
      </View>

      {/* ── Language List ── */}
      {!!error && <Text accessibilityRole="alert" style={{ color: fg, padding: 16 }}>{translateFeedback(error, t)}</Text>}
      <FlatList
        style={styles.scrollList}
        extraData={{ language, saving }}
        showsVerticalScrollIndicator
        data={filtered}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: muted }]}>{t('no_languages_found')}</Text>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  scrollList: { flex: 1, minHeight: 0 },
  safe: {
    flex: 1,
  },
  header: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  searchWrap: {
    width: '92%', maxWidth: 528, alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  list: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowSelected: {
    borderWidth: 2,
  },
  flag: {
    fontSize: 26,
    marginRight: 14,
  },
  nameWrap: {
    flex: 1,
  },
  langName: {
    fontSize: 16,
    fontWeight: '600',
  },
  nativeName: {
    fontSize: 13,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#fff'),
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
