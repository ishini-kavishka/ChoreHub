import { translateFeedback } from '@/i18n/translations';
import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/profile/Avatar';
import { profileService } from '@/services/profileService';
import * as ImagePicker from 'expo-image-picker';

export default function UpdateProfilePictureScreen() {
  const alert = useAppAlert();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [uri, setUri] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    profileService
      .getProfile()
      .then((p) => {
        setName(p.name);
        setUri(p.avatarUri);
      })
      .catch((err) => {
        setError(t('admin_error'));
      })
      .finally(() => {
        setFetching(false);
      });
  }, []);

  const choosePhoto = async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('ui_photo_library_access_is_required_to_choose_a_profile_picture'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUri(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    setUri(undefined);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await profileService.updateAvatar(uri || '');
      alert(t('ui_profile_picture_updated'), t('ui_your_new_profile_picture_has_been_saved'), [
        { text: t('btn_done'), onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(t('admin_error'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#713DE8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header Row ── */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('ui_profile_picture')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* ── Subtitle ── */}
        <Text style={styles.subtitle}>{t('ui_choose_a_photo_that_helps_your_household_members_recognize_you')}</Text>

        {/* ── Error Banner ── */}
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{translateFeedback(error, t)}</Text>
          </View>
        ) : null}

        {/* ── Avatar Preview Card ── */}
        <View style={styles.previewCard}>
          <View style={styles.avatarWrapper}>
            <Avatar name={name} uri={uri} size={130} />
            <Pressable onPress={choosePhoto} style={styles.cameraBadge}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.hintText}>{t('ui_a_square_photo_looks_best')}</Text>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.buttonStack}>
          {/* Select Photo Button */}
          <Pressable
            onPress={choosePhoto}
            style={({ pressed }) => [styles.selectBtn, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name="image-outline" size={20} color="#713DE8" />
            <Text style={styles.selectBtnText}>{t('ui_select_a_photo')}</Text>
          </Pressable>

          {/* Remove Photo Button (if uri exists) */}
          {uri ? (
            <Pressable
              onPress={removePhoto}
              style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.removeBtnText}>{t('ui_remove_photo')}</Text>
            </Pressable>
          ) : null}

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.88 }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{t('ui_save_profile_picture')}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Header Row ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },

  // ── Error Banner ──
  errorCard: {
    width: '100%',
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEE2E2'),
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.error : '#DC2626'),
    fontWeight: '600',
    flex: 1,
  },

  // ── Avatar Preview Card ──
  previewCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: (themeColors.isDark ? themeColors.border : '#FFFFFF'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 4,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },

  // ── Button Stack ──
  buttonStack: {
    gap: 12,
  },
  selectBtn: {
    width: '100%',
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#713DE8',
  },
  selectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#713DE8',
  },
  removeBtn: {
    width: '100%',
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF2F2'),
    borderRadius: 18,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  saveBtn: {
    width: '100%',
    backgroundColor: '#713DE8',
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
