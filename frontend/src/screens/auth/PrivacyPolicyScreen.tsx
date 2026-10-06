import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const privacySections = [
    {
      icon: 'list-outline' as const,
      title: 'Information we collect',
      text: 'We collect your name, email address, password hash, phone number if provided, profile image, family membership details, chore assignments, due dates, task status, and account activity needed to operate the app.',
    },
    {
      icon: 'settings-outline' as const,
      title: 'How we use it',
      text: 'We use this information to create and maintain your account, display household tasks, assign chores, send relevant notifications, help family members coordinate work, and support account recovery and security.',
    },
    {
      icon: 'people-outline' as const,
      title: 'Sharing within the app',
      text: 'Household members may see shared chore information within their family group. This includes assignment details, due dates, progress updates, and basic profile information necessary to coordinate tasks.',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'Security',
      text: 'Passwords are hashed before storage, and session access is protected using secure tokens. We apply reasonable safeguards to protect account data and limit unauthorized access.',
    },
    {
      icon: 'options-outline' as const,
      title: 'Your choices',
      text: 'You can update your profile details, change your password, and manage household access through the ChoreHub app. If you no longer use the service, you may stop using it and request account support through the app.',
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
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={23} color="#1E1B2E" />
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
            <Text style={styles.eyebrowText}>YOUR PRIVACY</Text>
          </View>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>
            ChoreHub respects your privacy and only uses personal data needed to support household chore
            coordination and account access.
          </Text>
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
          <Text style={styles.buttonText}>Back to sign up</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAE7F5',
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
    backgroundColor: '#F3EEFF',
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
    color: '#1E1B2E',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#656276',
    lineHeight: 21,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#EAE7F5',
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
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  bodyText: {
    color: '#656276',
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
