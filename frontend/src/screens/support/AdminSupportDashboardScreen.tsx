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
import { Ionicons } from '@expo/vector-icons';
import { SupportBottomNav } from '@/components/support/SupportBottomNav';
import { supportTicketService, SupportTicket } from '@/services/supportTicketService';

interface AdminMenuCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  count?: number | string;
  countColor?: string;
  onPress: () => void;
}

function AdminMenuCard({
  icon,
  title,
  subtitle,
  count,
  countColor = '#6C3BEA',
  onPress,
}: AdminMenuCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuCard, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={styles.cardIconWrap}>
        <Ionicons name={icon} size={22} color="#6C3BEA" />
      </View>
      <View style={styles.cardTextWrap}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      {count !== undefined ? (
        <View style={[styles.countBadge, { backgroundColor: countColor + '18' }]}>
          <Text style={[styles.countText, { color: countColor }]}>{count}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#8A879A" />
      )}
    </Pressable>
  );
}

export default function AdminSupportDashboardScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await supportTicketService.getTickets();
      setTickets(data);
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

  const openTickets = tickets.filter((t) => t.status === 'open');
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Support Center</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#6C3BEA" />
            <Text style={styles.adminBadgeText}>ADMIN ROLE</Text>
          </View>
        </View>
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="reload-outline" size={20} color="#6C3BEA" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C3BEA"
            colors={['#6C3BEA']}
          />
        }
      >
        {/* Admin Overview Banner */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewGreeting}>Operations & Support</Text>
              <Text style={styles.overviewSub}>Manage customer inquiries & system health</Text>
            </View>
            <View style={styles.overviewIconCircle}>
              <Ionicons name="server-outline" size={24} color="#6C3BEA" />
            </View>
          </View>

          {/* Quick Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#D97706' }]}>
                {openTickets.length}
              </Text>
              <Text style={styles.metricLabel}>Open Tickets</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#6C3BEA' }]}>
                {inProgressTickets.length}
              </Text>
              <Text style={styles.metricLabel}>In Progress</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#10B981' }]}>
                {resolvedTickets.length}
              </Text>
              <Text style={styles.metricLabel}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Support Management Options */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>TICKET & INQUIRY MANAGEMENT</Text>

          <AdminMenuCard
            icon="file-tray-full-outline"
            title="Manage Support Tickets"
            subtitle="View, triage and respond to inquiries"
            count={openTickets.length > 0 ? `${openTickets.length} Pending` : 'All Clear'}
            countColor={openTickets.length > 0 ? '#D97706' : '#10B981'}
            onPress={() => router.push('/support/admin-tickets' as any)}
          />

          <AdminMenuCard
            icon="alert-circle-outline"
            title="View Customer Issues"
            subtitle="Bug reports and task dispute requests"
            count={tickets.length}
            onPress={() => router.push('/support/admin-tickets' as any)}
          />

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>CONTENT & CONFIGURATION</Text>

          <AdminMenuCard
            icon="help-circle-outline"
            title="Manage FAQs"
            subtitle="Review customer FAQ questions & categories"
            onPress={() => router.push('/support/faqs' as any)}
          />

          <AdminMenuCard
            icon="library-outline"
            title="Help Center Management"
            subtitle="Inspect guide articles and popular topics"
            onPress={() => router.push('/support/help-center' as any)}
          />

          <AdminMenuCard
            icon="call-outline"
            title="Contact & Support Channels"
            subtitle="Configure support email and hotline settings"
            onPress={() => router.push('/support/contact-support' as any)}
          />

          <AdminMenuCard
            icon="bar-chart-outline"
            title="Support Reports & Analytics"
            subtitle="Resolution metrics & customer satisfaction"
            onPress={() => {
              Alert.alert(
                'Support Analytics',
                `Total Inquiries: ${tickets.length}\nResolution Rate: ${
                  tickets.length > 0
                    ? Math.round((resolvedTickets.length / tickets.length) * 100)
                    : 100
                }%\nAvg Response Time: 1.4 hours`,
                [{ text: 'Close' }]
              );
            }}
          />
        </View>
      </ScrollView>

      {/* Admin Bottom Navigation */}
      <SupportBottomNav activeTab="profile" role="admin" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EEFF',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6C3BEA',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewGreeting: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  overviewSub: {
    fontSize: 12,
    color: '#656276',
    marginTop: 2,
  },
  overviewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F7F6FC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#656276',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E1F2',
  },
  menuContainer: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#718091',
    letterSpacing: 0.8,
    marginBottom: 4,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F4F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8A879A',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
