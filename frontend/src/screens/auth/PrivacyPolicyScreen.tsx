import { useThemedStyles, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.brandMark}>C</Text>
          <Text style={styles.brandText}>ChoreHub</Text>
        </View>

        <Text style={styles.title}>{t('privacy_policy')}</Text>
        <Text style={styles.subtitle}>{t('ui_chorehub_respects_your_privacy_and_only_uses_personal_data_needed_to_support_household_chore_coordination_and_account_access')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_information_we_collect')}</Text>
          <Text style={styles.bodyText}>{t('ui_we_collect_your_name_email_address_password_hash_phone_number_if_provided_profile_image_family_membership_details_chore_assignments_due_dates_task_status_and_account_activity_needed_to_operate_the_app')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_how_we_use_it')}</Text>
          <Text style={styles.bodyText}>{t('ui_we_use_this_information_to_create_and_maintain_your_account_display_household_tasks_assign_chores_send_relevant_notifications_help_family_members_coordinate_work_and_support_account_recovery_and_security')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_sharing_within_the_app')}</Text>
          <Text style={styles.bodyText}>{t('ui_household_members_may_see_shared_chore_information_within_their_family_group_this_includes_assignment_details_due_dates_progress_updates_and_basic_profile_information_necessary_to_coordinate_tasks')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_security')}</Text>
          <Text style={styles.bodyText}>{t('ui_passwords_are_hashed_before_storage_and_session_access_is_protected_using_secure_tokens_we_apply_reasonable_safeguards_to_protect_account_data_and_limit_unauthorized_access')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ui_your_choices')}</Text>
          <Text style={styles.bodyText}>{t('ui_you_can_update_your_profile_details_change_your_password_and_manage_household_access_through_the_chorehub_app_if_you_no_longer_use_the_service_you_may_stop_using_it_and_request_account_support_through_the_app')}</Text>
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
