import { translateFeedback } from '@/i18n/translations';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { authService } from '@/services/authService';

export default function SignUpScreen() {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => { if (error) setError(''); };

  const handleSignUp = async () => {
    if (name.trim().length < 2) return setError(t('ui_please_enter_your_full_name'));
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('valid_email'));
    if (password.length < 8) return setError(t('ui_password_must_be_at_least_8_characters'));
    if (password !== confirm) return setError(t('ui_passwords_do_not_match'));

    setLoading(true);
    setError('');

    try {
      await authService.signUp(name.trim(), email.trim(), password);
      router.replace('/home' as any);
    } catch (err) {
      const msg = t('admin_error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top Header & Logo ── */}
          <View style={styles.headerArea}>
            <View style={styles.logoRow}>
              <Text style={styles.logoChore}>Chore</Text>
              <Text style={styles.logoHub}>Hub</Text>
            </View>
            <Text style={styles.screenTitle}>{t('create_account')}</Text>
            <Text style={styles.subtitle}>{t('ui_join_your_household_start_organizing_chores')}</Text>
          </View>

          {/* ── Illustration Graphic Badges ── */}
          <View style={styles.graphicBadgeRow}>
            <View style={[styles.graphicBadge, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE') }]}>
              <Ionicons name="people" size={22} color="#713DE8" />
            </View>
            <View style={[styles.graphicBadge, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FFF4E6') }]}>
              <Ionicons name="clipboard" size={22} color="#FF9F1C" />
            </View>
            <View style={[styles.graphicBadge, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#DCFCE7') }]}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            </View>
            <View style={[styles.graphicBadge, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3E8FF') }]}>
              <Ionicons name="notifications" size={22} color="#8B5CF6" />
            </View>
          </View>

          <View style={styles.formCard}>
            {/* ── Error Banner ── */}
            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{translateFeedback(error, t)}</Text>
              </View>
            ) : null}

            {/* ── Input Fields ── */}
            <View style={styles.formGroup}>
              {/* Full Name */}
              <View style={styles.inputCard}>
                <Ionicons name="person-outline" size={20} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('full_name')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                  value={name}
                  onChangeText={(t) => { setName(t); clearError(); }}
                  autoComplete="name"
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputCard}>
                <Ionicons name="mail-outline" size={20} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('email')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError(); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              {/* Password */}
              <View style={styles.inputCard}>
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('ui_password_min_8_characters')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} hitSlop={10}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"}
                  />
                </Pressable>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputCard}>
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('ui_confirm_password')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                  value={confirm}
                  onChangeText={(t) => { setConfirm(t); clearError(); }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn} hitSlop={10}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"}
                  />
                </Pressable>
              </View>
            </View>

            {/* ── Terms Note ── */}
            <Text style={styles.termsText}>{t('ui_by_signing_up_you_agree_to_our')}{' '}
              <Text onPress={() => router.push('/auth/terms' as any)} style={styles.termsLink}>{t('terms_of_service')}</Text>
              {' '}{t('ui_and')}{' '}
              <Text onPress={() => router.push('/auth/privacy-policy' as any)} style={styles.termsLink}>{t('privacy_policy')}</Text>.
            </Text>

            {/* ── Create Account Button ── */}
            <Pressable
              onPress={handleSignUp}
              disabled={loading}
              style={({ pressed }) => [styles.signUpBtn, pressed && { opacity: 0.88 }]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signUpBtnText}>{t('create_account')}</Text>
              )}
            </Pressable>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Continue with Google ── */}
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.88 }]}
            >
              <View style={styles.googleGContainer}>
                <Text style={styles.googleGText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>{t('continue_google')}</Text>
            </Pressable>

            {/* ── Footer Login Link ── */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{t('already_have_account')}</Text>
              <Pressable onPress={() => router.replace('/auth/login' as any)}>
                <Text style={styles.loginLinkText}>{t('login')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ── Header & Logo ──
  headerArea: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoChore: {
    fontSize: 32,
    fontWeight: '900',
    color: '#713DE8',
    letterSpacing: -0.5,
  },
  logoHub: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF9F1C',
    letterSpacing: -0.5,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Graphic Badges Row ──
  graphicBadgeRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  graphicBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Form Card ──
  formCard: {
    width: '100%',
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3EEFF'),
    borderRadius: 26,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },

  // ── Error Card ──
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

  // ── Input Fields ──
  formGroup: {
    width: '100%',
    gap: 12,
    marginBottom: 14,
  },
  inputCard: {
    width: '100%',
    height: 54,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  fieldIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  eyeBtn: {
    padding: 4,
  },

  // ── Terms ──
  termsText: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#A09DB1'),
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
    fontWeight: '500',
  },
  termsLink: {
    color: '#713DE8',
    fontWeight: '700',
  },

  // ── Create Account Button ──
  signUpBtn: {
    width: '100%',
    backgroundColor: '#713DE8',
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  signUpBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Divider ──
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EAE7F5'),
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#A09DB1'),
  },

  // ── Google Button ──
  googleBtn: {
    width: '100%',
    backgroundColor: (themeColors.isDark ? themeColors.card : '#F8F7FF'),
    borderRadius: 18,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#E9E3FF'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  googleGContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: {
    fontSize: 14,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#FFFFFF'),
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },

  // ── Footer ──
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    fontWeight: '500',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#713DE8',
    marginLeft: 4,
  },
});
