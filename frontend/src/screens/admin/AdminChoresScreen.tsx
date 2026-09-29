import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { choreService, ChoreItem } from '@/services/choreService';
import { AdminChoreCard } from '@/components/chores/AdminChoreCard';
import { EditChoreModal } from '@/components/chores/EditChoreModal';

export default function AdminChoresScreen() {
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEditChore, setSelectedEditChore] = useState<ChoreItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await choreService.getAdminStats();
      if (data?.chores) {
        setChores(data.chores);
      }
    } catch (err) {
      // Soft fail fallback
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
      setChores((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: c.status === 'completed' ? 'pending' : 'completed',
              }
            : c
        )
      );
      await choreService.toggleChoreComplete(id);
      loadData();
    } catch {
      Alert.alert('Error', 'Could not update chore status.');
      loadData();
    }
  };

  const handleEditChore = (chore: ChoreItem) => {
    setSelectedEditChore(chore);
  };

  // Stats for pill counts
  const allCount = chores.length;
  const pendingCount = chores.filter((c) => c.status === 'pending').length;
  const completedCount = chores.filter((c) => c.status === 'completed').length;
  const overdueCount = chores.filter((c) => c.status === 'overdue').length;

  const filteredChores = chores.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.assignee_name && item.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
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
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.brandTitle}>
              Chore<Text style={styles.brandAccent}>Hub</Text>
            </Text>
            <Text style={styles.headerSubtitle}>Manage all household chores</Text>
          </View>

          {/* Add Chore Button */}
          <Pressable
            onPress={() => router.push('/admin/add-chore' as any)}
            style={({ pressed }) => [
              styles.addChoreBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.addChoreBtnIcon}>+</Text>
            <Text style={styles.addChoreBtnText}>Add Chore</Text>
          </Pressable>
        </View>

        {/* Filter Tabs Bar (Pills) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContainer}
        >
          {[
            { id: 'all', label: `All (${allCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
            { id: 'overdue', label: `Overdue (${overdueCount})` },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setStatusFilter(tab.id as any)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Search & Filter Funnel Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#8A879A" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chores..."
              placeholderTextColor="#8A879A"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#8A879A" />
              </Pressable>
            ) : null}
          </View>

          {/* Filter Funnel Icon Button */}
          <Pressable
            onPress={() => {
              // Toggle filter options or clear search
              if (searchQuery || statusFilter !== 'all') {
                setSearchQuery('');
                setStatusFilter('all');
              }
            }}
            style={({ pressed }) => [
              styles.filterFunnelBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="options-outline" size={20} color="#757288" />
          </Pressable>
        </View>

        {/* Chores List */}
        {filteredChores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>No chores found</Text>
            <Text style={styles.emptySubtitle}>
              There are no chores matching the current filter or search criteria.
            </Text>
          </View>
        ) : (
          <View style={styles.choresList}>
            {filteredChores.map((item) => (
              <AdminChoreCard
                key={item.id}
                chore={item}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditChore}
              />
            ))}
          </View>
        )}
      </ScrollView>

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
    backgroundColor: '#FAFAFD',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerTitleGroup: {
    gap: 2,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E1B2E',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#713DE8',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A879A',
  },
  addChoreBtn: {
    backgroundColor: '#713DE8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  addChoreBtnIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
  },
  addChoreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#713DE8',
  },
  filterPillInactive: {
    backgroundColor: '#F4F3FA',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#757288',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1B2E',
  },
  filterFunnelBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choresList: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 8,
    marginTop: 8,
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
    lineHeight: 18,
  },
});
