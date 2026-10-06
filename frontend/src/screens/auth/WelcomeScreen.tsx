import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const familyIllustration = require('../../../assets/images/welcome_family.png');

export default function WelcomeScreen() {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const handleGetStarted = () => {
    router.push('/auth/signup' as any);
  };

  const handleLogin = () => {
    router.push('/auth/login' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top House Roof Graphic & Logo Header ── */}
        <View style={styles.logoHeaderArea}>
          {/* House Roof Stylized Icon */}
          <View style={styles.roofIconContainer}>
            <View style={styles.roofShape}>
              <View style={styles.chimneyCap} />
            </View>
            <View style={styles.roofWindowDotRow}>
              <View style={styles.roofDot} />
              <View style={styles.roofDot} />
            </View>
          </View>

          {/* ChoreHub Brand Title */}
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandChore}>Chore</Text>
            <Text style={styles.brandHub}>Hub</Text>
          </View>

          {/* Headline & Subtitle */}
          <Text style={styles.headline}>{t('ui_organize_assign_track_achieve')}</Text>
          <Text style={styles.subtitle}>{t('ui_make_household_chores_easier')}{'\n'}{t('ui_together')}</Text>
        </View>

        {/* ── Hero Family Illustration Image ── */}
        <View style={styles.illustrationSection}>
          <Image
            source={familyIllustration}
            style={styles.familyImage}
            resizeMode="contain"
          />
        </View>

        {/* ── Feature Badges Carousel Row ── */}
        <View style={styles.featureSection}>
          <View style={styles.featureBadgesRow}>
            {/* 1. Assign Chores */}
            <View style={styles.featureItem}>
              <View style={[styles.featureIconBadge, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE') }]}>
                <Ionicons name="clipboard" size={20} color="#713DE8" />
              </View>
              <Text style={styles.featureLabel}>{t('ui_assign')}{'\n'}{t('chores')}</Text>
            </View>

            {/* 2. Manage Family */}
            <View style={styles.featureItem}>
              <View style={[styles.featureIconBadge, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FFF4E6') }]}>
                <Ionicons name="people" size={20} color="#FF9F1C" />
              </View>
              <Text style={styles.featureLabel}>{t('ui_manage')}{'\n'}{t('family')}</Text>
            </View>

            {/* 3. Track Progress */}
            <View style={styles.featureItem}>
              <View style={[styles.featureIconBadge, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#E6F9F0') }]}>
                <Ionicons name="stats-chart" size={20} color="#10B981" />
              </View>
              <Text style={styles.featureLabel}>{t('ui_track')}{'\n'}{t('progress_title')}</Text>
            </View>

            {/* 4. Stay Notified */}
            <View style={styles.featureItem}>
              <View style={[styles.featureIconBadge, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3E8FF') }]}>
                <Ionicons name="notifications" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.featureLabel}>{t('ui_stay')}{'\n'}{t('ui_notified')}</Text>
            </View>
          </View>

          {/* Pagination Indicators */}
          <View style={styles.paginationRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 16 }} />

        {/* ── Action Buttons ── */}
        <View style={styles.buttonGroup}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.getStartedBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.getStartedBtnText}>{t('ui_get_started')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.loginBtnText}>{t('login')}</Text>
          </Pressable>
        </View>

        {/* ── Footer Link ── */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t('dont_have_account')}</Text>
          <Pressable onPress={() => router.push('/auth/signup' as any)}>
            <Text style={styles.signUpLinkText}>{t('sign_up')}</Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    alignItems: 'center',
  },

  // ── Top Header & Logo ──
  logoHeaderArea: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  roofIconContainer: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  roofShape: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 28,
    borderRightWidth: 28,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#713DE8',
    position: 'relative',
  },
  chimneyCap: {
    position: 'absolute',
    top: -12,
    right: -14,
    width: 6,
    height: 12,
    backgroundColor: '#713DE8',
    borderRadius: 1,
  },
  roofWindowDotRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: -8,
  },
  roofDot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: '#FF9F1C',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandChore: {
    fontSize: 36,
    fontWeight: '900',
    color: '#713DE8',
    letterSpacing: -0.5,
  },
  brandHub: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF9F1C',
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 18,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },

  // ── Illustration Section ──
  illustrationSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  familyImage: {
    width: '100%',
    height: 200,
    borderRadius: 24,
  },

  // ── Feature Badges Carousel ──
  featureSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginVertical: 12,
  },
  featureBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    textAlign: 'center',
    lineHeight: 15,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EAE7F5'),
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#713DE8',
  },

  // ── Action Buttons ──
  buttonGroup: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  getStartedBtn: {
    width: '100%',
    backgroundColor: '#713DE8',
    borderRadius: 18,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loginBtn: {
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
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#713DE8',
  },

  // ── Footer Sign Up Link ──
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
});
