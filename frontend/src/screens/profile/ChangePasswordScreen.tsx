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
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async () => {
    if (!current) return setError('Enter your current password.');
    if (password.length < 8) return setError('Your new password must be at least 8 characters.');
    if (password !== confirm) return setError('Your new passwords do not match.');

    setLoading(true);
    setError('');
    try {
      await profileService.changePassword(current, password);
      Alert.alert('Password updated 🎉', 'Your password has been changed successfully.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not update your password.');
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
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
            </Pressable>

            <Text style={styles.headerTitle}>Change Password</Text>

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
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Main Lavender Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Choose a New Password</Text>
            <Text style={styles.cardSubtitle}>
              Enter and confirm your new password to regain access
            </Text>

            {/* 1. Old Password */}
            <Text style={styles.inputLabel}>Old Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={current}
                onChangeText={(text) => {
                  setCurrent(text);
                  if (error) setError('');
                }}
                placeholder="Enter current password"
                placeholderTextColor="#A09DB1"
                secureTextEntry={!showCurrent}
                style={styles.textInput}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowCurrent(!showCurrent)}
                style={styles.eyeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showCurrent ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8A879A"
                />
              </Pressable>
            </View>

            {/* 2. New Password */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                placeholder="At least 8 characters"
                placeholderTextColor="#A09DB1"
                secureTextEntry={!showPassword}
                style={styles.textInput}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8A879A"
                />
              </Pressable>
            </View>

            {/* 3. Confirm Password */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={confirm}
                onChangeText={(text) => {
                  setConfirm(text);
                  if (error) setError('');
                }}
                placeholder="Repeat new password"
                placeholderTextColor="#A09DB1"
                secureTextEntry={!showConfirm}
                style={styles.textInput}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8A879A"
                />
              </Pressable>
            </View>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionButtonGroup}>
            {/* Primary Update Button in ChoreHub Theme */}
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
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.updateBtnText}>Update Password</Text>
              )}
            </Pressable>

            {/* Cancel Button matching reference mockup */}
            <Pressable
              onPress={() => router.back()}
              disabled={loading}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
    backgroundColor: '#FFFFFF',
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
    color: '#1E1B2E',
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
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── Error Banner ──
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Lavender Card Container ──
  card: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#E4DCFD',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#656276',
    lineHeight: 18,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1E1B2E',
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
    height: 52,
    backgroundColor: '#713DE8',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cancelBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#E11D48',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
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

