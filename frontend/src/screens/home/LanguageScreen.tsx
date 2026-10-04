/**
 * LanguageScreen
 * Accessible from: Profile → App Settings → Settings → Language
 * Back navigates to: /home/settings
 *
 * Displays a searchable list of supported languages.
 * Only languages with COMPLETE translations in translations.ts are shown.
 * Selected language is applied immediately across the whole app.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { settingsService } from '@/services/settingsService';
import { Language } from '@/i18n/translations';

// ─── Supported Languages ───────────────────────────────────────────────────────
// IMPORTANT: Only add an entry here if translations.ts has a COMPLETE translation
// for that language code. Partial translations must NOT be shown.
const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English',  nativeName: 'English',   flag: '🌐' },
  { code: 'si', name: 'Sinhala',  nativeName: 'සිංහල',     flag: '🇱🇰' },
  { code: 'ta', name: 'Tamil',    nativeName: 'தமிழ்',     flag: '🇮🇳' },
];

const purple = '#7C5CFC';

// ─── Component ─────────────────────────────────────────────────────────────────
export default function LanguageScreen() {
  const { colors } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const dark = colors.isDark;
  const bg = colors.background;
  const card = colors.card;
  const fg = colors.textPrimary;
  const muted = colors.textSecondary;
  const border = colors.border;

  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<Language | null>(null);

  // Hardware back button → Settings
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.navigate('/home/settings' as any);
      return true;
    });
    return () => sub.remove();
  }, []);

  // Filter languages by search query (case-insensitive, matches name OR nativeName)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q)
    );
  }, [search]);

  const selectLanguage = useCallback(
    async (code: Language) => {
      if (code === language || saving) return;
      setSaving(code);
      try {
        await setLanguage(code);
        // Persist to backend (fire-and-forget — don't block UI)
        settingsService.savePreferences({ language: code }).catch(() => {});
      } finally {
        setSaving(null);
      }
    },
    [language, saving, setLanguage]
  );

  const goBack = () => router.navigate('/home/settings' as any);

  // ── Row renderer ──
  const renderItem = ({ item }: { item: typeof SUPPORTED_LANGUAGES[number] }) => {
    const isSelected = item.code === language;
    const isSaving = saving === item.code;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${item.name} (${item.nativeName})`}
        onPress={() => void selectLanguage(item.code)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: card, borderColor: isSelected ? purple : border },
          isSelected && styles.rowSelected,
          pressed && { opacity: 0.75 },
        ]}
      >
        {/* Flag + Names */}
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.nameWrap}>
          <Text style={[styles.langName, { color: fg }]}>{item.name}</Text>
          <Text style={[styles.nativeName, { color: muted }]}>{item.nativeName}</Text>
        </View>
        {/* Radio indicator */}
        <View
          style={[
            styles.radio,
            {
              borderColor: isSelected ? purple : (dark ? '#4B4870' : '#CBD5E1'),
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
          accessibilityLabel="Go back"
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
          accessibilityLabel="Search languages"
        />
      </View>

      {/* ── Language List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: muted }]}>No languages found</Text>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
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
    backgroundColor: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
