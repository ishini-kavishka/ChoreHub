import React, { useState } from 'react';
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

interface FaqItem {
  id: string;
  category: 'account' | 'chores' | 'notifications';
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: '1',
    category: 'account',
    question: 'How do I create an account ?',
    answer:
      'You can create a ChoreHub account on the Sign Up screen by providing your full name, email address, and setting a password. You can also join an existing family household using an invite code.',
  },
  {
    id: '2',
    category: 'account',
    question: 'How can I reset my password ?',
    answer:
      'To reset your password, go to Profile > Change password if you are logged in. If you are signed out, tap "Forgot Password?" on the login screen to receive a secure password reset link.',
  },
  {
    id: '3',
    category: 'notifications',
    question: 'Why am I not receiving notifications ?',
    answer:
      'Ensure that notifications are enabled in your device settings for ChoreHub. In addition, verify that notification alerts are enabled within your in-app profile settings.',
  },
  {
    id: '4',
    category: 'account',
    question: 'How do I change my profile picture ?',
    answer:
      'Navigate to your Profile screen, tap "Profile picture", and select an image from your device photo gallery or take a new photo with your camera.',
  },
  {
    id: '5',
    category: 'account',
    question: 'Can I use the app on multiple devices ?',
    answer:
      'Yes, you can log in to your ChoreHub account on any supported device. All your family chores, tasks, points, and history will stay automatically synchronized in real-time.',
  },
  {
    id: '6',
    category: 'account',
    question: 'How do I delete my account ?',
    answer:
      'To delete your account and personal data permanently, please visit Profile > Account details or reach out directly to our support team via Contact Support.',
  },
  {
    id: '7',
    category: 'chores',
    question: 'How do I mark a chore as complete ?',
    answer:
      'Simply tap the checkmark icon next to the chore card on your Home or Chores screen. Your completed chores will be recorded and points awarded immediately.',
  },
  {
    id: '8',
    category: 'chores',
    question: 'Can household members trade chores ?',
    answer:
      'Yes! Open the chore details, select "Reassign", and choose another household member who agreed to take over the task.',
  },
];

type CategoryFilter = 'all' | 'account' | 'chores' | 'notifications';

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'account', label: 'Account' },
  { id: 'chores', label: 'Chores' },
  { id: 'notifications', label: 'Notifications' },
];

export default function FaqScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs =
    selectedCategory === 'all'
      ? FAQS
      : FAQS.filter((faq) => faq.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/support' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
        </Pressable>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.pill, isActive ? styles.activePill : styles.inactivePill]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive ? styles.activePillText : styles.inactivePillText,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* FAQs Accordion List */}
        <View style={styles.faqList}>
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <Pressable
                  onPress={() => toggleExpand(faq.id)}
                  style={styles.faqHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <Text style={styles.questionText}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#6C3BEA"
                  />
                </Pressable>

                {isExpanded && (
                  <View style={styles.answerWrap}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Help Banner at Bottom */}
        <View style={styles.bottomHelpBanner}>
          <Text style={styles.bottomHelpText}>Didn't find your answer?</Text>
          <Pressable
            onPress={() => router.push('/support/contact-support' as any)}
            style={({ pressed }) => [styles.contactLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.contactLinkText}>Contact Support Team ›</Text>
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
    paddingTop: 16,
    paddingBottom: 28,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: '#6C3BEA',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inactivePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  inactivePillText: {
    color: '#656276',
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
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
  faqHeader: {
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
  bottomHelpBanner: {
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
    paddingVertical: 8,
  },
  bottomHelpText: {
    fontSize: 13,
    color: '#8A879A',
  },
  contactLink: {
    paddingVertical: 4,
  },
  contactLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C3BEA',
  },
});
