import { useThemedStyles, useAppTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const styles = useThemedStyles(createStyles);
  const themeColors = useAppTheme().colors;
  const { t } = useLanguage();
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
            <Ionicons name="document-text-outline" size={15} color="#713DE8" />
            <Text style={styles.eyebrowText}>{t('terms_of_service')}</Text>
          </View>
          <Text style={styles.title}>{t('terms_of_service')}</Text>
          <Text style={styles.subtitle}>
            {t('ui_these_terms_of_service_govern_how_you_use_chorehub_to_manage_household_responsibilities_family_assignments_and_chore_tracking')}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>1</Text></View>
            <Text style={styles.sectionTitle}>{t('ui_1_account_responsibility').replace(/^\p{Nd}+\s*[.、]\s*/u, '')}</Text>
          </View>
          <Text style={styles.bodyText}>
            {t('ui_you_are_responsible_for_keeping_your_account_credentials_secure_and_for_the_accuracy_of_the_information_you_provide_you_must_not_create_accounts_for_others_or_misuse_another_user_s_identity')}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>2</Text></View>
            <Text style={styles.sectionTitle}>{t('ui_2_household_use').replace(/^\p{Nd}+\s*[.、]\s*/u, '')}</Text>
          </View>
          <Text style={styles.bodyText}>
            {t('ui_chorehub_is_intended_for_household_and_family_coordination_members_may_be_added_to_a_family_group_assigned_chores_and_track_progress_together_you_agree_to_use_the_platform_respectfully_and_only_for_lawful_household_related_activity')}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>3</Text></View>
            <Text style={styles.sectionTitle}>{t('ui_3_chore_and_schedule_management').replace(/^\p{Nd}+\s*[.、]\s*/u, '')}</Text>
          </View>
          <Text style={styles.bodyText}>
            {t('ui_chorehub_allows_users_to_create_assign_complete_and_monitor_tasks_you_are_responsible_for_keeping_task_information_accurate_and_for_respecting_assignments_and_due_dates_within_your_family_conversation')}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>4</Text></View>
            <Text style={styles.sectionTitle}>{t('ui_4_acceptable_use').replace(/^\p{Nd}+\s*[.、]\s*/u, '')}</Text>
          </View>
          <Text style={styles.bodyText}>
            {t('ui_you_agree_not_to_use_chorehub_to_harass_others_share_inappropriate_content_spam_family_members_abuse_notifications_or_attempt_unauthorized_access_to_data_belonging_to_another_household_or_user')}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>5</Text></View>
            <Text style={styles.sectionTitle}>{t('ui_5_availability_and_changes').replace(/^\p{Nd}+\s*[.、]\s*/u, '')}</Text>
          </View>
          <Text style={styles.bodyText}>
            {t('ui_we_may_update_features_reliability_and_account_rules_over_time_we_may_suspend_access_if_use_violates_these_terms_or_poses_a_security_or_user_experience_risk')}</Text>
        </View>

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
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: '#713DE8',
    fontSize: 13,
    fontWeight: '900',
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
