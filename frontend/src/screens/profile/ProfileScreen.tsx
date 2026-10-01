import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/profile/Avatar';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { authService, Member } from '@/services/authService';
import { profileService } from '@/services/profileService';

export default function ProfileScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator color="#247B6B" size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.error}>{error || 'Your session has ended.'}</Text>
          <PrimaryButton title="Back to welcome" onPress={() => router.replace('/auth/welcome')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your profile</Text>

        <View style={styles.hero}>
          <Avatar name={profile.name} uri={profile.avatarUri} />
          <View>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>
        </View>

        <Text style={styles.section}>ACCOUNT</Text>
        <MenuItem
          icon="✎"
          title="Personal information"
          subtitle="Name, email and phone"
          onPress={() => router.push('/profile/edit')}
        />
        <MenuItem
          icon="◉"
          title="Profile picture"
          subtitle="Update your photo"
          onPress={() => router.push('/profile/picture')}
        />
        <MenuItem
          icon="⌁"
          title="Change password"
          subtitle="Keep your account secure"
          onPress={() => router.push('/profile/change-password')}
        />

        <Text style={styles.section}>SUPPORT & HELP</Text>
        <MenuItem
          icon="🎧"
          title="Support & Help"
          subtitle="Help center, FAQs and contact"
          onPress={() => router.push('/support' as any)}
        />

        <View style={styles.logout}>
          <PrimaryButton title="Log out" variant="danger" loading={loggingOut} onPress={logout} />
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
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
            {/* Logout illustration/icon at top */}
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={32} color="#713DE8" />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Log Out?</Text>

            {/* Description / Message */}
            <Text style={styles.modalMessage}>
              Are you sure you want to log out from this account?
            </Text>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
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
                accessibilityRole="button"
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
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
      <Text style={styles.itemIcon}>{icon}</Text>
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  error: { color: '#C23B3B', textAlign: 'center', fontSize: 15 },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 30, color: '#172B3A', fontWeight: '900', marginTop: 16, marginBottom: 16 },
  hero: {
    backgroundColor: '#FFF',
    padding: 20,
    gap: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 25,
  },
  name: { color: '#172B3A', fontSize: 19, fontWeight: '800' },
  email: { color: '#667788', fontSize: 14, marginTop: 4 },
  section: { color: '#718091', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 1 },
  item: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
  },
  itemIcon: { color: '#247B6B', width: 32, fontSize: 22, fontWeight: '900' },
  itemText: { flex: 1 },
  itemTitle: { color: '#243447', fontWeight: '800', fontSize: 16 },
  itemSubtitle: { color: '#748393', fontSize: 13, marginTop: 3 },
  chevron: { color: '#8A98A6', fontSize: 29 },
  logout: { marginTop: 22 },

  // Logout Confirmation Modal Styles
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172B3A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#667788',
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

