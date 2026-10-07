import { useAppAlert } from '@/components/ui/AppDialog';
import { useLanguage } from '@/context/LanguageContext';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,

  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SupportBottomNav } from '@/components/support/SupportBottomNav';
import { supportTicketService, SupportTicket } from '@/services/supportTicketService';

type FilterType = 'all' | 'open' | 'in_progress' | 'resolved';

export default function AdminTicketsScreen() {
  const alert = useAppAlert();
  const { t, language } = useLanguage();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Modal / status update state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const data = await supportTicketService.getTickets();
      setTickets(data);
    } catch {
      // Soft fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );

  const filteredTickets =
    filter === 'all'
      ? tickets
      : tickets.filter((t) => t.status === filter);

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.adminNotes || '');
  };

  const handleUpdateStatus = async (status: SupportTicket['status']) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await supportTicketService.updateTicketStatus(
        selectedTicket.id,
        status,
        adminNotes.trim() || undefined
      );
      alert(t('ag_status_updated'), {key: 'ag_ticket_updated', values: {number: selectedTicket.ticketNumber, status: {translationKey: 'ui_' + status}}});
      setSelectedTicket(null);
      loadTickets();
    } catch {
      alert(t('error'), t('ag_ticket_update_failed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket) return;
    const reply = adminNotes.trim();
    if (!reply) {
      alert(t('ag_reply_required'), t('ag_enter_reply'));
      return;
    }

    setUpdating(true);
    try {
      const updatedTicket = await supportTicketService.updateTicketStatus(
        selectedTicket.id,
        selectedTicket.status,
        reply
      );
      if (!updatedTicket) throw new Error('Ticket not found');

      setTickets((current) =>
        current.map((ticket) => ticket.id === updatedTicket.id ? updatedTicket : ticket)
      );
      setSelectedTicket(null);
      await loadTickets();
    } catch {
      alert(t('error'), t('ag_reply_failed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTicket = async (ticket: SupportTicket) => {
    alert(t('ui_delete_ticket'), {key: 'ag_ticket_delete_confirm', values: {number: ticket.ticketNumber, name: ticket.userName}}, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            await supportTicketService.deleteTicket(ticket.id);
            alert(t('ui_ticket_deleted'), {key: 'ag_ticket_removed', values: {number: ticket.ticketNumber}});
            setSelectedTicket(null);
            loadTickets();
          } catch {
            alert(t('error'), t('ag_ticket_delete_failed'));
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const renderBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return (
          <View style={[styles.badge, styles.badgeOpen]}>
            <Text style={[styles.badgeText, styles.badgeTextOpen]}>{t('ui_open')}</Text>
          </View>
        );
      case 'in_progress':
        return (
          <View style={[styles.badge, styles.badgeInProgress]}>
            <Text style={[styles.badgeText, styles.badgeTextInProgress]}>{t('ui_in_progress')}</Text>
          </View>
        );
      case 'resolved':
        return (
          <View style={[styles.badge, styles.badgeResolved]}>
            <Text style={[styles.badgeText, styles.badgeTextResolved]}>{t('ui_resolved')}</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/support' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('admin_back')}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('ag_manage_tickets')}</Text>
        <View style={styles.placeholderBtn} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(
            [
              { id: 'all', label: `${t('filter_all')} (${tickets.length})` },
              { id: 'open', label: `${t('ui_open')} (${tickets.filter((t) => t.status === 'open').length})` },
              { id: 'in_progress', label: `${t('ui_in_progress')} (${tickets.filter((t) => t.status === 'in_progress').length})` },
              { id: 'resolved', label: `${t('ui_resolved')} (${tickets.filter((t) => t.status === 'resolved').length})` },
            ] as const
          ).map((item) => {
            const isSelected = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.filterPill, isSelected ? styles.filterPillActive : styles.filterPillInactive]}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color="#6C3BEA" />
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
            <Text style={styles.emptyTitle}>{t('ag_no_tickets')}</Text>
            <Text style={styles.emptySub}>{t('ag_tickets_clear')}</Text>
          </View>
        ) : (
          <View style={styles.ticketList}>
            {filteredTickets.map((ticket) => (
              <Pressable
                key={ticket.id}
                onPress={() => handleOpenTicket(ticket)}
                style={({ pressed }) => [styles.ticketCard, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.ticketCardHeader}>
                  <View style={styles.ticketIdRow}>
                    <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{ticket.category}</Text>
                    </View>
                  </View>
                  {renderBadge(ticket.status)}
                </View>

                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <Text style={styles.ticketDesc} numberOfLines={2}>
                  {ticket.description}
                </Text>

                <View style={styles.ticketUserInfo}>
                  <Ionicons name="person-outline" size={13} color={themeColors.isDark ? themeColors.textSecondary : "#656276"} />
                  <Text style={styles.ticketUserText}>
                    {ticket.userName} ({ticket.userEmail})
                  </Text>
                </View>

                {ticket.adminNotes && (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyText}>
                      <Text style={{ fontWeight: '700' }}>{t('ag_admin_note')}</Text>
                      {ticket.adminNotes}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    {new Date(ticket.createdAt).toLocaleDateString(language)}
                  </Text>
                  <Text style={styles.actionPrompt}>{t('ag_tap_manage')}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Ticket Action Modal */}
      {selectedTicket && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTicketNum}>{selectedTicket.ticketNumber}</Text>
                  <Text style={styles.modalSubject}>{selectedTicket.subject}</Text>
                </View>
                <Pressable onPress={() => setSelectedTicket(null)}>
                  <Ionicons name="close-circle" size={26} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 220, marginVertical: 10 }}>
                <Text style={styles.modalLabel}>{t('ag_customer_issue')}</Text>
                <Text style={styles.modalDesc}>{selectedTicket.description}</Text>

                <Text style={[styles.modalLabel, { marginTop: 12 }]}>{t('ag_from')}</Text>
                <Text style={styles.modalDesc}>
                  {selectedTicket.userName} &lt;{selectedTicket.userEmail}&gt;
                </Text>

                <Text style={[styles.modalLabel, { marginTop: 12 }]}>{t('ag_reply_request')}</Text>
                <TextInput
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  placeholder={t('ag_write_reply')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9EA5B1"}
                  multiline
                  style={styles.modalInput}
                />
              </ScrollView>

              <Pressable
                onPress={handleSendReply}
                disabled={updating}
                style={[styles.replyButton, updating && { opacity: 0.65 }]}
              >
                <Text style={styles.replyButtonText}>{updating ? t('ag_sending') : t('ag_send_reply')}</Text>
              </Pressable>

              <Text style={styles.modalLabel}>{t('ag_update_status')}</Text>
              <View style={styles.modalBtnRow}>
                <Pressable
                  onPress={() => handleUpdateStatus('in_progress')}
                  disabled={updating}
                  style={[styles.statusBtn, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE') }]}
                >
                  <Text style={[styles.statusBtnText, { color: '#6C3BEA' }]}>{t('ui_in_progress')}</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleUpdateStatus('resolved')}
                  disabled={updating}
                  style={[styles.statusBtn, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#D1FAE5') }]}
                >
                  <Text style={[styles.statusBtnText, { color: '#059669' }]}>{t('ag_resolve')}</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleUpdateStatus('open')}
                  disabled={updating}
                  style={[styles.statusBtn, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF3C7') }]}
                >
                  <Text style={[styles.statusBtnText, { color: '#D97706' }]}>{t('ag_reopen')}</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteTicket(selectedTicket)}
                  disabled={updating}
                  style={[styles.statusBtn, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEE2E2') }]}
                >
                  <Text style={[styles.statusBtnText, { color: '#B91C1C' }]}>{t('delete')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Admin Bottom Nav */}
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
  placeholderBtn: {
    width: 36,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  filterBar: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterPillActive: {
    backgroundColor: '#6C3BEA',
  },
  filterPillInactive: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  centerLoader: {
    paddingTop: 50,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  emptySub: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    shadowColor: '#6C3BEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#6C3BEA',
  },
  categoryPill: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeOpen: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF3C7'),
  },
  badgeTextOpen: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeInProgress: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
  },
  badgeTextInProgress: {
    color: '#6C3BEA',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeResolved: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#D1FAE5'),
  },
  badgeTextResolved: {
    color: (themeColors.isDark ? themeColors.success : '#059669'),
    fontSize: 10,
    fontWeight: '800',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  ticketDesc: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 16,
  },
  ticketUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  ticketUserText: {
    fontSize: 11,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  replyBox: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F6F3FE'),
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  replyText: {
    fontSize: 11,
    color: '#4B368C',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
    paddingTop: 8,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  actionPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C3BEA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F0EEF8'),
    paddingBottom: 12,
  },
  modalTicketNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6C3BEA',
  },
  modalSubject: {
    fontSize: 16,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginTop: 2,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#4B485A'),
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#F7F6FC'),
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    minHeight: 65,
    marginTop: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  replyButton: {
    minHeight: 44,
    marginBottom: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C3BEA',
  },
  replyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
