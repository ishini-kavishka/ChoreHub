import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { authService } from '@/services/authService';

export default function SplashScreen() {
  useEffect(() => {
    let active = true;
    ExpoSplashScreen.hideAsync();
    authService.getCurrentMember().then((member) => {
      if (active) router.replace(member ? '/profile' : '/auth/welcome');
    }).catch(() => {
      if (active) router.replace('/auth/welcome');
    });
    return () => { active = false; };
  }, []);
  return <View style={styles.screen}><View style={styles.mark}><Text style={styles.markText}>C</Text></View><Text style={styles.name}>ChoreHub</Text><Text style={styles.tagline}>A calmer way to share the load.</Text></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#247B6B', alignItems: 'center', justifyContent: 'center' }, mark: { width: 94, height: 94, borderRadius: 30, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, markText: { color: '#247B6B', fontSize: 52, fontWeight: '900' }, name: { color: '#FFF', fontSize: 34, fontWeight: '900', marginTop: 22 }, tagline: { color: '#DDF3EE', fontSize: 16, marginTop: 8 } });
