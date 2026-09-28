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
import { choreService, ChoreItem } from '@/services/choreService';
import { ChoreItemCard } from '@/components/chores/ChoreItemCard';
import { AddChoreModal } from '@/components/chores/AddChoreModal';
import { EditChoreModal } from '@/components/chores/EditChoreModal';

export default function AdminChoresScreen() {
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
          c.id === id ? { ...c, status: c.status === 'completed' ? 'pending' : 'completed' } : c
        )
      );
      await choreService.toggleChoreComplete(id);
      loadData();
    } catch {
      Alert.alert('Error', 'Could not update chore status.');
      loadData();
    }
  };

  const handleDeleteChore = (id: string) => {
    Alert.alert('Delete Chore', 'Are you sure you want to delete this chore?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setChores((prev) => prev.filter((c) => c.id !== id));
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
    setSelectedEditChore(chore);
  };

  const filteredChores = chores.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.assignee_name && item.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'all' || item.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Household Chores</Text>
          <Text style={styles.headerSubtitle}>
            Manage, filter, and track all assigned household tasks
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search chores or housemates..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Status Filters */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.pillRow}>
            {(['all', 'pending', 'completed'] as const).map((sf) => (
              <Pressable
                key={sf}
                onPress={() => setStatusFilter(sf)}
                style={[
                  styles.filterPill,
                  statusFilter === sf && styles.activeStatusPill,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    statusFilter === sf && styles.activePillText,
                  ]}
                >
                  {sf.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Priority Filters */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Priority</Text>
          <View style={styles.pillRow}>
            {(['all', 'high', 'medium', 'low'] as const).map((pf) => (
              <Pressable
                key={pf}
                onPress={() => setPriorityFilter(pf)}
                style={[
                  styles.filterPill,
                  priorityFilter === pf && styles.activePriorityPill,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    priorityFilter === pf && styles.activePillText,
                  ]}
                >
                  {pf.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Chores Count & Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chores List</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredChores.length}</Text>
          </View>
        </View>

        {/* Chores List */}
        {filteredChores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No chores found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filters, or add a new chore below.
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
            styles.addBtn,
            pressed && { opacity: 0.9, backgroundColor: '#5C2ECE' },
          ]}
        >
          <Text style={styles.addBtnIcon}>+</Text>
          <Text style={styles.addBtnText}>Add New Chore</Text>
        </Pressable>
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
    gap: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1B2E',
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: '#757288',
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B485C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  activeStatusPill: {
    backgroundColor: '#713DE8',
    borderColor: '#713DE8',
  },
  activePriorityPill: {
    backgroundColor: '#713DE8',
    borderColor: '#713DE8',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#757288',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  countBadge: {
    backgroundColor: '#713DE8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    lineHeight: 18,
  },
  choresList: {
    gap: 12,
  },
  addBtn: {
    backgroundColor: '#713DE8',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  addBtnIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
