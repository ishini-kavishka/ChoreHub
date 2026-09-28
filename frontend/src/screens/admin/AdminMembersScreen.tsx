import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { choreService, AdminUser } from '@/services/choreService';
import { Avatar } from '@/components/profile/Avatar';

export default function AdminMembersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await choreService.getAdminAllUsers();
      if (data?.users) {
        setUsers(data.users);
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

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const memberCount = users.filter((u) => u.role === 'member').length;

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Members</Text>
          <Text style={styles.headerSubtitle}>
            Every registered user in the ChoreHub system
          </Text>
        </View>

        {/* Stats Banner */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#713DE8' }]}>{adminCount}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#2563EB' }]}>{memberCount}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members List</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{users.length}</Text>
          </View>
        </View>

        {/* Members List */}
        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
        ) : users.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              No registered users in the system yet.
            </Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {users.map((u) => {
              const isAdmin = u.role === 'admin';
              return (
                <View key={u.id} style={styles.memberCard}>
                  <Avatar name={u.name || 'User'} uri={u.avatar || undefined} size={46} />
                  <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.memberName}>{u.name}</Text>
                      <View
                        style={[
                          styles.roleBadge,
                          isAdmin ? styles.adminBadge : styles.memberBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleText,
                            isAdmin ? styles.adminText : styles.memberText,
                          ]}
                        >
                          {isAdmin ? 'ADMIN' : 'MEMBER'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.memberEmail}>{u.email}</Text>
                    {u.family_name ? (
                      <Text style={styles.familyTag}>🏠 {u.family_name}</Text>
                    ) : null}
                    {u.phone ? (
                      <Text style={styles.memberPhone}>📞 {u.phone}</Text>
                    ) : null}
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
    backgroundColor: '#F8F7FC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#757288',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#757288',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#EAE7F5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  badge: {
    backgroundColor: '#713DE8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  memberInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadge: {
    backgroundColor: '#F0EAFF',
  },
  memberBadge: {
    backgroundColor: '#EFF6FF',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  adminText: {
    color: '#713DE8',
  },
  memberText: {
    color: '#2563EB',
  },
  memberEmail: {
    fontSize: 13,
    color: '#757288',
  },
  familyTag: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 12,
    color: '#656276',
    marginTop: 1,
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
    color: '#757288',
    textAlign: 'center',
  },
});
