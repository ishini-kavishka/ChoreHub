import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { useLanguage } from '@/context/LanguageContext';
import { choreService, ChoreItem } from '@/services/choreService';
import { MemberChoreCard } from '@/components/chores/MemberChoreCard';

type StatusFilter = 'all' | 'pending' | 'completed';

export default function MemberChoresScreen() {
  const { t } = useLanguage();
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const loadData = useCallback(async () => {
    try {
      const res = await choreService.getMemberChores();
      if (res?.chores) {
        setChores(res.chores);
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

  const handleToggleComplete = async (id: string) => {
    try {
      setChores((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: c.status === 'completed' ? 'pending' : 'completed' }
            : c
        )
      );
      await choreService.toggleChoreComplete(id);
      loadData();
    } catch {
      loadData();
    }
  };

  const handleViewDetails = (chore: ChoreItem) => {
    router.push({
      pathname: '/home/chore-details',
      params: { id: chore.id, choreData: JSON.stringify(chore) },
    } as any);
  };

  const filteredChores = chores.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' || c.status === statusFilter;
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('my_chores_title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('my_chores_sub')}
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_my_chores')}
            placeholderTextColor="#9592A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'completed'] as StatusFilter[]).map((f) => {
            const active = statusFilter === f;
            const label = f === 'all' ? t('filter_all') : f === 'pending' ? t('filter_pending') : t('filter_completed');
            return (
              <Pressable
                key={f}
                onPress={() => setStatusFilter(f)}
                style={[styles.filterPill, active && styles.activePill]}
              >
                <Text style={[styles.filterText, active && styles.activeFilterText]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Chores List */}
        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
        ) : filteredChores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>{t('no_chores_found')}</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter !== 'all'
                ? t('try_changing_filter')
                : t('no_chores_assigned')}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredChores.map((item) => (
              <MemberChoreCard
                key={item.id}
                chore={item}
                onToggleComplete={handleToggleComplete}
                onViewDetails={handleViewDetails}
              />
            ))}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1B2E',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  activePill: {
    backgroundColor: '#713DE8',
    borderColor: '#713DE8',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#656276',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  list: {
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
