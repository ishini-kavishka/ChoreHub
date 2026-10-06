import { useThemedStyles, useAppTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const styles = useThemedStyles(createStyles);
  const themeColors = useAppTheme().colors;
  const { t } = useLanguage();
  const privacySections = [
    {
      icon: 'list-outline' as const,
      title: t('ui_information_we_collect'),
      text: t('ui_we_collect_your_name_email_address_password_hash_phone_number_if_provided_profile_image_family_membership_details_chore_assignments_due_dates_task_status_and_account_activity_needed_to_operate_the_app'),
    },
    {
      icon: 'settings-outline' as const,
      title: t('ui_how_we_use_it'),
      text: t('ui_we_use_this_information_to_create_and_maintain_your_account_display_household_tasks_assign_chores_send_relevant_notifications_help_family_members_coordinate_work_and_support_account_recovery_and_security'),
    },
    {
      icon: 'people-outline' as const,
      title: t('ui_sharing_within_the_app'),
      text: t('ui_household_members_may_see_shared_chore_information_within_their_family_group_this_includes_assignment_details_due_dates_progress_updates_and_basic_profile_information_necessary_to_coordinate_tasks'),
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: t('ui_security'),
      text: t('ui_passwords_are_hashed_before_storage_and_session_access_is_protected_using_secure_tokens_we_apply_reasonable_safeguards_to_protect_account_data_and_limit_unauthorized_access'),
    },
    {
      icon: 'options-outline' as const,
      title: t('ui_your_choices'),
      text: t('ui_you_can_update_your_profile_details_change_your_password_and_manage_household_access_through_the_chorehub_app_if_you_no_longer_use_the_service_you_may_stop_using_it_and_request_account_support_through_the_app'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('admin_back')}
          >
            <Ionicons name="chevron-back" size={23} color={themeColors.textPrimary} />
          </Pressable>
          <View style={styles.brandName}>
            <Text style={styles.brandChore}>Chore</Text>
            <Text style={styles.brandHub}>Hub</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.titleCard}>
          <View style={styles.eyebrow}>
            <Ionicons name="shield-checkmark-outline" size={15} color="#713DE8" />
            <Text style={styles.eyebrowText}>{t('privacy_policy')}</Text>
          </View>
          <Text style={styles.title}>{t('privacy_policy')}</Text>
          <Text style={styles.subtitle}>
            {t('ui_chorehub_respects_your_privacy_and_only_uses_personal_data_needed_to_support_household_chore_coordination_and_account_access')}</Text>
        </View>

        {privacySections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}>
                <Ionicons name={section.icon} size={17} color="#713DE8" />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.bodyText}>{section.text}</Text>
          </View>
        ))}

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{t('ui_back_to_sign_up')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandChore: {
    fontSize: 21,
    fontWeight: '900',
    color: '#713DE8',
    letterSpacing: -0.4,
  },
  brandHub: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FF9F1C',
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 38,
  },
  titleCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 2,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3EEFF'),
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  eyebrowText: {
    color: '#713DE8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 27,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 21,
  },
  section: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  bodyText: {
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    fontSize: 14,
    lineHeight: 21,
  },
  button: {
    backgroundColor: '#713DE8',
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    marginTop: 4,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.84,
  },
});
