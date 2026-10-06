import { useAppAlert } from '@/components/ui/AppDialog';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
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



export default function CustomerTicketsScreen() {
  const alert = useAppAlert();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
const CATEGORIES: TicketCategory[] = [
  'Chore Issue',
  'Technical Bug',
  'Account & Login',
  'General Inquiry',
];
  const { t, language } = useLanguage();
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
      alert(t('ui_required_field'), t('ui_please_enter_a_ticket_subject'));
      return;
    }
    if (!description.trim()) {
      alert(t('ui_required_field'), t('ui_please_describe_the_issue_or_inquiry'));
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
      alert(t('error'), t('admin_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    alert(
      `${ticket.ticketNumber} • ${ticket.subject}`,
      `${ticket.description}\n\n${t('ui_status')}: ${t('ui_' + ticket.status)}\n${t('ui_priority')} ${t('priority_' + ticket.priority)}`
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
          window.alert(t('ui_the_support_ticket_has_been_removed'));
        } else {
          alert(t('ui_ticket_deleted'), t('ui_the_support_ticket_has_been_removed'));
        }
      } catch {
        if (Platform.OS === 'web') {
          window.alert(t('admin_error'));
        } else {
          alert(t('error'), t('admin_error'));
        }
      }
    };

    const confirmationMessage = t('ui_remove_ticket_this_action_cannot_be_undone').replace('{ticket}', ticket.ticketNumber);
    if (Platform.OS === 'web') {
      if (window.confirm(confirmationMessage)) {
        await deleteConfirmedTicket();
      }
      return;
    }

    alert(t('ui_delete_ticket'), confirmationMessage, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
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
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/support' as any)}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('admin_back')}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('ui_support_requests_tickets')}</Text>
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
          >{t('ui_my_requests')}{tickets.length})
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
          >{t('ui_submit_new_ticket')}</Text>
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
                <Ionicons name="file-tray-outline" size={36} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
              </View>
              <Text style={styles.emptyTitle}>{t('ui_no_support_tickets_yet')}</Text>
              <Text style={styles.emptySubtitle}>{t('ui_have_a_question_or_issue_submit_a_ticket_and_our_support_team_will_resolve_it')}</Text>
              <Pressable
                onPress={() => setActiveTab('submit_ticket')}
                style={styles.submitFirstBtn}
              >
                <Text style={styles.submitFirstBtnText}>{t('ui_submit_a_ticket')}</Text>
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
                        <Text style={styles.categoryPillText}>{t('ui_' + ticket.category.toLowerCase().replace(/[^a-z0-9]+/g, '_'), ticket.category)}</Text>
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
                        <Text style={{ fontWeight: '700' }}>{t('ui_support_reply')}</Text>
                        {ticket.adminNotes}
                      </Text>
                    </View>
                  )}

                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketDate}>{t('ui_logged')}{' '}{new Date(ticket.createdAt).toLocaleDateString(language)}
                    </Text>
                    <Text style={styles.ticketPriority}>{t('ui_priority')}{' '}
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
                        {t('priority_' + ticket.priority)}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.ticketActions}>
                    <Pressable
                      onPress={() => handleViewTicket(ticket)}
                      style={[styles.ticketActionBtn, styles.ticketActionSecondary]}
                    >
                      <Text style={styles.ticketActionText}>{t('view')}</Text>
                    </Pressable>
                    {!ticket.adminNotes && (
                      <Pressable
                        onPress={() => handleEditTicket(ticket)}
                        style={[styles.ticketActionBtn, styles.ticketActionPrimary]}
                      >
                        <Text style={styles.ticketActionText}>{t('edit')}</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleDeleteTicket(ticket)}
                      style={[styles.ticketActionBtn, styles.ticketActionDanger]}
                    >
                      <Text style={styles.ticketActionText}>{t('delete')}</Text>
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
              <Text style={styles.formTitle}>{editingTicketId ? t('ui_edit_support_ticket') : t('ui_submit_a_support_ticket')}</Text>
              <Text style={styles.formSubtitle}>
                {editingTicketId ? t('ui_update_the_details_of_your_existing_support_request') : t('ui_provide_details_about_your_question_chore_dispute_or_technical_issue')}
              </Text>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('ui_issue_category')}</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <Pressable
                        key={t('ui_' + cat.toLowerCase().replace(/[^a-z0-9]+/g, '_'), cat)}
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
                <Text style={styles.inputLabel}>{t('ui_subject_summary')}</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder={t('ui_e_g_chore_points_did_not_update')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9EA5B1"}
                  style={styles.textInput}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('ui_detailed_description')}</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('ui_describe_what_happened_and_any_steps_to_reproduce')}
                  placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9EA5B1"}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[styles.textInput, styles.textArea]}
                />
              </View>

              {/* Priority */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('ui_urgency_priority')}</Text>
                <View style={styles.priorityRow}>
                  {(['low', 'medium', 'high'] as const).map((p) => {
                    const isSelected = priority === p;
                    return (
                      <Pressable
                        key={t('priority_' + p)}
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
                          {t('priority_' + p)}
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
                  <Text style={styles.submitBtnText}>{editingTicketId ? t('ui_update_support_request') : t('ui_submit_support_request')}</Text>
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
                  <Text style={styles.cancelEditBtnText}>{t('ui_cancel_edit')}</Text>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
  },
  tabButtonActive: {
    backgroundColor: '#6C3BEA',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF3C7'),
  },
  badgeTextOpen: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeInProgress: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
  },
  badgeTextInProgress: {
    color: '#6C3BEA',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeResolved: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#D1FAE5'),
  },
  badgeTextResolved: {
    color: (themeColors.isDark ? themeColors.success : '#059669'),
    fontSize: 11,
    fontWeight: '800',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  ticketDescription: {
    fontSize: 13,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 18,
  },
  adminNotesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F6F3FE'),
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
    borderTopColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
    paddingTop: 8,
    marginTop: 4,
  },
  ticketDate: {
    fontSize: 11,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
  },
  ticketPriority: {
    fontSize: 11,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
  },
  ticketActionSecondary: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
  },
  ticketActionDanger: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEE2E2'),
  },
  ticketActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  formContainer: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    gap: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  formSubtitle: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#4B485A'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  catPillTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'),
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
  },
  priorityPillSelected: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    borderWidth: 1.5,
    borderColor: '#6C3BEA',
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
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
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F4F2FA'),
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: {
    color: (themeColors.isDark ? themeColors.textSecondary : '#4B485A'),
    fontSize: 13,
    fontWeight: '700',
  },
});
