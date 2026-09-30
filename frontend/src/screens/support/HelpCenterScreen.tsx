import React from 'react';
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

interface TopicItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const POPULAR_TOPICS: TopicItem[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    subtitle: 'Learn the basics',
    icon: 'rocket-outline',
  },
  {
    id: 'chore-management',
    title: 'Chore Management',
    subtitle: 'Assign, edit and track chores',
    icon: 'clipboard-outline',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Reminders and alerts',
    icon: 'notifications-outline',
  },
  {
    id: 'account-details',
    title: 'Account details',
    subtitle: 'Password, Login and more',
    icon: 'person-outline',
  },
  {
    id: 'app-settings',
    title: 'App Settings',
    subtitle: 'Preferences and Customization',
    icon: 'settings-outline',
  },
];

export default function HelpCenterScreen() {
  const handleSelectTopic = (topic: TopicItem) => {
    router.push({
      pathname: '/support/topic',
      params: { id: topic.id, title: topic.title },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Help Center Top Graphic */}
        <View style={styles.graphicContainer}>
          <View style={styles.graphicCard}>
            <View style={styles.graphicIconCircle}>
              <Ionicons name="library-outline" size={44} color="#6C3BEA" />
            </View>
            <Text style={styles.graphicTitle}>Knowledge Base & Guides</Text>
            <Text style={styles.graphicSubtitle}>
              Find detailed walkthroughs for all ChoreHub features
            </Text>
          </View>
        </View>

        {/* Popular Topics Section */}
        <Text style={styles.sectionHeader}>Popular Topics</Text>

        <View style={styles.topicsList}>
          {POPULAR_TOPICS.map((topic) => (
            <Pressable
              key={topic.id}
              onPress={() => handleSelectTopic(topic)}
              style={({ pressed }) => [
                styles.topicCard,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
            >
              <View style={styles.topicIconWrap}>
                <Ionicons name={topic.icon} size={22} color="#6C3BEA" />
              </View>
              <View style={styles.topicTextWrap}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A879A" />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Persistent Bottom Navigation */}
      <SupportBottomNav activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    backgroundColor: '#FFFFFF',
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
    color: '#1E1B2E',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  graphicContainer: {
    marginBottom: 24,
  },
  graphicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  graphicIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  graphicTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 4,
  },
  graphicSubtitle: {
    fontSize: 12,
    color: '#656276',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 12,
  },
  topicsList: {
    gap: 10,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  topicIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F4F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTextWrap: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 2,
  },
  topicSubtitle: {
    fontSize: 12,
    color: '#8A879A',
  },
});
