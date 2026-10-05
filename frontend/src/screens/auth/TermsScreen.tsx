import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
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
            <Ionicons name="document-text-outline" size={15} color="#713DE8" />
            <Text style={styles.eyebrowText}>LEGAL</Text>
          </View>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>
            These Terms of Service govern how you use ChoreHub to manage household responsibilities,
            family assignments, and chore tracking.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>1</Text></View>
            <Text style={styles.sectionTitle}>Account responsibility</Text>
          </View>
          <Text style={styles.bodyText}>
            You are responsible for keeping your account credentials secure and for the accuracy of
            the information you provide. You must not create accounts for others or misuse another
            user’s identity.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>2</Text></View>
            <Text style={styles.sectionTitle}>Household use</Text>
          </View>
          <Text style={styles.bodyText}>
            ChoreHub is intended for household and family coordination. Members may be added to a
            family group, assigned chores, and track progress together. You agree to use the platform
            respectfully and only for lawful, household-related activity.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>3</Text></View>
            <Text style={styles.sectionTitle}>Chore and schedule management</Text>
          </View>
          <Text style={styles.bodyText}>
            ChoreHub allows users to create, assign, complete, and monitor tasks. You are responsible
            for keeping task information accurate and for respecting assignments and due dates within
            your family conversation.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>4</Text></View>
            <Text style={styles.sectionTitle}>Acceptable use</Text>
          </View>
          <Text style={styles.bodyText}>
            You agree not to use ChoreHub to harass others, share inappropriate content, spam family
            members, abuse notifications, or attempt unauthorized access to data belonging to another
            household or user.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>5</Text></View>
            <Text style={styles.sectionTitle}>Availability and changes</Text>
          </View>
          <Text style={styles.bodyText}>
            We may update features, reliability, and account rules over time. We may suspend access if
            use violates these terms or poses a security or user-experience risk.
          </Text>
        </View>

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
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
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
