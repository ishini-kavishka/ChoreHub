import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
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
  const alert = useAppAlert();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
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
      alert(t('ui_required_field'), t('ui_please_enter_your_full_name'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert(t('ui_required_field'), t('valid_email'));
      return;
    }
    if (!subject.trim()) {
      alert(t('ui_required_field'), t('ui_please_specify_a_subject_for_your_message'));
      return;
    }
    if (!message.trim()) {
      alert(t('ui_required_field'), t('ui_please_enter_your_message'));
      return;
    }

    setSubmitting(true);
    // Simulate sending message
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      alert(
        t('ui_message_sent'),
        t('ui_thank_you_for_reaching_out_our_support_team_will_get_back_to_you_within_24_hours'),
        [
          {
            text: t('ui_ok'),
            onPress: () => {
              setSubject('');
              setMessage('');
              setSubmitted(false);
              if (router.canGoBack()) router.back();
              else router.replace('/support/contact-support' as any);
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
          onPress={() => router.canGoBack() ? router.back() : router.replace('/support/contact-support' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('admin_back')}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('ui_contact_us')}</Text>
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
            <Text style={styles.sectionTitle}>{t('ui_send_us_a_message')}</Text>
            <Text style={styles.sectionSubtitle}>{t('ui_fill_in_the_form_below_and_we_ll_get_back_to_you_as_soon_as_possible')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('full_name')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('ui_enter_your_name')}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9EA5B1"}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('ui_email_address')}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('ui_enter_your_email')}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9EA5B1"}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('ui_subject')}</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder={t('ui_type_your_subject')}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9EA5B1"}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('ui_your_message')}</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={t('ui_type_your_message_here')}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9EA5B1"}
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
                <Text style={styles.submitBtnText}>{t('ui_send_message')}</Text>
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

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F0EEF8'),
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
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
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3EEFF'),
    borderWidth: 2,
    borderColor: (themeColors.isDark ? themeColors.border : '#E6DEFC'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
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
    borderColor: (themeColors.isDark ? themeColors.border : '#FFFFFF'),
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
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
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
    color: (themeColors.isDark ? themeColors.textSecondary : '#4B485A'),
  },
  textInput: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
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
