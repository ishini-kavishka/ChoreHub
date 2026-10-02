import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.brandMark}>C</Text>
          <Text style={styles.brandText}>ChoreHub</Text>
        </View>

        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>
          ChoreHub respects your privacy and only uses personal data needed to support household chore
          coordination and account access.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information we collect</Text>
          <Text style={styles.bodyText}>
            We collect your name, email address, password hash, phone number if provided, profile
            image, family membership details, chore assignments, due dates, task status, and account
            activity needed to operate the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How we use it</Text>
          <Text style={styles.bodyText}>
            We use this information to create and maintain your account, display household tasks,
            assign chores, send relevant notifications, help family members coordinate work, and
            support account recovery and security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sharing within the app</Text>
          <Text style={styles.bodyText}>
            Household members may see shared chore information within their family group. This includes
            assignment details, due dates, progress updates, and basic profile information necessary to
            coordinate tasks.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Text style={styles.bodyText}>
            Passwords are hashed before storage, and session access is protected using secure tokens.
            We apply reasonable safeguards to protect account data and limit unauthorized access.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your choices</Text>
          <Text style={styles.bodyText}>
            You can update your profile details, change your password, and manage household access
            through the ChoreHub app. If you no longer use the service, you may stop using it and
            request account support through the app.
          </Text>
        </View>

        <Pressable onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Back to sign up</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F4FF',
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
    color: '#163B35',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#5B586C',
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 6,
  },
  bodyText: {
    color: '#4E4B5C',
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
