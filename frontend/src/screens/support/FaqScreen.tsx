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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SupportBottomNav } from '@/components/support/SupportBottomNav';

interface FaqItem {
  id: string;
  category: 'account' | 'chores' | 'notifications';
  question: string;
  answer: string;
}



type CategoryFilter = 'all' | 'account' | 'chores' | 'notifications';



export default function FaqScreen() {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
const FAQS: FaqItem[] = [
  {
    id: '1',
    category: 'account',
    question: t('ui_how_do_i_create_an_account'),
    answer:
      t('ui_you_can_create_a_chorehub_account_on_the_sign_up_screen_by_providing_your_full_name_email_address_and_setting_a_password_you_can_also_join_an_existing_family_household_using_an_invite_code'),
  },
  {
    id: '2',
    category: 'account',
    question: t('ui_how_can_i_reset_my_password'),
    answer:
      t('ui_to_reset_your_password_go_to_profile_change_password_if_you_are_logged_in_if_you_are_signed_out_tap_forgot_password_on_the_login_screen_to_receive_a_secure_password_reset_link'),
  },
  {
    id: '3',
    category: 'notifications',
    question: t('ui_why_am_i_not_receiving_notifications'),
    answer:
      t('ui_ensure_that_notifications_are_enabled_in_your_device_settings_for_chorehub_in_addition_verify_that_notification_alerts_are_enabled_within_your_in_app_profile_settings'),
  },
  {
    id: '4',
    category: 'account',
    question: t('ui_how_do_i_change_my_profile_picture'),
    answer:
      t('ui_navigate_to_your_profile_screen_tap_profile_picture_and_select_an_image_from_your_device_photo_gallery_or_take_a_new_photo_with_your_camera'),
  },
  {
    id: '5',
    category: 'account',
    question: t('ui_can_i_use_the_app_on_multiple_devices'),
    answer:
      t('ui_yes_you_can_log_in_to_your_chorehub_account_on_any_supported_device_all_your_family_chores_tasks_points_and_history_will_stay_automatically_synchronized_in_real_time'),
  },
  {
    id: '6',
    category: 'account',
    question: t('ui_how_do_i_delete_my_account'),
    answer:
      t('ui_to_delete_your_account_and_personal_data_permanently_please_visit_profile_account_details_or_reach_out_directly_to_our_support_team_via_contact_support'),
  },
  {
    id: '7',
    category: 'chores',
    question: t('ui_how_do_i_mark_a_chore_as_complete'),
    answer:
      t('ui_simply_tap_the_checkmark_icon_next_to_the_chore_card_on_your_home_or_chores_screen_your_completed_chores_will_be_recorded_and_points_awarded_immediately'),
  },
  {
    id: '8',
    category: 'chores',
    question: t('ui_can_household_members_trade_chores'),
    answer:
      t('ui_yes_open_the_chore_details_select_reassign_and_choose_another_household_member_who_agreed_to_take_over_the_task'),
  },
];
const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: t('filter_all') },
  { id: 'account', label: t('ui_account') },
  { id: 'chores', label: t('chores') },
  { id: 'notifications', label: t('notifications_title') },
];

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs =
    selectedCategory === 'all'
      ? FAQS
      : FAQS.filter((faq) => faq.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
        <Text style={styles.headerTitle}>{t('ui_faqs')}</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.pill, isActive ? styles.activePill : styles.inactivePill]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive ? styles.activePillText : styles.inactivePillText,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* FAQs Accordion List */}
        <View style={styles.faqList}>
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <Pressable
                  onPress={() => toggleExpand(faq.id)}
                  style={styles.faqHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <Text style={styles.questionText}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#6C3BEA"
                  />
                </Pressable>

                {isExpanded && (
                  <View style={styles.answerWrap}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Help Banner at Bottom */}
        <View style={styles.bottomHelpBanner}>
          <Text style={styles.bottomHelpText}>{t('ui_didn_t_find_your_answer')}</Text>
          <Pressable
            onPress={() => router.push('/support/contact-support' as any)}
            style={({ pressed }) => [styles.contactLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.contactLinkText}>{t('ui_contact_support_team')}</Text>
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
    paddingTop: 16,
    paddingBottom: 28,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: '#6C3BEA',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inactivePill: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  inactivePillText: {
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
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
  faqHeader: {
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
  bottomHelpBanner: {
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
    paddingVertical: 8,
  },
  bottomHelpText: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  contactLink: {
    paddingVertical: 4,
  },
  contactLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C3BEA',
  },
});
