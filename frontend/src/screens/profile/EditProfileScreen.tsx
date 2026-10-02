import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { AuthLayout } from '@/screens/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { FeedbackBanner } from '@/components/auth/FeedbackBanner';
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
			Alert.alert('Saved', 'Your personal information has been updated.', [
				{ text: 'Done', onPress: () => router.back() },
			]);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'We could not save your changes.');
		} finally {
			setSaving(false);
		}
	};

	const deleteAccount = async () => {
		Alert.alert('Delete account', 'This action permanently removes your account and cannot be undone. Continue?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						setSaving(true);
						await profileService.deleteProfile();
						await authService.signOut();
						Alert.alert('Account deleted', 'Your account has been removed.', [
							{ text: 'OK', onPress: () => router.replace('/auth/login') },
						]);
					} catch (requestError) {
						setError(requestError instanceof Error ? requestError.message : 'We could not delete your account.');
					} finally {
						setSaving(false);
					}
				},
			},
		]);
	};

	return (
		<AuthLayout title="Personal information" subtitle="Keep your details up to date.">
			<FeedbackBanner message={error} />
			<FormField
				label="Full name"
				value={name}
				onChangeText={setName}
				placeholder="Your name"
				autoComplete="name"
				editable={!loading}
			/>
			<FormField
				label="Email address"
				value={email}
				placeholder="you@example.com"
				keyboardType="email-address"
				autoCapitalize="none"
				editable={false}
			/>
			<FormField
				label="Phone number (optional)"
				value={phone}
				onChangeText={setPhone}
				placeholder="+94 77 123 4567"
				keyboardType="phone-pad"
				editable={!loading}
			/>
			<PrimaryButton title="Save changes" onPress={save} loading={saving || loading} />
			<PrimaryButton
				title="Delete account"
				onPress={deleteAccount}
				loading={saving || loading}
				variant="danger"
			/>
		</AuthLayout>
	);
}
