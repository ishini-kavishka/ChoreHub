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
import { choreService, ChoreItem } from '@/services/choreService';
import { MemberChoreCard } from '@/components/chores/MemberChoreCard';

export default function MemberCalendarScreen() {
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Group chores by due date
  const groupedChores = chores.reduce((acc, chore) => {
    const key = chore.due_date
      ? new Date(chore.due_date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      : 'No Due Date';
    if (!acc[key]) acc[key] = [];
    acc[key].push(chore);
    return acc;
  }, {} as Record<string, ChoreItem[]>);

  const dateKeys = Object.keys(groupedChores);

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
          <Text style={styles.headerTitle}>Chore Schedule</Text>
          <Text style={styles.headerSubtitle}>
            Your assigned chores ordered by due date
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#713DE8" style={{ marginTop: 24 }} />
        ) : dateKeys.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Schedule is empty</Text>
            <Text style={styles.emptySubtitle}>
              You have no scheduled chores at this time.
            </Text>
          </View>
        ) : (
          <View style={styles.scheduleList}>
            {dateKeys.map((dateLabel) => (
              <View key={dateLabel} style={styles.groupSection}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateBadgeIcon}>📅</Text>
                  <Text style={styles.dateLabel}>{dateLabel}</Text>
                </View>
                <View style={styles.groupCards}>
                  {groupedChores[dateLabel].map((item) => (
                    <MemberChoreCard
                      key={item.id}
                      chore={item}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}
                </View>
              </View>
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
  scheduleList: {
    gap: 20,
  },
  groupSection: {
    gap: 10,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBadgeIcon: {
    fontSize: 14,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#713DE8',
  },
  groupCards: {
    gap: 10,
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
