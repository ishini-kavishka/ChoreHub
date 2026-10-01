import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SupportBottomNav } from '@/components/support/SupportBottomNav';
import { authService } from '@/services/authService';

export default function ContactUsScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Attempt to prefill user's info if available
    authService.getCurrentMember().then((member) => {
      if (member) {
        if (member.name) setName(member.name);
        if (member.email) setEmail(member.email);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required Field', 'Please enter a valid email address.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Required Field', 'Please specify a subject for your message.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Required Field', 'Please enter your message.');
      return;
    }

    setSubmitting(true);
    // Simulate sending message
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      Alert.alert(
        'Message Sent!',
        'Thank you for reaching out. Our support team will get back to you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setMessage('');
              setSubmitted(false);
              router.back();
            },
          },
        ]
      );
    }, 900);
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
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.placeholderBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Support Illustration */}
          <View style={styles.illustrationSection}>
            <View style={styles.illustrationOuterRing}>
              <View style={styles.illustrationInnerCircle}>
                <View style={styles.illustrationBadge24}>
                  <Text style={styles.badge24Text}>24</Text>
                </View>
                <Ionicons name="headset" size={44} color="#6C3BEA" />
              </View>
            </View>
          </View>

          {/* Subtitle */}
          <View style={styles.textSection}>
            <Text style={styles.sectionTitle}>Send us a message</Text>
            <Text style={styles.sectionSubtitle}>
              Fill in the form below and we'll get back to you as soon as possible
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9EA5B1"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9EA5B1"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Type your subject"
                placeholderTextColor="#9EA5B1"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type your message here..."
                placeholderTextColor="#9EA5B1"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[styles.textInput, styles.textArea]}
              />
            </View>

            {/* Action Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
                submitting && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Send Message</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  illustrationOuterRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F3EEFF',
    borderWidth: 2,
    borderColor: '#E6DEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationBadge24: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#6C3BEA',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badge24Text: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#656276',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B485A',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E1B2E',
  },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: '#6C3BEA',
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
