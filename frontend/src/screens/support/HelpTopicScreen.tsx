import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SupportBottomNav } from '@/components/support/SupportBottomNav';

interface TopicArticle {
  question: string;
  answer: string;
}



export default function HelpTopicScreen() {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
const DEFAULT_ARTICLES: Record<string, TopicArticle[]> = {
  'chore-management': [
    {
      question: t('ui_how_do_i_assign_a_chore'),
      answer:
        t('ui_to_assign_a_chore_navigate_to_the_chores_tab_or_admin_dashboard_tap_the_add_chore_button_select_the_family_member_you_wish_to_assign_it_to_set_the_due_date_and_points_and_tap_save'),
    },
    {
      question: t('ui_can_i_edit_a_chore_after_it_s_assigned'),
      answer:
        t('ui_yes_you_can_edit_chore_details_at_any_time_before_it_is_marked_completed_simply_open_the_chore_from_your_list_tap_edit_update_the_necessary_details_and_save_your_changes'),
    },
    {
      question: t('ui_can_i_set_recurring_chores'),
      answer:
        t('ui_yes_when_creating_or_editing_a_chore_toggle_the_recurring_option_and_select_your_preferred_frequency_daily_weekly_or_monthly'),
    },
    {
      question: t('ui_how_do_i_remove_a_chore'),
      answer:
        t('ui_open_the_chore_details_and_tap_the_delete_option_at_the_bottom_note_that_only_household_admins_or_the_creator_of_the_chore_have_permission_to_remove_it'),
    },
  ],
  'getting-started': [
    {
      question: t('ui_what_is_chorehub'),
      answer:
        t('ui_chorehub_is_a_collaborative_household_management_app_that_helps_families_organize_chores_track_daily_responsibilities_and_celebrate_wins_together'),
    },
    {
      question: t('ui_how_do_i_invite_family_members'),
      answer:
        t('ui_from_your_home_or_profile_screen_go_to_household_settings_and_tap_invite_member_share_your_household_code_or_send_an_email_invitation'),
    },
    {
      question: t('ui_how_do_points_and_rewards_work'),
      answer:
        t('ui_whenever_a_member_completes_an_assigned_chore_they_earn_points_defined_for_that_task_points_can_be_redeemed_for_agreed_family_rewards'),
    },
  ],
  'notifications': [
    {
      question: t('ui_why_am_i_not_receiving_notifications'),
      answer:
        t('ui_make_sure_notifications_are_enabled_for_chorehub_in_your_phone_settings_also_check_in_app_app_settings_to_ensure_reminders_are_toggled_on'),
    },
    {
      question: t('ui_can_i_customize_chore_reminder_times'),
      answer:
        t('ui_yes_you_can_set_reminder_alerts_for_1_hour_before_due_time_or_daily_morning_summaries_in_app_settings'),
    },
  ],
  'account-details': [
    {
      question: t('ui_how_do_i_change_my_profile_picture'),
      answer:
        t('ui_go_to_your_profile_tab_tap_profile_picture_and_choose_an_image_from_your_gallery_or_camera'),
    },
    {
      question: t('ui_how_can_i_reset_my_password'),
      answer:
        t('ui_navigate_to_profile_change_password_to_update_your_password_securely_or_use_the_forgot_password_link_on_the_login_screen'),
    },
  ],
  'app-settings': [
    {
      question: t('ui_does_chorehub_support_dark_mode'),
      answer:
        t('ui_yes_chorehub_automatically_adapts_to_your_system_appearance_preferences_or_can_be_switched_manually_in_theme_settings'),
    },
    {
      question: t('ui_how_do_i_update_my_language_preferences'),
      answer:
        t('ui_go_to_app_settings_language_and_select_your_preferred_language'),
    },
  ],
};

  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const topicId = params.id || 'chore-management';
  const topicTitle = t(({ 'getting-started': 'ui_getting_started', 'chore-management': 'ui_chore_management', notifications: 'notifications_title', 'account-details': 'ui_account_details', 'app-settings': 'menu_app_settings' } as Record<string, string>)[topicId] || 'ui_chore_management');

  const articles = DEFAULT_ARTICLES[topicId] || DEFAULT_ARTICLES['chore-management'];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/support/help-center' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('admin_back')}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
        </Pressable>
        <Text style={styles.headerTitle}>{topicTitle}</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Questions list */}
        <View style={styles.questionsContainer}>
          {articles.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={index} style={styles.questionCard}>
                <Pressable
                  onPress={() => toggleExpand(index)}
                  style={styles.questionHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#6C3BEA"
                  />
                </Pressable>

                {isExpanded && (
                  <View style={styles.answerWrap}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Still Need Help? Card matching reference */}
        <View style={styles.helpBox}>
          <View style={styles.helpIconCircle}>
            <Ionicons name="bulb-outline" size={28} color="#6C3BEA" />
          </View>
          <Text style={styles.helpBoxTitle}>{t('ui_still_need_help')}</Text>
          <Text style={styles.helpBoxSubtitle}>{t('ui_contact_our_support_team_and_we_ll_be_happy_to_assist_you')}</Text>
          <Pressable
            onPress={() => router.push('/support/contact-support' as any)}
            style={({ pressed }) => [
              styles.contactBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.contactBtnText}>{t('ui_contact_support')}</Text>
          </Pressable>
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
    paddingTop: 20,
    paddingBottom: 28,
  },
  questionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    overflow: 'hidden',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  questionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    flex: 1,
    paddingRight: 10,
  },
  answerWrap: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
    paddingTop: 10,
  },
  answerText: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 19,
  },
  helpBox: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 8,
  },
  helpIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3EEFF'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  helpBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 4,
  },
  helpBoxSubtitle: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    lineHeight: 17,
  },
  contactBtn: {
    backgroundColor: '#6C3BEA',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
