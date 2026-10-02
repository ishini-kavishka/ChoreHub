import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
      Alert.alert('Status Updated', `Ticket #${selectedTicket.ticketNumber} marked as ${status.replace('_', ' ')}.`);
      setSelectedTicket(null);
      loadTickets();
    } catch {
      Alert.alert('Error', 'Could not update ticket.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket) return;
    const reply = adminNotes.trim();
    if (!reply) {
      Alert.alert('Reply Required', 'Enter a reply before sending it to the user.');
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
      setSelectedTicket(updatedTicket);
      Alert.alert('Reply Sent', `Your reply to ${selectedTicket.ticketNumber} has been saved.`);
    } catch {
      Alert.alert('Error', 'Could not send reply. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTicket = async (ticket: SupportTicket) => {
    Alert.alert('Delete ticket', `Remove ${ticket.ticketNumber} for ${ticket.userName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            await supportTicketService.deleteTicket(ticket.id);
            Alert.alert('Ticket Deleted', `${ticket.ticketNumber} has been removed.`);
            setSelectedTicket(null);
            loadTickets();
          } catch {
            Alert.alert('Error', 'Could not delete ticket.');
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
            <Text style={[styles.badgeText, styles.badgeTextOpen]}>Open</Text>
          </View>
        );
      case 'in_progress':
        return (
          <View style={[styles.badge, styles.badgeInProgress]}>
            <Text style={[styles.badgeText, styles.badgeTextInProgress]}>In Progress</Text>
          </View>
        );
      case 'resolved':
        return (
          <View style={[styles.badge, styles.badgeResolved]}>
            <Text style={[styles.badgeText, styles.badgeTextResolved]}>Resolved</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Support Tickets</Text>
        <View style={styles.placeholderBtn} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(
            [
              { id: 'all', label: `All (${tickets.length})` },
              { id: 'open', label: `Open (${tickets.filter((t) => t.status === 'open').length})` },
              { id: 'in_progress', label: `In Progress (${tickets.filter((t) => t.status === 'in_progress').length})` },
              { id: 'resolved', label: `Resolved (${tickets.filter((t) => t.status === 'resolved').length})` },
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
            <Text style={styles.emptyTitle}>No tickets in this view</Text>
            <Text style={styles.emptySub}>All customer requests for this filter are clear.</Text>
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
                  <Ionicons name="person-outline" size={13} color="#656276" />
                  <Text style={styles.ticketUserText}>
                    {ticket.userName} ({ticket.userEmail})
                  </Text>
                </View>

                {ticket.adminNotes && (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyText}>
                      <Text style={{ fontWeight: '700' }}>Admin Note: </Text>
                      {ticket.adminNotes}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.actionPrompt}>Tap to manage ›</Text>
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
                  <Ionicons name="close-circle" size={26} color="#8A879A" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 220, marginVertical: 10 }}>
                <Text style={styles.modalLabel}>Customer Issue:</Text>
                <Text style={styles.modalDesc}>{selectedTicket.description}</Text>

                <Text style={[styles.modalLabel, { marginTop: 12 }]}>From:</Text>
                <Text style={styles.modalDesc}>
                  {selectedTicket.userName} &lt;{selectedTicket.userEmail}&gt;
                </Text>

                <Text style={[styles.modalLabel, { marginTop: 12 }]}>Reply to Support Request:</Text>
                <TextInput
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  placeholder="Write a reply to the user..."
                  placeholderTextColor="#9EA5B1"
                  multiline
                  style={styles.modalInput}
                />
              </ScrollView>

              <Pressable
                onPress={handleSendReply}
                disabled={updating}
                style={[styles.replyButton, updating && { opacity: 0.65 }]}
              >
                <Text style={styles.replyButtonText}>{updating ? 'Sending...' : 'Send Reply'}</Text>
              </Pressable>

              <Text style={styles.modalLabel}>Update Status:</Text>
              <View style={styles.modalBtnRow}>
                <Pressable
                  onPress={() => handleUpdateStatus('in_progress')}
                  disabled={updating}
                  style={[styles.statusBtn, { backgroundColor: '#EDE9FE' }]}
                >
                  <Text style={[styles.statusBtnText, { color: '#6C3BEA' }]}>In Progress</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleUpdateStatus('resolved')}
                  disabled={updating}
                  style={[styles.statusBtn, { backgroundColor: '#D1FAE5' }]}
                >
                  <Text style={[styles.statusBtnText, { color: '#059669' }]}>Resolve</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleUpdateStatus('open')}
                  disabled={updating}
                  style={[styles.statusBtn, { backgroundColor: '#FEF3C7' }]}
                >
                  <Text style={[styles.statusBtnText, { color: '#D97706' }]}>Re-Open</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteTicket(selectedTicket)}
                  disabled={updating}
                  style={[styles.statusBtn, { backgroundColor: '#FEE2E2' }]}
                >
                  <Text style={[styles.statusBtnText, { color: '#B91C1C' }]}>Delete</Text>
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
  placeholderBtn: {
    width: 36,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1B2E',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE7F5',
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
    backgroundColor: '#F4F2FA',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#656276',
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
    color: '#1E1B2E',
  },
  emptySub: {
    fontSize: 13,
    color: '#656276',
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE7F5',
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
    backgroundColor: '#F4F2FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#656276',
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
    backgroundColor: '#FEF3C7',
  },
  badgeTextOpen: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeInProgress: {
    backgroundColor: '#EDE9FE',
  },
  badgeTextInProgress: {
    color: '#6C3BEA',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeResolved: {
    backgroundColor: '#D1FAE5',
  },
  badgeTextResolved: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  ticketDesc: {
    fontSize: 12,
    color: '#656276',
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
    color: '#8A879A',
  },
  replyBox: {
    backgroundColor: '#F6F3FE',
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
    borderTopColor: '#F4F2FA',
    paddingTop: 8,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#8A879A',
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F0EEF8',
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
    color: '#1E1B2E',
    marginTop: 2,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B485A',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: '#656276',
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#F7F6FC',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#1E1B2E',
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
