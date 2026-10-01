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
    if (name.trim().length < 2) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    setError('');

    try {
      await authService.signUp(name.trim(), email.trim(), password);
      router.replace('/profile');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create your account. Please try again.';
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
            <Text style={styles.screenTitle}>Create Account</Text>
            <Text style={styles.subtitle}>Join your household & start organizing chores.</Text>
          </View>

          {/* ── Illustration Graphic Badges ── */}
          <View style={styles.graphicBadgeRow}>
            <View style={[styles.graphicBadge, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="people" size={22} color="#713DE8" />
            </View>
            <View style={[styles.graphicBadge, { backgroundColor: '#FFF4E6' }]}>
              <Ionicons name="clipboard" size={22} color="#FF9F1C" />
            </View>
            <View style={[styles.graphicBadge, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            </View>
            <View style={[styles.graphicBadge, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="notifications" size={22} color="#8B5CF6" />
            </View>
          </View>

          {/* ── Error Banner ── */}
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Input Fields ── */}
          <View style={styles.formGroup}>
            {/* Full Name */}
            <View style={styles.inputCard}>
              <Ionicons name="person-outline" size={20} color="#8A879A" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Full Name"
                placeholderTextColor="#A09DB1"
                value={name}
                onChangeText={(t) => { setName(t); clearError(); }}
                autoComplete="name"
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputCard}>
              <Ionicons name="mail-outline" size={20} color="#8A879A" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                placeholderTextColor="#A09DB1"
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {/* Password */}
            <View style={styles.inputCard}>
              <Ionicons name="lock-closed-outline" size={20} color="#8A879A" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Password (min 8 characters)"
                placeholderTextColor="#A09DB1"
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} hitSlop={10}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8A879A"
                />
              </Pressable>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputCard}>
              <Ionicons name="lock-closed-outline" size={20} color="#8A879A" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm Password"
                placeholderTextColor="#A09DB1"
                value={confirm}
                onChangeText={(t) => { setConfirm(t); clearError(); }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn} hitSlop={10}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8A879A"
                />
              </Pressable>
            </View>
          </View>

          {/* ── Terms Note ── */}
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
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
              <Text style={styles.signUpBtnText}>Create Account</Text>
            )}
          </Pressable>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
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
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </Pressable>

          {/* ── Footer Login Link ── */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/auth/login' as any)}>
              <Text style={styles.loginLinkText}>Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
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
    color: '#1E1B2E',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A879A',
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

  // ── Error Card ──
  errorCard: {
    width: '100%',
    backgroundColor: '#FEE2E2',
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
    color: '#DC2626',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
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
    color: '#1E1B2E',
  },
  eyeBtn: {
    padding: 4,
  },

  // ── Terms ──
  termsText: {
    fontSize: 12,
    color: '#A09DB1',
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
    backgroundColor: '#EAE7F5',
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A09DB1',
  },

  // ── Google Button ──
  googleBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
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
    color: '#FFFFFF',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
  },

  // ── Footer ──
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#656276',
    fontWeight: '500',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#713DE8',
  },
});
