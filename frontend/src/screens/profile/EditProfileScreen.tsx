import { translateFeedback } from '@/i18n/translations';
import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FormField } from '@/components/auth/FormField';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';

export default function EditProfileScreen() {
  const alert = useAppAlert();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		profileService
			.getProfile()
			.then((p) => {
				setName(p.name);
				setEmail(p.email);
				setPhone(p.phone ?? '');
			})
			.catch((requestError) =>
				setError(t('admin_error'))
			)
			.finally(() => setLoading(false));
	}, []);

	const save = async () => {
		if (name.trim().length < 2) {
			setError(t('ui_please_enter_your_name'));
			return;
		}

		setSaving(true);
		setError('');
		try {
			await profileService.updateProfile({ name: name.trim(), phone: phone.trim() });
			router.replace('/profile');
		} catch (requestError) {
			setError(t('admin_error'));
		} finally {
			setSaving(false);
		}
	};

	const deleteAccount = async () => {
		alert(t('ui_delete_account'), t('delete_account_confirm'), [
			{ text: t('cancel'), style: 'cancel' },
			{
				text: t('delete'),
				style: 'destructive',
				onPress: async () => {
					try {
						setSaving(true);
						await profileService.deleteProfile();
						await authService.signOut();
						alert(t('ui_account_deleted'), t('ui_your_account_has_been_removed'), [
							{ text: t('ui_ok'), onPress: () => router.replace('/auth/login') },
						]);
					} catch (requestError) {
						setError(t('admin_error'));
					} finally {
						setSaving(false);
					}
				},
			},
		]);
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<Pressable
						onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')}
						style={styles.backButton}
						accessibilityRole="button"
						accessibilityLabel={t('admin_back')}
					>
						<Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
					</Pressable>
					<Text style={styles.headerTitle}>{t('menu_personal_info')}</Text>
					<View style={styles.headerSpacer} />
				</View>

				<View style={styles.intro}>
					<View style={styles.introIcon}>
						<Ionicons name="person-outline" size={23} color="#713DE8" />
					</View>
					<Text style={styles.title}>{t('ui_your_details')}</Text>
					<Text style={styles.subtitle}>{t('ui_keep_your_personal_information_up_to_date')}</Text>
				</View>

				<View style={styles.detailsCard}>
					<Text style={styles.cardTitle}>{t('ui_personal_details')}</Text>
					{error ? (
						<View style={styles.errorBanner}>
							<Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
							<Text style={styles.errorText}>{translateFeedback(error, t)}</Text>
						</View>
					) : null}
					<FormField
						label={t('ui_full_name')}
						value={name}
						onChangeText={setName}
						placeholder={t('ui_your_name')}
						autoComplete="name"
						editable={!loading}
						style={styles.input}
					/>
					<FormField
						label={t('ui_email_address')}
						value={email}
						placeholder="you@example.com"
						keyboardType="email-address"
						autoCapitalize="none"
						editable={false}
						style={styles.input}
					/>
					<FormField
						label={t('ui_phone_number_optional')}
						value={phone}
						onChangeText={setPhone}
						placeholder="+94 77 123 4567"
						keyboardType="phone-pad"
						editable={!loading}
						style={styles.input}
					/>
				</View>

				<Pressable
					onPress={save}
					disabled={saving || loading}
					style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, (saving || loading) && styles.disabled]}
				>
					{saving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />}
					<Text style={styles.saveButtonText}>{saving ? t('ui_saving') : t('ui_save_changes')}</Text>
				</Pressable>

				<Pressable
					onPress={deleteAccount}
					disabled={saving || loading}
					style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, (saving || loading) && styles.disabled]}
				>
					<Ionicons name="trash-outline" size={20} color="#EF4444" />
					<Text style={styles.deleteButtonText}>{t('ui_delete_account')}</Text>
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD') },
	scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 20 },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
	backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
	headerTitle: { fontSize: 20, fontWeight: '900', color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E') },
	headerSpacer: { width: 38 },
	intro: { alignItems: 'center', paddingTop: 8, paddingBottom: 2 },
	introIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'), alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
	title: { fontSize: 22, fontWeight: '900', color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E') },
	subtitle: { marginTop: 5, textAlign: 'center', fontSize: 14, lineHeight: 20, color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A') },
	detailsCard: { backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'), borderRadius: 22, padding: 18, gap: 16, borderWidth: 1, borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'), shadowColor: '#713DE8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
	cardTitle: { fontSize: 16, fontWeight: '800', color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'), marginBottom: 2 },
	input: { backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'), borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'), color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E') },
	errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF2F2'), borderWidth: 1, borderColor: (themeColors.isDark ? themeColors.border : '#FECACA') },
	errorText: { flex: 1, color: (themeColors.isDark ? themeColors.error : '#B91C1C'), fontSize: 13, lineHeight: 18 },
	saveButton: { minHeight: 54, backgroundColor: '#713DE8', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: '#713DE8', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
	saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
	deleteButton: { minHeight: 54, backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF2F2'), borderRadius: 18, borderWidth: 1.5, borderColor: '#FCA5A5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
	deleteButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '800' },
	pressed: { opacity: 0.84 },
	disabled: { opacity: 0.6 },
});
