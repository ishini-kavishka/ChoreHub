import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
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

interface TopicItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}



export default function HelpCenterScreen() {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
const POPULAR_TOPICS: TopicItem[] = [
  {
    id: 'getting-started',
    title: t('ui_getting_started'),
    subtitle: t('ui_learn_the_basics'),
    icon: 'rocket-outline',
  },
  {
    id: 'chore-management',
    title: t('ui_chore_management'),
    subtitle: t('ui_assign_edit_and_track_chores'),
    icon: 'clipboard-outline',
  },
  {
    id: 'notifications',
    title: t('notifications_title'),
    subtitle: t('ui_reminders_and_alerts'),
    icon: 'notifications-outline',
  },
  {
    id: 'account-details',
    title: t('ui_account_details'),
    subtitle: t('ui_password_login_and_more'),
    icon: 'person-outline',
  },
  {
    id: 'app-settings',
    title: t('menu_app_settings'),
    subtitle: t('ui_preferences_and_customization'),
    icon: 'settings-outline',
  },
];

  const handleSelectTopic = (topic: TopicItem) => {
    router.push({
      pathname: '/support/topic',
      params: { id: topic.id, title: topic.title },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/support' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('admin_back')}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('ui_help_center')}</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Help Center Top Graphic */}
        <View style={styles.graphicContainer}>
          <View style={styles.graphicCard}>
            <View style={styles.graphicIconCircle}>
              <Ionicons name="library-outline" size={44} color="#6C3BEA" />
            </View>
            <Text style={styles.graphicTitle}>{t('ui_knowledge_base_guides')}</Text>
            <Text style={styles.graphicSubtitle}>{t('ui_find_detailed_walkthroughs_for_all_chorehub_features')}</Text>
          </View>
        </View>

        {/* Popular Topics Section */}
        <Text style={styles.sectionHeader}>{t('ui_popular_topics')}</Text>

        <View style={styles.topicsList}>
          {POPULAR_TOPICS.map((topic) => (
            <Pressable
              key={topic.id}
              onPress={() => handleSelectTopic(topic)}
              style={({ pressed }) => [
                styles.topicCard,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
            >
              <View style={styles.topicIconWrap}>
                <Ionicons name={topic.icon} size={22} color="#6C3BEA" />
              </View>
              <View style={styles.topicTextWrap}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Persistent Bottom Navigation */}
      <SupportBottomNav activeTab="profile" />
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F0EEF8'),
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
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
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  graphicContainer: {
    marginBottom: 24,
  },
  graphicCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  graphicIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3EEFF'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  graphicTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 4,
  },
  graphicSubtitle: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 12,
  },
  topicsList: {
    gap: 10,
  },
  topicCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  topicIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTextWrap: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 2,
  },
  topicSubtitle: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
});
