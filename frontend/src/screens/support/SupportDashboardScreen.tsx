import React from 'react';
import {
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

interface MenuCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
}

function MenuCard({ icon, title, subtitle, onPress, badge }: MenuCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuCard, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={styles.cardIconWrap}>
        <Ionicons name={icon} size={22} color="#6C3BEA" />
      </View>
      <View style={styles.cardTextWrap}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          {badge && (
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8A879A" />
    </Pressable>
  );
}

export default function SupportDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Support & Help (Home)</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <View style={styles.heroTextSection}>
          <Text style={styles.heroTitle}>We're here to help you</Text>
          <Text style={styles.heroSubtitle}>
            Find answers, get support or contact us anytime.
          </Text>
        </View>

        {/* Center Illustration Banner */}
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

        {/* Support Tickets Quick Action */}
        <View style={styles.ticketBanner}>
          <View style={styles.ticketBannerLeft}>
            <View style={styles.ticketIconWrap}>
              <Ionicons name="ticket-outline" size={24} color="#6C3BEA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ticketBannerTitle}>Have an issue or dispute?</Text>
              <Text style={styles.ticketBannerSub}>Track and resolve requests</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/support/tickets' as any)}
            style={({ pressed }) => [styles.ticketBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ticketBtnText}>My Tickets</Text>
          </Pressable>
        </View>

        {/* Navigation Menu Options */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionHeader}>SUPPORT & GUIDES</Text>

          <MenuCard
            icon="book-outline"
            title="Help Center"
            subtitle="Common issues & guides"
            onPress={() => router.push('/support/help-center' as any)}
          />

          <MenuCard
            icon="help-circle-outline"
            title="FAQs"
            subtitle="Quick answers to your questions"
            onPress={() => router.push('/support/faqs' as any)}
          />

          <MenuCard
            icon="ticket-outline"
            title="Submit a Support Request / Ticket"
            subtitle="Get technical or chore assistance"
            onPress={() => router.push('/support/tickets' as any)}
          />

          <MenuCard
            icon="mail-outline"
            title="Contact Support"
            subtitle="Get in touch with our team"
            onPress={() => router.push('/support/contact-support' as any)}
          />

          <MenuCard
            icon="chatbox-ellipses-outline"
            title="Contact Us"
            subtitle="Send a direct message to our team"
            onPress={() => router.push('/support/contact-us' as any)}
          />

          <MenuCard
            icon="alert-circle-outline"
            title="Report an Issue"
            subtitle="Report a bug or problem in the app"
            onPress={() => router.push('/support/tickets' as any)}
          />
        </View>
      </ScrollView>

      {/* Persistent Bottom Navigation matching reference */}
      <SupportBottomNav activeTab="profile" role="member" />
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroTextSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B2E',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#656276',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
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
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  illustrationInnerCircle: {
    width: 102,
    height: 102,
    borderRadius: 51,
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
  ticketBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  ticketBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ticketIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  ticketBannerSub: {
    fontSize: 11,
    color: '#656276',
  },
  ticketBtn: {
    backgroundColor: '#6C3BEA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ticketBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  menuContainer: {
    marginTop: 20,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#718091',
    letterSpacing: 0.8,
    marginBottom: 4,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F4F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 2,
  },
  badgeWrap: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8A879A',
    fontWeight: '500',
  },
});
