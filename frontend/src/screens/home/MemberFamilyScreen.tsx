import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { familyService, FamilyInfo, FamilyMemberItem } from '@/services/familyService';
import { authService, Member } from '@/services/authService';
import { Avatar } from '@/components/profile/Avatar';

export default function MemberFamilyScreen() {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const user = await authService.getCurrentMember();
      if (user) setCurrentMember(user);

      const res = await familyService.getMyFamily();
      if (res?.family) setFamily(res.family);
      if (res?.members) setMembers(res.members);
    } catch (err: any) {
      setError(err?.message || 'Unable to load family members.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getRelationshipBadge = (relationship?: string) => {
    switch ((relationship || '').toLowerCase()) {
      case 'mother':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FCE7F3'), text: '#EC4899' };
      case 'father':
        return { bg: (themeColors.isDark ? themeColors.surface : '#E0F2FE'), text: '#0284C7' };
      case 'daughter':
        return { bg: (themeColors.isDark ? themeColors.surface : '#F3E8FF'), text: '#9333EA' };
      case 'son':
        return { bg: (themeColors.isDark ? themeColors.surface : '#DCFCE7'), text: '#16A34A' };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#F3F4F6'), text: (themeColors.isDark ? themeColors.textSecondary : '#4B5563') };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#713DE8"
            colors={['#713DE8']}
          />
        }
      >
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
          </Pressable>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>{t('admin_members')}</Text>
            <Text style={styles.headerSubtitle}>{t('household_family')}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Family Banner */}
        <View style={styles.familyBanner}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="people" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.bannerTextGroup}>
            <Text style={styles.familyNameText}>
              {family?.name ? `${family.name}` : t('my_household')}
            </Text>
            <Text style={styles.familySubtitleText}>
              {t('ui_count_members_in_your_household').replace('{count}', String(members.length))}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>{t('ui_household_members')}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
            <Text style={styles.errorTitle}>{t('admin_error')}</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                loadData();
              }}
              style={styles.retryBtn}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>{t('admin_retry')}</Text>
            </Pressable>
          </View>
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>{t('ui_no_family_members_found')}</Text>
            <Text style={styles.emptySubtitle}>{t('ui_you_are_currently_the_only_member_in_this_household')}</Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((item) => {
              const isCurrentUser = currentMember?.id === item.id;
              const relBadge = getRelationshipBadge(item.relationship);

              return (
                <View key={item.id} style={styles.memberCard}>
                  <Avatar name={item.name} uri={item.avatar || undefined} size={50} />

                  <View style={styles.memberDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.memberName}>{item.name}</Text>
                      {isCurrentUser && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>{t('ui_you')}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.memberEmail}>{item.email}</Text>

                    <View style={styles.tagsRow}>
                      <View
                        style={[
                          styles.relTag,
                          { backgroundColor: relBadge.bg },
                        ]}
                      >
                        <Text style={[styles.relTagText, { color: relBadge.text }]}>
                          {item.relationship || t('relationship_other')}
                        </Text>
                      </View>

                      {item.role === 'admin' && (
                        <View style={styles.adminTag}>
                          <Ionicons name="shield-checkmark" size={12} color="#713DE8" />
                          <Text style={styles.adminTagText}>{t('role_admin')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    marginTop: 1,
  },
  errorCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  errorSubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#713DE8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  familyBanner: {
    backgroundColor: '#713DE8',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextGroup: {
    flex: 1,
    gap: 2,
  },
  familyNameText: {
    fontSize: 20,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#FFFFFF'),
  },
  familySubtitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#E0E7FF'),
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginTop: 4,
  },

  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  memberDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  youBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#713DE8',
  },
  memberEmail: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  relTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  relTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  adminTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#713DE8',
  },

  emptyCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  emptySubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    textAlign: 'center',
  },
});
