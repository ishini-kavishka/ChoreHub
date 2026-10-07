import { translateFeedback } from '@/i18n/translations';
import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { profileService } from '@/services/profileService';

export default function ChangePasswordScreen() {
  const alert = useAppAlert();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async () => {
    if (!current) return setError(t('ui_enter_your_current_password'));
    if (password.length < 8) return setError(t('ui_your_new_password_must_be_at_least_8_characters'));
    if (password !== confirm) return setError(t('ui_your_new_passwords_do_not_match'));

    setLoading(true);
    setError('');
    try {
      await profileService.changePassword(current, password);
      alert(t('ui_password_updated'), t('password_updated_success'), [
        { text: t('btn_done'), onPress: () => router.back() },
      ]);
    } catch (requestError) {
      setError(t('admin_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top Header ── */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('admin_back')}
            >
              <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
            </Pressable>

            <Text style={styles.headerTitle}>{t('change_password_title')}</Text>

            <View style={styles.headerPlaceholder} />
          </View>

          {/* ── Center Lock Illustration (matching reference) ── */}
          <View style={styles.illustrationArea}>
            <View style={styles.illustrationContainer}>
              {/* Cyan/Blue circular cycle arrow */}
              <View style={styles.archArrowWrap}>
                <Ionicons name="sync-outline" size={76} color="#0284C7" />
              </View>

              {/* Purple lock body */}
              <View style={styles.lockIconWrap}>
                <Ionicons name="lock-closed" size={48} color="#713DE8" />
              </View>

              {/* Speech bubble with *** */}
              <View style={styles.asteriskBubble}>
                <Ionicons name="chatbubble" size={38} color="#8B5CF6" />
                <View style={styles.asteriskTextOverlay}>
                  <Text style={styles.asteriskText}>✱✱✱</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Error Banner ── */}
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{translateFeedback(error, t)}</Text>
            </View>
          ) : null}

          {/* ── Main Lavender Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('ui_choose_a_new_password')}</Text>
            <Text style={styles.cardSubtitle}>{t('ui_enter_and_confirm_your_new_password_to_regain_access')}</Text>

            {/* 1. Old Password */}
            <Text style={styles.inputLabel}>{t('ui_old_password')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={current}
                onChangeText={(text) => {
                  setCurrent(text);
                  if (error) setError('');
                }}
                placeholder={t('ui_enter_current_password')}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                secureTextEntry={!showCurrent}
                style={styles.textInput}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowCurrent(!showCurrent)}
                style={styles.eyeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showCurrent ? t('ui_hide_password') : t('ui_show_password')}
              >
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"}
                />
              </Pressable>
            </View>

            {/* 2. New Password */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>{t('new_password')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                placeholder={t('ui_at_least_8_characters')}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                secureTextEntry={!showPassword}
                style={styles.textInput}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('ui_hide_password') : t('ui_show_password')}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"}
                />
              </Pressable>
            </View>

            {/* 3. Confirm Password */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>{t('ui_confirm_password')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={confirm}
                onChangeText={(text) => {
                  setConfirm(text);
                  if (error) setError('');
                }}
                placeholder={t('ui_repeat_new_password')}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                secureTextEntry={!showConfirm}
                style={styles.textInput}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showConfirm ? t('ui_hide_password') : t('ui_show_password')}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"}
                />
              </Pressable>
            </View>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionButtonGroup}>
            {/* Primary Update Button in ChoreHub Theme (styled like logout button card) */}
            <Pressable
              onPress={submit}
              disabled={loading}
              style={({ pressed }) => [
                styles.updateBtn,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#713DE8" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#713DE8" />
                  <Text style={styles.updateBtnText}>{t('update_password')}</Text>
                </>
              )}
            </Pressable>

            {/* Cancel Button matching logout button style */}
            <Pressable
              onPress={() => router.back()}
              disabled={loading}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
            >
              <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
              <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FFFFFF'),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 36,
  },

  // ── Lock Illustration ──
  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  illustrationContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  archArrowWrap: {
    position: 'absolute',
    top: -2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  lockIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  asteriskBubble: {
    position: 'absolute',
    bottom: 2,
    right: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  chatBubbleIcon: {
    transform: [{ scaleX: -1 }],
  },
  asteriskTextOverlay: {
    position: 'absolute',
    top: 4,
    left: 7,
  },
  asteriskText: {
    color: (themeColors.isDark ? themeColors.textPrimary : '#FFFFFF'),
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── Error Banner ──
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF2F2'),
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#FECACA'),
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: (themeColors.isDark ? themeColors.error : '#DC2626'),
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Lavender Card Container ──
  card: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#E4DCFD'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 18,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#374151'),
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#FFFFFF'),
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Action Buttons ──
  actionButtonGroup: {
    marginTop: 24,
    gap: 12,
  },
  updateBtn: {
    width: '100%',
    height: 54,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F5F3FF'),
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  updateBtnText: {
    color: '#713DE8',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelBtn: {
    width: '100%',
    height: 54,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF2F2'),
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  btnDisabled: {
    opacity: 0.65,
  },
});

