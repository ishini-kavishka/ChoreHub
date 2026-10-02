import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { authService } from '@/services/authService';
import { supportTicketService, SupportTicket } from '@/services/supportTicketService';

type TicketTab = 'my_tickets' | 'submit_ticket';
type TicketCategory = SupportTicket['category'];

const CATEGORIES: TicketCategory[] = [
  'Chore Issue',
  'Technical Bug',
  'Account & Login',
  'General Inquiry',
];

export default function CustomerTicketsScreen() {
  const [activeTab, setActiveTab] = useState<TicketTab>('my_tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Chore Issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      const member = await authService.getCurrentMember();
      if (member) {
        if (member.name) setUserName(member.name);
        if (member.email) setUserEmail(member.email);
      }
      const data = await supportTicketService.getUserTickets(member?.email);
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

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Required Field', 'Please enter a ticket subject.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please describe the issue or inquiry.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTicketId) {
        const updated = await supportTicketService.updateTicket(editingTicketId, {
          category,
          subject: subject.trim(),
          description: description.trim(),
          priority,
        });

        if (!updated) {
          throw new Error('Ticket not found');
        }

        await loadTickets();
        setSubject('');
        setDescription('');
        setCategory('Chore Issue');
        setPriority('medium');
        setEditingTicketId(null);
        setActiveTab('my_tickets');
      } else {
        await supportTicketService.createTicket({
          userName: userName || 'Customer',
          userEmail: userEmail || 'customer@example.com',
          category,
          subject: subject.trim(),
          description: description.trim(),
          priority,
        });
        await loadTickets();
        setSubject('');
        setDescription('');
        setCategory('Chore Issue');
        setPriority('medium');
        setEditingTicketId(null);
        setActiveTab('my_tickets');
      }
    } catch {
      Alert.alert('Error', editingTicketId ? 'Could not update support ticket. Please try again.' : 'Could not create support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    Alert.alert(
      `${ticket.ticketNumber} • ${ticket.subject}`,
      `${ticket.description}\n\nStatus: ${ticket.status.replace('_', ' ')}\nPriority: ${ticket.priority}`
    );
  };

  const handleEditTicket = (ticket: SupportTicket) => {
    setCategory(ticket.category);
    setSubject(ticket.subject);
    setDescription(ticket.description);
    setPriority(ticket.priority);
    setEditingTicketId(ticket.id);
    setActiveTab('submit_ticket');
  };

  const handleDeleteTicket = async (ticket: SupportTicket) => {
    const deleteConfirmedTicket = async () => {
      try {
        const deleted = await supportTicketService.deleteTicket(ticket.id);
        if (!deleted) throw new Error('Ticket not found');

        setTickets((current) => current.filter((item) => item.id !== ticket.id));
        if (Platform.OS === 'web') {
          window.alert('The support ticket has been removed.');
        } else {
          Alert.alert('Ticket Deleted', 'The support ticket has been removed.');
        }
      } catch {
        if (Platform.OS === 'web') {
          window.alert('Could not delete support ticket. Please try again.');
        } else {
          Alert.alert('Error', 'Could not delete support ticket. Please try again.');
        }
      }
    };

    const confirmationMessage = `Remove ${ticket.ticketNumber}? This action cannot be undone.`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmationMessage)) {
        await deleteConfirmedTicket();
      }
      return;
    }

    Alert.alert('Delete ticket', confirmationMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => { void deleteConfirmedTicket(); },
      },
    ]);
  };

  const renderStatusBadge = (status: SupportTicket['status']) => {
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
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/support' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Support Requests & Tickets</Text>
        <View style={styles.placeholderBtn} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('my_tickets')}
          style={[styles.tabButton, activeTab === 'my_tickets' && styles.tabButtonActive]}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'my_tickets' && styles.tabButtonTextActive,
            ]}
          >
            My Requests ({tickets.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('submit_ticket')}
          style={[styles.tabButton, activeTab === 'submit_ticket' && styles.tabButtonActive]}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'submit_ticket' && styles.tabButtonTextActive,
            ]}
          >
            + Submit New Ticket
          </Text>
        </Pressable>
      </View>

      {activeTab === 'my_tickets' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color="#6C3BEA" />
            </View>
          ) : tickets.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="file-tray-outline" size={36} color="#8A879A" />
              </View>
              <Text style={styles.emptyTitle}>No support tickets yet</Text>
              <Text style={styles.emptySubtitle}>
                Have a question or issue? Submit a ticket and our support team will resolve it.
              </Text>
              <Pressable
                onPress={() => setActiveTab('submit_ticket')}
                style={styles.submitFirstBtn}
              >
                <Text style={styles.submitFirstBtnText}>Submit a Ticket</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.ticketList}>
              {tickets.map((ticket) => (
                <View key={ticket.id} style={styles.ticketCard}>
                  <View style={styles.ticketCardHeader}>
                    <View style={styles.ticketIdRow}>
                      <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{ticket.category}</Text>
                      </View>
                    </View>
                    {renderStatusBadge(ticket.status)}
                  </View>

                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  <Text style={styles.ticketDescription}>{ticket.description}</Text>

                  {ticket.adminNotes && (
                    <View style={styles.adminNotesWrap}>
                      <Ionicons name="chatbubbles-outline" size={14} color="#6C3BEA" />
                      <Text style={styles.adminNotesText}>
                        <Text style={{ fontWeight: '700' }}>Support Reply: </Text>
                        {ticket.adminNotes}
                      </Text>
                    </View>
                  )}

                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketDate}>
                      Logged {new Date(ticket.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.ticketPriority}>
                      Priority:{' '}
                      <Text
                        style={{
                          color:
                            ticket.priority === 'high'
                              ? '#DC2626'
                              : ticket.priority === 'medium'
                              ? '#D97706'
                              : '#10B981',
                          fontWeight: '700',
                          textTransform: 'capitalize',
                        }}
                      >
                        {ticket.priority}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.ticketActions}>
                    <Pressable
                      onPress={() => handleViewTicket(ticket)}
                      style={[styles.ticketActionBtn, styles.ticketActionSecondary]}
                    >
                      <Text style={styles.ticketActionText}>View</Text>
                    </Pressable>
                    {!ticket.adminNotes && (
                      <Pressable
                        onPress={() => handleEditTicket(ticket)}
                        style={[styles.ticketActionBtn, styles.ticketActionPrimary]}
                      >
                        <Text style={styles.ticketActionText}>Edit</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleDeleteTicket(ticket)}
                      style={[styles.ticketActionBtn, styles.ticketActionDanger]}
                    >
                      <Text style={styles.ticketActionText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>{editingTicketId ? 'Edit Support Ticket' : 'Submit a Support Ticket'}</Text>
              <Text style={styles.formSubtitle}>
                {editingTicketId ? 'Update the details of your existing support request.' : 'Provide details about your question, chore dispute, or technical issue.'}
              </Text>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Issue Category</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          styles.catPill,
                          isSelected ? styles.catPillSelected : styles.catPillUnselected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.catPillText,
                            isSelected && styles.catPillTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Subject */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject / Summary</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="e.g. Chore points did not update"
                  placeholderTextColor="#9EA5B1"
                  style={styles.textInput}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Detailed Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe what happened and any steps to reproduce..."
                  placeholderTextColor="#9EA5B1"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[styles.textInput, styles.textArea]}
                />
              </View>

              {/* Priority */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Urgency / Priority</Text>
                <View style={styles.priorityRow}>
                  {(['low', 'medium', 'high'] as const).map((p) => {
                    const isSelected = priority === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setPriority(p)}
                        style={[
                          styles.priorityPill,
                          isSelected && styles.priorityPillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityPillText,
                            isSelected && styles.priorityPillTextSelected,
                          ]}
                        >
                          {p.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && { opacity: 0.85 },
                  submitting && { opacity: 0.7 },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{editingTicketId ? 'Update Support Request' : 'Submit Support Request'}</Text>
                )}
              </Pressable>

              {editingTicketId && (
                <Pressable
                  onPress={() => {
                    setEditingTicketId(null);
                    setSubject('');
                    setDescription('');
                    setCategory('Chore Issue');
                    setPriority('medium');
                  }}
                  style={({ pressed }) => [styles.cancelEditBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.cancelEditBtnText}>Cancel Edit</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Persistent Bottom Nav */}
      <SupportBottomNav activeTab="profile" role="member" />
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE7F5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F2FA',
  },
  tabButtonActive: {
    backgroundColor: '#6C3BEA',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#656276',
  },
  tabButtonTextActive: {
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
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#656276',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  submitFirstBtn: {
    backgroundColor: '#6C3BEA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  submitFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    gap: 8,
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
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#656276',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeOpen: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextOpen: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeInProgress: {
    backgroundColor: '#EDE9FE',
  },
  badgeTextInProgress: {
    color: '#6C3BEA',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeResolved: {
    backgroundColor: '#D1FAE5',
  },
  badgeTextResolved: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  ticketDescription: {
    fontSize: 13,
    color: '#656276',
    lineHeight: 18,
  },
  adminNotesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F6F3FE',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  adminNotesText: {
    fontSize: 12,
    color: '#4B368C',
    flex: 1,
    lineHeight: 16,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F4F2FA',
    paddingTop: 8,
    marginTop: 4,
  },
  ticketDate: {
    fontSize: 11,
    color: '#8A879A',
  },
  ticketPriority: {
    fontSize: 11,
    color: '#8A879A',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  ticketActionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketActionPrimary: {
    backgroundColor: '#EDE9FE',
  },
  ticketActionSecondary: {
    backgroundColor: '#F4F2FA',
  },
  ticketActionDanger: {
    backgroundColor: '#FEE2E2',
  },
  ticketActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1B2E',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    gap: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#656276',
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B485A',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  catPillSelected: {
    backgroundColor: '#6C3BEA',
  },
  catPillUnselected: {
    backgroundColor: '#F4F2FA',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#656276',
  },
  catPillTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#EAE7F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E1B2E',
  },
  textArea: {
    minHeight: 85,
    paddingTop: 10,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F4F2FA',
  },
  priorityPillSelected: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#6C3BEA',
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#656276',
  },
  priorityPillTextSelected: {
    color: '#6C3BEA',
  },
  submitBtn: {
    backgroundColor: '#6C3BEA',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelEditBtn: {
    backgroundColor: '#F4F2FA',
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: {
    color: '#4B485A',
    fontSize: 13,
    fontWeight: '700',
  },
});
