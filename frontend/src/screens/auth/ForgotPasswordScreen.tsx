import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { AuthLayout } from './AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { FeedbackBanner } from '@/components/auth/FeedbackBanner';
import { authService } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [messageKey, setMessageKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const submit = async () => {
    setSuccess(false);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessageKey('ui_enter_a_valid_email_address');
    setLoading(true); setMessageKey('');
    try {
      await authService.requestPasswordReset(email.trim());
      setMessageKey('ui_if_email_has_an_account_password_reset_instructions_have_been_sent'); setSuccess(true);
    } catch { setMessageKey('admin_error'); }
    finally { setLoading(false); }
  };
  return <AuthLayout title={t('ui_reset_your_password')} subtitle={t('ui_enter_your_email_and_we_ll_help_you_get_back_in')}>
    <FeedbackBanner message={messageKey ? t(messageKey).replace('{email}', email.trim()) : ''} type={success ? 'success' : 'error'} />
    <FormField label={t('ui_email_address')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
    <PrimaryButton title={t('ui_send_reset_instructions')} loading={loading} onPress={submit} />
    <Text style={{ color: '#247B6B', fontWeight: '800', textAlign: 'center' }} onPress={() => router.back()}>{t('ui_back_to_sign_in')}</Text>
  </AuthLayout>;
}
