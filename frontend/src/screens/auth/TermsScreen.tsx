import { useThemedStyles, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function TermsScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.brandMark}>C</Text>
          <Text style={styles.brandText}>ChoreHub</Text>
        </View>

        <Text style={styles.title}>{t('terms_of_service')}</Text>
        <Text style={styles.subtitle}>{t('ui_these_terms_of_service_govern_how_you_use_chorehub_to_manage_household_responsibilities_family_assignments_and_chore_tracking')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_1_account_responsibility')}</Text>
          <Text style={styles.bodyText}>{t('ui_you_are_responsible_for_keeping_your_account_credentials_secure_and_for_the_accuracy_of_the_information_you_provide_you_must_not_create_accounts_for_others_or_misuse_another_user_s_identity')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_2_household_use')}</Text>
          <Text style={styles.bodyText}>{t('ui_chorehub_is_intended_for_household_and_family_coordination_members_may_be_added_to_a_family_group_assigned_chores_and_track_progress_together_you_agree_to_use_the_platform_respectfully_and_only_for_lawful_household_related_activity')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_3_chore_and_schedule_management')}</Text>
          <Text style={styles.bodyText}>{t('ui_chorehub_allows_users_to_create_assign_complete_and_monitor_tasks_you_are_responsible_for_keeping_task_information_accurate_and_for_respecting_assignments_and_due_dates_within_your_family_conversation')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_4_acceptable_use')}</Text>
          <Text style={styles.bodyText}>{t('ui_you_agree_not_to_use_chorehub_to_harass_others_share_inappropriate_content_spam_family_members_abuse_notifications_or_attempt_unauthorized_access_to_data_belonging_to_another_household_or_user')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_5_availability_and_changes')}</Text>
          <Text style={styles.bodyText}>{t('ui_we_may_update_features_reliability_and_account_rules_over_time_we_may_suspend_access_if_use_violates_these_terms_or_poses_a_security_or_user_experience_risk')}</Text>
        </View>

        <Pressable onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>{t('ui_back_to_sign_up')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#F6F4FF'),
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#247B6B',
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#163B35'),
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: (themeColors.isDark ? themeColors.textSecondary : '#5B586C'),
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 6,
  },
  bodyText: {
    color: (themeColors.isDark ? themeColors.textSecondary : '#4E4B5C'),
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#247B6B',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
