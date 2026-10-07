import { translateFeedback } from '@/i18n/translations';
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
import { authService } from '@/services/authService';

export default function LoginScreen() {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError(t('enter_email_password'));
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t('valid_email'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const member = await authService.signIn(email.trim(), password);
      if (member?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/home' as any);
      }
    } catch (err: any) {
      const msg = err?.message || t('admin_error');
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
            <Text style={styles.tagline}>{t('tagline_hero')}</Text>
          </View>

          {/* ── Center House Illustration Graphic ── */}
          <View style={styles.illustrationWrap}>
            {/* Background Soft Cloud Badges */}
            <View style={[styles.cloud, styles.cloudLeft]} />
            <View style={[styles.cloud, styles.cloudRight]} />

            {/* Tree Left & Right */}
            <View style={[styles.tree, styles.treeLeft]}>
              <View style={styles.treeTop} />
            </View>
            <View style={[styles.tree, styles.treeRight]}>
              <View style={styles.treeTop} />
            </View>

            {/* Main 3D House */}
            <View style={styles.houseContainer}>
              <View style={styles.roof} />
              <View style={styles.chimney} />
              <View style={styles.houseBody}>
                <View style={styles.roofWindow}>
                  <View style={styles.innerRoofWindowDot} />
                </View>
                <View style={styles.door} />
                <View style={styles.windowLeft} />
                <View style={styles.windowRight} />
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            {/* Error Feedback Banner */}
            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{translateFeedback(error, t)}</Text>
              </View>
            ) : null}

            {/* ── Input Fields Section ── */}
            <View style={styles.formGroup}>
              {/* Email Field */}
              <View style={styles.inputCard}>
                <Ionicons name="mail-outline" size={20} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('email')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              {/* Password Field */}
              <View style={styles.inputCard}>
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('password')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A09DB1"}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={10}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberRow}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </View>
              <Text style={styles.rememberText}>{t('remember_me')}</Text>
            </Pressable>

            {/* ── Login Primary Button ── */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.88 }]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>{t('login')}</Text>
              )}
            </Pressable>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Continue with Google Button ── */}
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.88 }]}
            >
              <View style={styles.googleGContainer}>
                <Text style={styles.googleGText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>{t('continue_google')}</Text>
            </Pressable>

            {/* ── Footer Link ── */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{t('dont_have_account')}</Text>
              <Pressable onPress={() => router.push('/auth/signup' as any)}>
                <Text style={styles.signUpLinkText}>{t('sign_up')}</Text>
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
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ── Header & Logo ──
  headerArea: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoChore: {
    fontSize: 34,
    fontWeight: '900',
    color: '#713DE8',
    letterSpacing: -0.5,
  },
  logoHub: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FF9F1C',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    textAlign: 'center',
  },

  // ── House Illustration Graphic ──
  illustrationWrap: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  cloud: {
    position: 'absolute',
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#E0F2FE'),
    borderRadius: 20,
    opacity: 0.7,
  },
  cloudLeft: {
    width: 70,
    height: 35,
    top: 15,
    left: 45,
  },
  cloudRight: {
    width: 65,
    height: 30,
    top: 20,
    right: 45,
  },
  tree: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
  },
  treeLeft: {
    left: 50,
  },
  treeRight: {
    right: 50,
  },
  treeTop: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10B981',
  },
  houseContainer: {
    width: 120,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  roof: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 45,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#6366F1',
    position: 'absolute',
    top: 5,
    zIndex: 2,
  },
  chimney: {
    width: 16,
    height: 28,
    backgroundColor: '#4F46E5',
    position: 'absolute',
    top: 8,
    right: 18,
    borderRadius: 3,
  },
  houseBody: {
    width: 110,
    height: 65,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderWidth: 2,
    borderColor: '#818CF8',
    borderRadius: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roofWindow: {
    width: 22,
    height: 22,
    backgroundColor: '#713DE8',
    borderRadius: 4,
    position: 'absolute',
    top: -18,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRoofWindowDot: {
    width: 8,
    height: 8,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 2,
  },
  door: {
    width: 30,
    height: 42,
    backgroundColor: '#D97706',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
    borderColor: '#B45309',
  },
  windowLeft: {
    width: 18,
    height: 18,
    backgroundColor: '#6366F1',
    borderRadius: 4,
    position: 'absolute',
    left: 10,
    bottom: 22,
  },
  windowRight: {
    width: 18,
    height: 18,
    backgroundColor: '#6366F1',
    borderRadius: 4,
    position: 'absolute',
    right: 10,
    bottom: 22,
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

  // ── Form Inputs ──
  formGroup: {
    width: '100%',
    gap: 14,
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

  // ── Remember Me ──
  rememberRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
  },
  checkboxChecked: {
    backgroundColor: '#713DE8',
  },
  rememberText: {
    fontSize: 14,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },

  // ── Login Button ──
  loginBtn: {
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
  loginBtnText: {
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
    marginBottom: 20,
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
    marginBottom: 28,
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

  // ── Footer Sign Up Link ──
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
  signUpLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#713DE8',
    marginLeft: 4,
  },
});
