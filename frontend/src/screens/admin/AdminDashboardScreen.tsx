import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Avatar } from '@/components/profile/Avatar';
import { authService, Member } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { choreService, ChoreItem, ChoreStats } from '@/services/choreService';
import { ChoreItemCard } from '@/components/chores/ChoreItemCard';
import { AddChoreModal } from '@/components/chores/AddChoreModal';
import { EditChoreModal } from '@/components/chores/EditChoreModal';

export default function AdminDashboardScreen() {
  const [profile, setProfile] = useState<Member | null>(null);
  const [stats, setStats] = useState<ChoreStats>({
    completed: 0,
    pending: 0,
    overdue: 0,
    total: 0,
    completionPercentage: 0,
  });
  const [allChores, setAllChores] = useState<ChoreItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEditChore, setSelectedEditChore] = useState<ChoreItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch current member & verify admin role
      const currentMember = await authService.getCurrentMember();
      if (currentMember) setProfile(currentMember);

      try {
        const freshProfile = await profileService.getProfile();
        setProfile(freshProfile);
      } catch {
        // Fallback to cached profile if profile API is temporarily unreachable
      }

      // 2. Fetch household-wide stats & all chores via admin endpoint
      const adminData = await choreService.getAdminStats();
      if (adminData?.stats) {
        setStats(adminData.stats);
      }
      if (adminData?.chores) {
        setAllChores(adminData.chores);
      }
    } catch (err) {
      // Handle network errors gracefully
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

  const handleToggleComplete = async (id: string) => {
    try {
      // Optimistic update
      setAllChores((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: c.status === 'completed' ? 'pending' : 'completed' }
            : c
        )
      );

      await choreService.toggleChoreComplete(id);
      loadData();
    } catch {
      Alert.alert('Error', 'Could not update chore status. Please try again.');
      loadData();
    }
  };

  const handleDeleteChore = (id: string) => {
    Alert.alert('Delete Chore', 'Are you sure you want to delete this chore from the household?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setAllChores((prev) => prev.filter((c) => c.id !== id));
            await choreService.deleteChore(id);
            loadData();
          } catch {
            Alert.alert('Error', 'Could not delete chore.');
            loadData();
          }
        },
      },
    ]);
  };

  const handleEditChore = (chore: ChoreItem) => {
    router.push({
      pathname: '/admin/edit-chore',
      params: { id: chore.id, choreData: JSON.stringify(chore) },
    } as any);
  };

  const handleProfilePress = () => {
    router.push('/admin/profile');
  };

  const greetingName = profile?.name ? profile.name.split(' ')[0] : 'Admin';

  const filteredChores = allChores.filter((chore) => {
    if (activeFilter === 'pending') return chore.status === 'pending';
    if (activeFilter === 'completed') return chore.status === 'completed';
    return true;
  });

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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeTag}>Welcome to ChoreHub</Text>
            <View style={styles.adminBadgeRow}>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>⚡ Admin Dashboard</Text>
              </View>
            </View>
            <Text style={styles.greetingText}>Hello, {greetingName} 👋</Text>
          </View>
          <Pressable
            onPress={handleProfilePress}
            style={({ pressed }) => [
              styles.avatarButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Open profile"
          >
            <Avatar name={profile?.name || 'Admin'} uri={profile?.avatarUri} size={48} />
          </Pressable>
        </View>

        {/* Household Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressCardTitle}>Household Progress</Text>
              <Text style={styles.progressCardSubtitle}>
                Managing household chores & team productivity
              </Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>
                {Math.round(stats.completionPercentage)}%
              </Text>
            </View>
          </View>

          {/* Visual Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, stats.completionPercentage))}%` },
              ]}
            />
          </View>

          {/* Household Statistics Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.pendingBadge]}>
                <Text style={styles.statIconText}>⏳</Text>
              </View>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.completedBadge]}>
                <Text style={styles.statIconText}>✓</Text>
              </View>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.overdueBadge]}>
                <Text style={styles.statIconText}>!</Text>
              </View>
              <Text style={styles.statNumber}>{stats.overdue}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, styles.totalBadge]}>
                <Text style={styles.statIconText}>📊</Text>
              </View>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Chores Section */}
        <View style={styles.choresSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Household Chores</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredChores.length}</Text>
              </View>
            </View>

            {/* View All Chores Button / Filter Options */}
            <Pressable
              onPress={() => setActiveFilter('all')}
              style={({ pressed }) => [
                styles.viewAllButton,
                activeFilter === 'all' && styles.viewAllActiveButton,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.viewAllButtonText,
                  activeFilter === 'all' && styles.viewAllActiveButtonText,
                ]}
              >
                View All Chores
              </Text>
            </Pressable>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabsRow}>
            <Pressable
              onPress={() => setActiveFilter('all')}
              style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'all' && styles.filterTabTextActive,
                ]}
              >
                All ({allChores.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('pending')}
              style={[styles.filterTab, activeFilter === 'pending' && styles.filterTabActive]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'pending' && styles.filterTabTextActive,
                ]}
              >
                Pending ({stats.pending})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('completed')}
              style={[styles.filterTab, activeFilter === 'completed' && styles.filterTabActive]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'completed' && styles.filterTabTextActive,
                ]}
              >
                Completed ({stats.completed})
              </Text>
            </Pressable>
          </View>

          {/* Chores List */}
          {filteredChores.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>✨</Text>
              </View>
              <Text style={styles.emptyStateTitle}>No household chores found</Text>
              <Text style={styles.emptyStateSubtitle}>
                There are no chores matching the selected filter. Click below to add a new chore for your household.
              </Text>
            </View>
          ) : (
            <View style={styles.choresList}>
              {filteredChores.map((item) => (
                <ChoreItemCard
                  key={item.id}
                  chore={item}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteChore}
                  onEdit={handleEditChore}
                />
              ))}
            </View>
          )}

          {/* Add New Chore Button */}
          <Pressable
            onPress={() => router.push('/admin/add-chore' as any)}
            style={({ pressed }) => [
              styles.addChoreButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.addChoreButtonIcon}>+</Text>
            <Text style={styles.addChoreButtonText}>Add New Chore</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Add Chore Modal */}
      <AddChoreModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onChoreCreated={loadData}
      />

      {/* Edit Chore Modal */}
      <EditChoreModal
        visible={!!selectedEditChore}
        chore={selectedEditChore}
        onClose={() => setSelectedEditChore(null)}
        onChoreUpdated={loadData}
      />
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
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  buttonPressed: {
    opacity: 0.9,
    backgroundColor: '#5C2ECE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerTextContainer: {
    flex: 1,
    gap: 4,
  },
  welcomeTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#713DE8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  adminBadge: {
    backgroundColor: '#713DE8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E1B2E',
    marginTop: 2,
  },
  avatarButton: {
    borderRadius: 24,
    padding: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  progressCardSubtitle: {
    fontSize: 13,
    color: '#757288',
    marginTop: 2,
  },
  percentageBadge: {
    backgroundColor: '#F0EAFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#713DE8',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#F0EAFF',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#713DE8',
    borderRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F2FA',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pendingBadge: {
    backgroundColor: '#FFF8E6',
  },
  completedBadge: {
    backgroundColor: '#ECFDF5',
  },
  overdueBadge: {
    backgroundColor: '#FEF2F2',
  },
  totalBadge: {
    backgroundColor: '#F0EAFF',
  },
  statIconText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#757288',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#EAE7F5',
  },

  // Chores Section
  choresSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B2E',
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
    fontWeight: '700',
  },
  viewAllButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#713DE8',
  },
  viewAllActiveButton: {
    backgroundColor: '#713DE8',
  },
  viewAllButtonText: {
    color: '#713DE8',
    fontSize: 12,
    fontWeight: '700',
  },
  viewAllActiveButtonText: {
    color: '#FFFFFF',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  filterTabActive: {
    backgroundColor: '#F0EAFF',
    borderColor: '#713DE8',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#757288',
  },
  filterTabTextActive: {
    color: '#713DE8',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 10,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIcon: {
    fontSize: 26,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#757288',
    textAlign: 'center',
    lineHeight: 19,
  },
  choresList: {
    gap: 12,
  },
  addChoreButton: {
    backgroundColor: '#713DE8',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  addChoreButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  addChoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
