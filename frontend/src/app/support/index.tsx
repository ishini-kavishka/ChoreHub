import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import SupportDashboardScreen from '@/screens/support/SupportDashboardScreen';
import AdminSupportDashboardScreen from '@/screens/support/AdminSupportDashboardScreen';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';

export default function SupportIndex() {
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<'admin' | 'member' | null>(
    params.role === 'admin' ? 'admin' : null
  );

  useEffect(() => {
    if (params.role === 'admin') {
      setRole('admin');
      return;
    }

    let mounted = true;

    async function checkRole() {
      try {
        const member = await authService.getCurrentMember();
        if (!mounted) return;

        if (member?.role?.toLowerCase() === 'admin') {
          setRole('admin');
          return;
        }

        // Fallback: Check fresh profile if cached member role was missing
        try {
          const fresh = await profileService.getProfile();
          if (!mounted) return;
          if (fresh?.role?.toLowerCase() === 'admin') {
            setRole('admin');
            return;
          }
        } catch {}

        setRole('member');
      } catch {
        if (mounted) setRole('member');
      }
    }

    checkRole();

    return () => {
      mounted = false;
    };
  }, [params.role]);

  if (role === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FAFAFD',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#6C3BEA" />
      </View>
    );
  }

  if (role === 'admin') {
    return <AdminSupportDashboardScreen />;
  }

  return <SupportDashboardScreen />;
}
