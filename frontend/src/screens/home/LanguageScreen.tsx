/**
 * LanguageScreen
 * Accessible from: Profile → App Settings → Settings → Language
 * Back navigates to: /home/settings
 *
 * Displays only languages enabled by the Admin in supported_languages.
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
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/i18n/translations';
import { SupportedLanguageItem } from '@/services/settingsService';

const purple = '#7C5CFC';

export default function LanguageScreen() {
  const { colors } = useAppTheme();
  const { language, setLanguage, t, availableLanguages, refreshAvailableLanguages } = useLanguage();
  const dark = colors.isDark;
  const bg = colors.background;
  const card = colors.card;
  const fg = colors.textPrimary;
  const muted = colors.textSecondary;
  const border = colors.border;

  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<Language | null>(null);

  // Refresh available languages from admin configuration on screen focus
  useFocusEffect(
    useCallback(() => {
      void refreshAvailableLanguages();
    }, [refreshAvailableLanguages])
  );

  // Hardware back button → Settings
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.navigate('/home/settings' as any);
      return true;
    });
    return () => sub.remove();
  }, []);

  // Filter only admin-enabled languages, then by search query (name or native_name)
  const clientVisibleLanguages = useMemo(() => {
    // Only show admin-enabled languages to clients
    return availableLanguages.filter((l) => l.is_enabled);
  }, [availableLanguages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientVisibleLanguages;
    return clientVisibleLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native_name.toLowerCase().includes(q)
    );
  }, [clientVisibleLanguages, search]);

  const selectLanguage = useCallback(
    async (code: Language) => {
      if (code === language || saving) return;
      setSaving(code);
      try {
        await setLanguage(code, true);
      } finally {
        setSaving(null);
      }
    },
    [language, saving, setLanguage]
  );

  const goBack = () => router.navigate('/home/settings' as any);

  // ── Row renderer ──
  const renderItem = ({ item }: { item: SupportedLanguageItem }) => {
    const isSelected = item.code === language;
    const isSaving = saving === item.code;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${item.name} (${item.native_name})`}
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
          <Text style={[styles.nativeName, { color: muted }]}>{item.native_name}</Text>
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
      <FlatList
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
