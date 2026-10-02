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
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const user = await authService.getCurrentMember();
      if (user) setCurrentMember(user);

      const res = await familyService.getMyFamily();
      if (res?.family) setFamily(res.family);
      if (res?.members) setMembers(res.members);
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

  const getRelationshipBadge = (relationship?: string) => {
    switch ((relationship || '').toLowerCase()) {
      case 'mother':
        return { bg: '#FCE7F3', text: '#EC4899' };
      case 'father':
        return { bg: '#E0F2FE', text: '#0284C7' };
      case 'daughter':
        return { bg: '#F3E8FF', text: '#9333EA' };
      case 'son':
        return { bg: '#DCFCE7', text: '#16A34A' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563' };
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
            <Ionicons name="arrow-back" size={24} color="#1E1B2E" />
          </Pressable>
          <Text style={styles.headerTitle}>Household Family</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Family Banner */}
        <View style={styles.familyBanner}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="people" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.bannerTextGroup}>
            <Text style={styles.familyNameText}>
              {family?.name ? `${family.name}` : 'My Household'}
            </Text>
            <Text style={styles.familySubtitleText}>
              {members.length} {members.length === 1 ? 'member' : 'members'} in your household
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Household Members</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No Family Members Found</Text>
            <Text style={styles.emptySubtitle}>
              You are currently the only member in this household.
            </Text>
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
                          <Text style={styles.youBadgeText}>You</Text>
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
                          {item.relationship || 'Other'}
                        </Text>
                      </View>

                      {item.role === 'admin' && (
                        <View style={styles.adminTag}>
                          <Ionicons name="shield-checkmark" size={12} color="#713DE8" />
                          <Text style={styles.adminTagText}>Admin</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E1B2E',
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
    color: '#FFFFFF',
  },
  familySubtitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E0E7FF',
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
    marginTop: 4,
  },

  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
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
    color: '#1E1B2E',
  },
  youBadge: {
    backgroundColor: '#EDE9FE',
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
    color: '#8A879A',
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
    backgroundColor: '#EDE9FE',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A879A',
    textAlign: 'center',
  },
});
