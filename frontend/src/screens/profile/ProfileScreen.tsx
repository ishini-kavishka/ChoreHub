import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/profile/Avatar';
import { useAppTheme } from '@/context/ThemeContext';
import { authService, Member } from '@/services/authService';
import { profileService } from '@/services/profileService';

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const [profile, setProfile] = useState<Member | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProfile(await profileService.getProfile());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const completeLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.signOut();
      setShowLogoutModal(false);
      router.dismissAll();
      router.replace('/auth/welcome');
    } finally {
      setLoggingOut(false);
    }
  };

  const logout = () => {
    setShowLogoutModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#713DE8" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.error}>{error || 'Your session has ended.'}</Text>
          <Pressable
            onPress={() => router.replace('/auth/welcome')}
            style={styles.retryBtn}
          >
            <Text style={styles.retryBtnText}>Back to Welcome</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Bar ── */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/home' as any);
              }
            }}
            style={styles.headerIconButton}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>

          <Pressable
            onPress={() => router.push('/profile/edit')}
            style={styles.headerIconButton}
            hitSlop={10}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* ── User Avatar & Info Section ── */}
        <View style={styles.userHeroSection}>
          <View style={styles.avatarWrapper}>
            <Avatar name={profile.name} uri={profile.avatarUri} size={110} />
            <Pressable
              onPress={() => router.push('/profile/picture')}
              style={styles.cameraBadge}
              hitSlop={8}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={[styles.userName, { color: colors.textPrimary }]}>{profile.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{profile.email}</Text>
        </View>

        {/* ── Unified Menu List Card ── */}
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* 1. Personal Information */}
          <MenuItem
            iconName="person-outline"
            iconColor="#10B981"
            iconBg="#E6F9F0"
            title="Personal Information"
            onPress={() => router.push('/profile/edit')}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          {/* 2. Household Settings */}
          <MenuItem
            iconName="home-outline"
            iconColor="#713DE8"
            iconBg="#EDE9FE"
            title="Household Settings"
            onPress={() => router.push('/home' as any)}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          {/* 3. App Settings */}
          <MenuItem
            iconName="settings-outline"
            iconColor="#713DE8"
            iconBg="#EDE9FE"
            title="App Settings"
            onPress={() => router.push('/home/settings' as any)}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          {/* 4. Change Password */}
          <MenuItem
            iconName="lock-closed-outline"
            iconColor="#8B5CF6"
            iconBg="#F3E8FF"
            title="Change Password"
            onPress={() => router.push('/profile/change-password')}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          {/* 5. App Preferences */}
          <MenuItem
            iconName="settings-outline"
            iconColor="#0EA5E9"
            iconBg="#E0F2FE"
            title="App Preferences"
            onPress={() => router.push('/home/preferences' as any)}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          {/* 6. Support & Help */}
          <MenuItem
            iconName="help-buoy-outline"
            iconColor="#F59E0B"
            iconBg="#FEF3C7"
            title="Support & Help"
            onPress={() => router.push('/support' as any)}
          />
        </View>

        {/* ── Logout Button Card ── */}
        <View style={styles.logoutWrapper}>
          <Pressable
            onPress={logout}
            style={({ pressed }) => [
              styles.logoutButtonCard,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Logout Confirmation Modal ── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loggingOut) setShowLogoutModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!loggingOut) setShowLogoutModal(false);
            }}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={30} color="#713DE8" />
            </View>

            <Text style={styles.modalTitle}>Log Out?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out from your ChoreHub account?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={completeLogout}
                disabled={loggingOut}
                style={({ pressed }) => [
                  styles.modalPrimaryBtn,
                  pressed && styles.modalBtnPressed,
                  loggingOut && styles.modalBtnDisabled,
                ]}
              >
                {loggingOut ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>Log out</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                style={({ pressed }) => [
                  styles.modalSecondaryBtn,
                  pressed && styles.modalBtnPressed,
                ]}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({
  iconName,
  iconColor,
  iconBg,
  title,
  onPress,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItemRow, pressed && { opacity: 0.75 }]}
    >
      <View style={[styles.menuIconBadge, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>

      <Text style={[styles.menuItemTitle, { color: colors.textPrimary }]}>{title}</Text>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  error: {
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#713DE8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },

  // ── Header Bar ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.3,
  },

  // ── User Hero Section ──
  userHeroSection: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A879A',
  },

  // ── Unified Menu Card ──
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  menuIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B2E',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F5F3FF',
    marginHorizontal: 4,
  },

  // ── Logout Button ──
  logoutWrapper: {
    marginTop: 4,
  },
  logoutButtonCard: {
    width: '100%',
    height: 54,
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#8A879A',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSecondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0EFF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    color: '#713DE8',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBtnPressed: {
    opacity: 0.82,
  },
  modalBtnDisabled: {
    opacity: 0.65,
  },
});
