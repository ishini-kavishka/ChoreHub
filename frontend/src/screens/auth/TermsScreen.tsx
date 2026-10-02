import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.brandMark}>C</Text>
          <Text style={styles.brandText}>ChoreHub</Text>
        </View>

        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.subtitle}>
          These Terms of Service govern how you use ChoreHub to manage household responsibilities,
          family assignments, and chore tracking.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Account responsibility</Text>
          <Text style={styles.bodyText}>
            You are responsible for keeping your account credentials secure and for the accuracy of
            the information you provide. You must not create accounts for others or misuse another
            user’s identity.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Household use</Text>
          <Text style={styles.bodyText}>
            ChoreHub is intended for household and family coordination. Members may be added to a
            family group, assigned chores, and track progress together. You agree to use the platform
            respectfully and only for lawful, household-related activity.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Chore and schedule management</Text>
          <Text style={styles.bodyText}>
            ChoreHub allows users to create, assign, complete, and monitor tasks. You are responsible
            for keeping task information accurate and for respecting assignments and due dates within
            your family conversation.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Acceptable use</Text>
          <Text style={styles.bodyText}>
            You agree not to use ChoreHub to harass others, share inappropriate content, spam family
            members, abuse notifications, or attempt unauthorized access to data belonging to another
            household or user.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Availability and changes</Text>
          <Text style={styles.bodyText}>
            We may update features, reliability, and account rules over time. We may suspend access if
            use violates these terms or poses a security or user-experience risk.
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
