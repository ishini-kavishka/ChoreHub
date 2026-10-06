import { useLanguage } from '@/context/LanguageContext';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
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
import { familyService, FamilyMemberItem, FamilyInfo } from '@/services/familyService';
import { Avatar } from '@/components/profile/Avatar';

export default function AdminMembersScreen() {
  const { t } = useLanguage();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await familyService.getMyFamily();
      if (res) {
        setFamily(res.family);
        setMembers(res.members || []);
      }
    } catch {
      // Soft fail
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

  const getRelationshipColor = (rel?: string) => {
    switch (rel) {
      case 'Mother':
      case 'Father':
      case 'Parent':
        return { bg: (themeColors.isDark ? themeColors.surface : '#EDE9FE'), text: '#713DE8' };
      case 'Daughter':
      case 'Son':
        return { bg: (themeColors.isDark ? themeColors.surface : '#FFF4E6'), text: '#FF9F1C' };
      default:
        return { bg: (themeColors.isDark ? themeColors.surface : '#E6F0FF'), text: '#3B82F6' };
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
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t('ui_household_members')}</Text>
            <Text style={styles.headerSubtitle}>
              {family?.name ? family.name : t('ag_family_household')}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/admin/add-family-member' as any)}
            style={({ pressed }) => [
              styles.addMemberBtn,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addMemberBtnText}>{t('crud_add')}</Text>
          </Pressable>
        </View>

        {/* ── Add Family Member Primary Banner ── */}
        <Pressable
          onPress={() => router.push('/admin/add-family-member' as any)}
          style={({ pressed }) => [
            styles.addBannerCard,
            pressed && { opacity: 0.92 },
          ]}
        >
          <View style={styles.addBannerIconWrap}>
            <Ionicons name="person-add" size={22} color="#713DE8" />
          </View>
          <View style={styles.addBannerTextWrap}>
            <Text style={styles.addBannerTitle}>{t('ag_add_member_button')}</Text>
            <Text style={styles.addBannerSub}>{t('ag_connect_short')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#713DE8" />
        </Pressable>

        {/* ── Stats Summary Bar ── */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{members.length}</Text>
            <Text style={styles.statLabel}>{t('ag_family_members')}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#713DE8' }]}>
              {members.filter((m) => m.role === 'admin').length}
            </Text>
            <Text style={styles.statLabel}>{t('ag_admins')}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {members.filter((m) => m.is_active !== false).length}
            </Text>
            <Text style={styles.statLabel}>{t('ag_active')}</Text>
          </View>
        </View>

        {/* ── Family List Section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('ag_members_list')}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{members.length}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyTitle}>{t('ag_no_family')}</Text>
            <Text style={styles.emptySubtitle}>{t('ag_add_family_help')}</Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((m) => {
              const isAdmin = m.role === 'admin';
              const relStyle = getRelationshipColor(m.relationship);
              const isActive = m.is_active !== false;

              return (
                <View key={m.id} style={styles.memberCard}>
                  <Avatar name={m.name || t('role_member')} uri={m.avatar || undefined} size={50} />

                  <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      {isAdmin ? (
                        <View style={styles.adminRoleBadge}>
                          <Text style={styles.adminRoleText}>{t('ag_admin_badge')}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.memberEmail}>{m.email}</Text>

                    <View style={styles.badgesRow}>
                      {/* Relationship Badge */}
                      <View style={[styles.relBadge, { backgroundColor: relStyle.bg }]}>
                        <Ionicons name="heart" size={11} color={relStyle.text} />
                        <Text style={[styles.relBadgeText, { color: relStyle.text }]}>
                          {m.relationship || t('role_member')}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          isActive ? styles.activeStatusBg : styles.inactiveStatusBg,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isActive ? '#10B981' : '#EF4444' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: isActive ? '#065F46' : '#991B1B' },
                          ]}
                        >
                          {isActive ? t('ag_active') : t('ag_inactive')}
                        </Text>
                      </View>
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
    paddingTop: 12,
    paddingBottom: 36,
    gap: 18,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    marginTop: 2,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#713DE8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addMemberBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Primary Add Banner Card
  addBannerCard: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F5F3FF'),
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#713DE8',
  },
  addBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  addBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#713DE8',
  },
  addBannerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },

  // Stats Card
  statsCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EAE7F5'),
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  countBadge: {
    backgroundColor: '#713DE8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Members List
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
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
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    flex: 1,
    marginRight: 8,
  },
  adminRoleBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminRoleText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#713DE8',
  },
  memberEmail: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  relBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  relBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeStatusBg: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#D1FAE5'),
  },
  inactiveStatusBg: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEE2E2'),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 36,
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
