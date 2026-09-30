import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SupportBottomNav } from '@/components/support/SupportBottomNav';

interface TopicArticle {
  question: string;
  answer: string;
}

const DEFAULT_ARTICLES: Record<string, TopicArticle[]> = {
  'chore-management': [
    {
      question: 'How do I assign a chore ?',
      answer:
        'To assign a chore, navigate to the Chores tab or Admin Dashboard. Tap the "+ Add Chore" button, select the family member you wish to assign it to, set the due date and points, and tap Save.',
    },
    {
      question: "Can I edit a chore after it's assigned ?",
      answer:
        'Yes, you can edit chore details at any time before it is marked completed. Simply open the chore from your list, tap "Edit", update the necessary details, and save your changes.',
    },
    {
      question: 'Can I set recurring chores ?',
      answer:
        'Yes! When creating or editing a chore, toggle the "Recurring" option and select your preferred frequency (Daily, Weekly, or Monthly).',
    },
    {
      question: 'How do I remove a chore ?',
      answer:
        'Open the chore details and tap the "Delete" option at the bottom. Note that only household admins or the creator of the chore have permission to remove it.',
    },
  ],
  'getting-started': [
    {
      question: 'What is ChoreHub ?',
      answer:
        'ChoreHub is a collaborative household management app that helps families organize chores, track daily responsibilities, and celebrate wins together.',
    },
    {
      question: 'How do I invite family members ?',
      answer:
        'From your Home or Profile screen, go to Household Settings and tap "Invite Member". Share your household code or send an email invitation.',
    },
    {
      question: 'How do points and rewards work ?',
      answer:
        'Whenever a member completes an assigned chore, they earn points defined for that task. Points can be redeemed for agreed family rewards!',
    },
  ],
  'notifications': [
    {
      question: 'Why am I not receiving notifications ?',
      answer:
        'Make sure notifications are enabled for ChoreHub in your phone settings. Also check in-app App Settings to ensure reminders are toggled on.',
    },
    {
      question: 'Can I customize chore reminder times ?',
      answer:
        'Yes, you can set reminder alerts for 1 hour before due time or daily morning summaries in App Settings.',
    },
  ],
  'account-details': [
    {
      question: 'How do I change my profile picture ?',
      answer:
        'Go to your Profile tab, tap "Profile picture", and choose an image from your gallery or camera.',
    },
    {
      question: 'How can I reset my password ?',
      answer:
        'Navigate to Profile > Change password to update your password securely, or use the "Forgot Password" link on the login screen.',
    },
  ],
  'app-settings': [
    {
      question: 'Does ChoreHub support dark mode ?',
      answer:
        'Yes, ChoreHub automatically adapts to your system appearance preferences or can be switched manually in Theme settings.',
    },
    {
      question: 'How do I update my language preferences ?',
      answer:
        'Go to App Settings > Language and select your preferred language.',
    },
  ],
};

export default function HelpTopicScreen() {
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const topicId = params.id || 'chore-management';
  const topicTitle = params.title || 'Chore Management';

  const articles = DEFAULT_ARTICLES[topicId] || DEFAULT_ARTICLES['chore-management'];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
        <Text style={styles.headerTitle}>{topicTitle}</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Questions list */}
        <View style={styles.questionsContainer}>
          {articles.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={index} style={styles.questionCard}>
                <Pressable
                  onPress={() => toggleExpand(index)}
                  style={styles.questionHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#6C3BEA"
                  />
                </Pressable>

                {isExpanded && (
                  <View style={styles.answerWrap}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Still Need Help? Card matching reference */}
        <View style={styles.helpBox}>
          <View style={styles.helpIconCircle}>
            <Ionicons name="bulb-outline" size={28} color="#6C3BEA" />
          </View>
          <Text style={styles.helpBoxTitle}>Still need Help ?</Text>
          <Text style={styles.helpBoxSubtitle}>
            Contact our support team and we'll be happy to assist you.
          </Text>
          <Pressable
            onPress={() => router.push('/support/contact-support' as any)}
            style={({ pressed }) => [
              styles.contactBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </Pressable>
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
    paddingTop: 20,
    paddingBottom: 28,
  },
  questionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    overflow: 'hidden',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  questionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B2E',
    flex: 1,
    paddingRight: 10,
  },
  answerWrap: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F4F2FA',
    paddingTop: 10,
  },
  answerText: {
    fontSize: 13,
    color: '#656276',
    lineHeight: 19,
  },
  helpBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 8,
  },
  helpIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  helpBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 4,
  },
  helpBoxSubtitle: {
    fontSize: 12,
    color: '#656276',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    lineHeight: 17,
  },
  contactBtn: {
    backgroundColor: '#6C3BEA',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
