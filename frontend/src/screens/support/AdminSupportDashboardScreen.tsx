import { useAppAlert } from '@/components/ui/AppDialog';
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
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
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
        <Ionicons name="chevron-forward" size={20} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
      )}
    </Pressable>
  );
}

export default function AdminSupportDashboardScreen() {
  const alert = useAppAlert();
  const { t } = useLanguage();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
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
          accessibilityLabel={t('admin_back')}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('ag_support_center')}</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#6C3BEA" />
            <Text style={styles.adminBadgeText}>{t('ag_admin_role')}</Text>
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
              <Text style={styles.overviewGreeting}>{t('ag_operations')}</Text>
              <Text style={styles.overviewSub}>{t('ag_support_description')}</Text>
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
              <Text style={styles.metricLabel}>{t('ag_open_tickets')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#6C3BEA' }]}>
                {inProgressTickets.length}
              </Text>
              <Text style={styles.metricLabel}>{t('ui_in_progress')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#10B981' }]}>
                {resolvedTickets.length}
              </Text>
              <Text style={styles.metricLabel}>{t('ui_resolved')}</Text>
            </View>
          </View>
        </View>

        {/* Support Management Options */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>{t('ag_ticket_management')}</Text>

          <AdminMenuCard
            icon="file-tray-full-outline"
            title={t('ag_manage_tickets')}
            subtitle={t('ag_triage')}
            count={openTickets.length > 0 ? `${openTickets.length} Pending` : t('ag_all_clear')}
            countColor={openTickets.length > 0 ? '#D97706' : '#10B981'}
            onPress={() => router.push('/support/admin-tickets' as any)}
          />

          <AdminMenuCard
            icon="alert-circle-outline"
            title={t('ag_customer_issues')}
            subtitle={t('ag_bug_reports')}
            count={tickets.length}
            onPress={() => router.push('/support/admin-tickets' as any)}
          />

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('ag_configuration')}</Text>

          <AdminMenuCard
            icon="help-circle-outline"
            title={t('ag_manage_faq')}
            subtitle={t('ag_faq_description')}
            onPress={() => router.push('/support/faqs' as any)}
          />

          <AdminMenuCard
            icon="library-outline"
            title={t('ag_help_management')}
            subtitle={t('ag_help_description')}
            onPress={() => router.push('/support/help-center' as any)}
          />

          <AdminMenuCard
            icon="call-outline"
            title={t('ag_support_channels')}
            subtitle={t('ag_channels_description')}
            onPress={() => router.push('/support/contact-support' as any)}
          />

          <AdminMenuCard
            icon="bar-chart-outline"
            title={t('ag_support_reports')}
            subtitle={t('ag_metrics_description')}
            onPress={() => {
              alert(
                t('ag_analytics'),
                {key: 'ag_metrics', values: {total: tickets.length, rate: tickets.length > 0 ? Math.round((resolvedTickets.length / tickets.length) * 100) : 100, hours: 1.4}},
                [{ text: t('close') }]
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

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F0EEF8'),
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3EEFF'),
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
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
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
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
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  overviewSub: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    marginTop: 2,
  },
  overviewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F3EEFF'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: (themeColors.isDark ? themeColors.card : '#F7F6FC'),
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
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#E5E1F2'),
  },
  menuContainer: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textSecondary : '#718091'),
    letterSpacing: 0.8,
    marginBottom: 4,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
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
