import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FormField } from '@/components/auth/FormField';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';

export default function EditProfileScreen() {
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
				setError(requestError instanceof Error ? requestError.message : 'Unable to load your profile.')
			)
			.finally(() => setLoading(false));
	}, []);

	const save = async () => {
		if (name.trim().length < 2) {
			setError('Please enter your name.');
			return;
		}

		setSaving(true);
		setError('');
		try {
			await profileService.updateProfile({ name: name.trim(), phone: phone.trim() });
			router.replace('/profile');
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'We could not save your changes.');
		} finally {
			setSaving(false);
		}
	};

	const confirmDeleteAccount = async () => {
		try {
			setSaving(true);
			setError('');
			await profileService.deleteProfile();
			await authService.signOut();
			if (Platform.OS === 'web') {
				globalThis.alert('Your account has been removed.');
				router.replace('/auth/login');
			} else {
				Alert.alert('Account deleted', 'Your account has been removed.', [
					{ text: 'OK', onPress: () => router.replace('/auth/login') },
				]);
			}
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'We could not delete your account.');
		} finally {
			setSaving(false);
		}
	};

	const deleteAccount = () => {
		const message = 'This action permanently removes your account and cannot be undone. Continue?';
		if (Platform.OS === 'web') {
			if (globalThis.confirm(message)) void confirmDeleteAccount();
			return;
		}

		Alert.alert('Delete account', message, [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Delete', style: 'destructive', onPress: () => void confirmDeleteAccount() },
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
						accessibilityLabel="Go back"
					>
						<Ionicons name="chevron-back" size={24} color="#1E1B2E" />
					</Pressable>
					<Text style={styles.headerTitle}>Personal Information</Text>
					<View style={styles.headerSpacer} />
				</View>

				<View style={styles.intro}>
					<View style={styles.introIcon}>
						<Ionicons name="person-outline" size={23} color="#713DE8" />
					</View>
					<Text style={styles.title}>Your details</Text>
					<Text style={styles.subtitle}>Keep your personal information up to date.</Text>
				</View>

				<View style={styles.detailsCard}>
					<Text style={styles.cardTitle}>Personal details</Text>
					{error ? (
						<View style={styles.errorBanner}>
							<Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
							<Text style={styles.errorText}>{error}</Text>
						</View>
					) : null}
					<FormField
						label="Full name"
						value={name}
						onChangeText={setName}
						placeholder="Your name"
						autoComplete="name"
						editable={!loading}
						style={styles.input}
					/>
					<FormField
						label="Email address"
						value={email}
						placeholder="you@example.com"
						keyboardType="email-address"
						autoCapitalize="none"
						editable={false}
						style={styles.input}
					/>
					<FormField
						label="Phone number (optional)"
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
					<Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save changes'}</Text>
				</Pressable>

				<Pressable
					onPress={deleteAccount}
					disabled={saving || loading}
					style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, (saving || loading) && styles.disabled]}
				>
					<Ionicons name="trash-outline" size={20} color="#EF4444" />
					<Text style={styles.deleteButtonText}>Delete account</Text>
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#FAFAFD' },
	scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 20 },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
	backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
	headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E1B2E' },
	headerSpacer: { width: 38 },
	intro: { alignItems: 'center', paddingTop: 8, paddingBottom: 2 },
	introIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
	title: { fontSize: 22, fontWeight: '900', color: '#1E1B2E' },
	subtitle: { marginTop: 5, textAlign: 'center', fontSize: 14, lineHeight: 20, color: '#8A879A' },
	detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, gap: 16, borderWidth: 1, borderColor: '#EAE7F5', shadowColor: '#713DE8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
	cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B2E', marginBottom: 2 },
	input: { backgroundColor: '#FAFAFD', borderColor: '#EAE7F5', color: '#1E1B2E' },
	errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
	errorText: { flex: 1, color: '#B91C1C', fontSize: 13, lineHeight: 18 },
	saveButton: { minHeight: 54, backgroundColor: '#713DE8', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: '#713DE8', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
	saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
	deleteButton: { minHeight: 54, backgroundColor: '#FEF2F2', borderRadius: 18, borderWidth: 1.5, borderColor: '#FCA5A5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
	deleteButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '800' },
	pressed: { opacity: 0.84 },
	disabled: { opacity: 0.6 },
});
