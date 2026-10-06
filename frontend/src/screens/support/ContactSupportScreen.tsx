import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SupportBottomNav } from '@/components/support/SupportBottomNav';

export default function ContactSupportScreen() {
  const handleEmailPress = () => {
    const email = 'supportchorehub@gmail.com';
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert(
        'Email Support',
        `Send an email directly to: ${email}`,
        [{ text: 'OK' }]
      );
    });
  };

  const handlePhonePress = () => {
    const phone = '+94 11 234 5678';
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert(
        'Phone Support',
        `Call our support line: ${phone}`,
        [{ text: 'OK' }]
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/support' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Illustration */}
        <View style={styles.illustrationSection}>
          <View style={styles.illustrationOuterRing}>
            <View style={styles.illustrationInnerCircle}>
              <View style={styles.illustrationBadge24}>
                <Text style={styles.badge24Text}>24</Text>
              </View>
              <Ionicons name="headset" size={54} color="#6C3BEA" />
            </View>
          </View>
        </View>

        {/* Message */}
        <View style={styles.textSection}>
          <Text style={styles.sectionTitle}>We're here to help!</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how you would like to reach us.
          </Text>
        </View>

        {/* Contact Methods */}
        <View style={styles.cardsContainer}>
          <Pressable
            onPress={handleEmailPress}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
          >
            <View style={styles.cardIconWrap}>
              <Ionicons name="mail-outline" size={22} color="#6C3BEA" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Email</Text>
              <Text style={styles.cardDetail}>supportchorehub@gmail.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8A879A" />
          </Pressable>

          <Pressable
            onPress={handlePhonePress}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
          >
            <View style={styles.cardIconWrap}>
              <Ionicons name="call-outline" size={22} color="#6C3BEA" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Phone</Text>
              <Text style={styles.cardDetail}>+94 11 234 5678</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8A879A" />
          </Pressable>

        </View>
      </ScrollView>

      {/* Persistent Bottom Navigation */}
      <SupportBottomNav activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderBtn: {
    width: 36,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1B2E',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  illustrationOuterRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#F3EEFF',
    borderWidth: 2,
    borderColor: '#E6DEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationBadge24: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: '#6C3BEA',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badge24Text: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  textSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#656276',
    textAlign: 'center',
  },
  cardsContainer: {
    marginTop: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F4F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 13,
    color: '#656276',
    fontWeight: '500',
  },
});
