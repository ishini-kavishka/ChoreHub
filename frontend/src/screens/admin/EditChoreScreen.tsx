import { translateFeedback } from '@/i18n/translations';
import { useAppAlert } from '@/components/ui/AppDialog';
import { useLanguage } from '@/context/LanguageContext';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React, { useEffect, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { choreService } from '@/services/choreService';
import { familyService } from '@/services/familyService';

export default function EditChoreScreen() {
  const alert = useAppAlert();
  const { t, language } = useLanguage();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ id?: string; choreData?: string }>();
  const choreId = params.id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [status, setStatus] = useState<'pending' | 'completed' | 'overdue'>('pending');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [assignedName, setAssignedName] = useState<string>('');

  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [dueDateString, setDueDateString] = useState<string>('');

  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Modals for pickers
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Assignment IDs must belong to the household used by progress.
  useEffect(() => {
    familyService.getMyFamily()
      .then((res) => setMembers(res.members.map((m) => ({
        id: m.id, name: m.name || m.email, email: m.email,
      }))))
      .catch(() => setError(t('ui_failed_to_load_household_members')));
  }, []);

  // Fetch chore details
  useEffect(() => {
    if (!choreId) {
      setFetching(false);
      return;
    }

    // Attempt to load from route params first if passed
    if (params.choreData) {
      try {
        const parsed = JSON.parse(params.choreData);
        populateChore(parsed);
        setFetching(false);
        return;
      } catch {
        // Fallback to API call
      }
    }

    choreService
      .getChoreById(choreId)
      .then((res) => {
        if (res?.chore) {
          populateChore(res.chore);
        }
      })
      .catch((err) => {
        setError(t('ag_fetch_failed'));
      })
      .finally(() => setFetching(false));
  }, [choreId, params.choreData]);

  const populateChore = (chore: any) => {
    setTitle(chore.title || '');
    setDescription(chore.description || '');
    setPriority(chore.priority || 'medium');
    setRecurrence(chore.recurrence || 'none');
    setStatus(chore.status || 'pending');
    setAssignedTo(chore.assigned_to || null);
    setAssignedName(chore.assignee_name || '');

    if (chore.due_date) {
      const d = new Date(chore.due_date);
      if (!isNaN(d.getTime())) {
        setDueDate(d);
        setDueDateString(
          d.toLocaleDateString(language, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        );
      }
    }
  };

  const handleUpdateChore = async () => {
    if (!choreId) return;
    if (!title.trim()) {
      setError(t('ui_please_enter_a_chore_title'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await choreService.updateChore(choreId, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: 'General',
        priority,
        recurrence,
        status,
        assigned_to: assignedTo,
        due_date: dueDate.toISOString(),
      });

      alert(t('success'), t('ag_chore_updated'));
      router.back();
    } catch (err) {
      setError(t('ag_update_failed'));
    } finally {
      setLoading(false);
    }
  };

  const getRepeatLabel = (rec: string) => {
    switch (rec) {
      case 'daily':
        return t('repeat_daily');
      case 'weekly':
        return t('repeat_weekly');
      case 'monthly':
        return t('repeat_monthly');
      default:
        return t('repeat_none');
    }
  };

  const getStatusLabel = (st: string) => {
    switch (st) {
      case 'completed':
        return t('filter_completed');
      case 'overdue':
        return t('status_overdue');
      default:
        return t('filter_pending');
    }
  };

  const formattedDate = dueDate.toLocaleDateString(language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const memberInitial = assignedName
    ? assignedName.trim().charAt(0).toUpperCase()
    : 'U';

  if (fetching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#713DE8" />
          <Text style={styles.loadingText}>{t('ag_loading_details')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel={t('back')}
        >
          <Ionicons name="chevron-back" size={24} color={themeColors.isDark ? themeColors.textPrimary : "#1E1B2E"} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('ui_edit_chore')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.errorText}>{translateFeedback(error, t)}</Text> : null}

        {/* Chore Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('ag_chore_title')}<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('ag_enter_title')}
            placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9592A6"}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('description_label')}</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder={t('ag_enter_description')}
            placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#9592A6"}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Assign to Member */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('ag_assign_member')}<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowMemberPicker(true)}
            style={styles.dropdownInput}
          >
            <View style={styles.dropdownLeft}>
              {assignedName ? (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{memberInitial}</Text>
                </View>
              ) : (
                <Ionicons name="person-outline" size={18} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
              )}
              <Text
                style={[
                  styles.dropdownText,
                  assignedName ? styles.selectedDropdownText : styles.placeholderText,
                ]}
              >
                {assignedName || t('ag_select_a_member')}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
          </Pressable>
        </View>

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('priority_label')}<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.priorityRow}>
            {/* Low */}
            <Pressable
              onPress={() => setPriority('low')}
              style={[
                styles.priorityBadge,
                styles.lowBadge,
                priority === 'low' && styles.lowBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.priorityBadgeText,
                  styles.lowText,
                  priority === 'low' && styles.activeBadgeText,
                ]}
              >{t('priority_low')}</Text>
            </Pressable>

            {/* Medium */}
            <Pressable
              onPress={() => setPriority('medium')}
              style={[
                styles.priorityBadge,
                styles.mediumBadge,
                priority === 'medium' && styles.mediumBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.priorityBadgeText,
                  styles.mediumText,
                  priority === 'medium' && styles.activeBadgeText,
                ]}
              >{t('priority_medium')}</Text>
            </Pressable>

            {/* High */}
            <Pressable
              onPress={() => setPriority('high')}
              style={[
                styles.priorityBadge,
                styles.highBadge,
                priority === 'high' && styles.highBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.priorityBadgeText,
                  styles.highText,
                  priority === 'high' && styles.activeBadgeText,
                ]}
              >{t('priority_high')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('due_date_label')}<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.dropdownInput}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons name="calendar-outline" size={18} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
              <Text style={styles.selectedDropdownText}>{formattedDate}</Text>
            </View>
          </Pressable>
        </View>

        {/* Repeat */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('repeat_label')}</Text>
          <Pressable
            onPress={() => setShowRepeatPicker(true)}
            style={styles.dropdownInput}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons name="refresh-outline" size={18} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
              <Text style={styles.selectedDropdownText}>
                {getRepeatLabel(recurrence)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
          </Pressable>
        </View>

        {/* Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('ui_status')}<Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowStatusPicker(true)}
            style={styles.dropdownInput}
          >
            <View style={styles.dropdownLeft}>
              <View
                style={[
                  styles.statusDot,
                  status === 'completed'
                    ? styles.completedDot
                    : status === 'overdue'
                    ? styles.overdueDot
                    : styles.pendingDot,
                ]}
              />
              <Text style={styles.selectedDropdownText}>
                {getStatusLabel(status)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={themeColors.isDark ? themeColors.textSecondary : "#8A879A"} />
          </Pressable>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Pressable
            onPress={handleUpdateChore}
            disabled={loading}
            style={({ pressed }) => [
              styles.updateBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.updateBtnText}>{t('ag_update_chore')}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Member Picker Modal */}
      <Modal visible={showMemberPicker} animationType="slide" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMemberPicker(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{t('ag_select_member')}</Text>
            <Pressable
              style={styles.pickerOption}
              onPress={() => {
                setAssignedTo(null);
                setAssignedName('');
                setShowMemberPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{t('admin_unassigned')}</Text>
            </Pressable>
            {members.map((m) => (
              <Pressable
                key={m.id}
                style={styles.pickerOption}
                onPress={() => {
                  setAssignedTo(m.id);
                  setAssignedName(m.name);
                  setShowMemberPicker(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.pickerOptionText}>{m.name}</Text>
                    <Text style={styles.pickerSubtext}>{m.email}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Repeat Picker Modal */}
      <Modal visible={showRepeatPicker} animationType="slide" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRepeatPicker(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{t('ag_select_repeat')}</Text>
            {[
              { label: t('repeat_none'), value: 'none' },
              { label: t('repeat_daily'), value: 'daily' },
              { label: t('repeat_weekly'), value: 'weekly' },
              { label: t('repeat_monthly'), value: 'monthly' },
            ].map((opt) => (
              <Pressable
                key={opt.value}
                style={styles.pickerOption}
                onPress={() => {
                  setRecurrence(opt.value as any);
                  setShowRepeatPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Status Picker Modal */}
      <Modal visible={showStatusPicker} animationType="slide" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{t('ag_select_status')}</Text>
            {[
              { label: t('filter_pending'), value: 'pending', dotStyle: styles.pendingDot },
              { label: t('filter_completed'), value: 'completed', dotStyle: styles.completedDot },
              { label: t('status_overdue'), value: 'overdue', dotStyle: styles.overdueDot },
            ].map((opt) => (
              <Pressable
                key={opt.value}
                style={styles.pickerOption}
                onPress={() => {
                  setStatus(opt.value as any);
                  setShowStatusPicker(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.statusDot, opt.dotStyle]} />
                  <Text style={styles.pickerOptionText}>{opt.label}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Date Selector Modal */}
      <Modal visible={showDatePicker} animationType="slide" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{t('ag_select_due')}</Text>
            {[
              { label: t('today'), offsetDays: 0 },
              { label: t('ag_tomorrow'), offsetDays: 1 },
              { label: t('ag_three_days'), offsetDays: 3 },
              { label: t('ag_next_week'), offsetDays: 7 },
            ].map((opt) => (
              <Pressable
                key={opt.label}
                style={styles.pickerOption}
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + opt.offsetDays);
                  setDueDate(d);
                  setDueDateString(
                    d.toLocaleDateString(language, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  );
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FFFFFF'),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: (themeColors.isDark ? themeColors.textSecondary : '#757288'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 18,
  },
  errorText: {
    color: (themeColors.isDark ? themeColors.error : '#DC2626'),
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FAFAFD'),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownText: {
    fontSize: 14,
  },
  placeholderText: {
    color: (themeColors.isDark ? themeColors.textSecondary : '#9592A6'),
  },
  selectedDropdownText: {
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    fontWeight: '600',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: '800',
    color: '#713DE8',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pendingDot: {
    backgroundColor: '#F59E0B',
  },
  completedDot: {
    backgroundColor: '#10B981',
  },
  overdueDot: {
    backgroundColor: '#EF4444',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityBadge: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  lowBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#DCFCE7'),
    borderColor: (themeColors.isDark ? themeColors.border : '#DCFCE7'),
  },
  lowBadgeActive: {
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  lowText: {
    color: '#16A34A',
  },
  mediumBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    borderColor: (themeColors.isDark ? themeColors.border : '#EDE9FE'),
  },
  mediumBadgeActive: {
    borderColor: '#713DE8',
    borderWidth: 2,
  },
  mediumText: {
    color: '#713DE8',
  },
  highBadge: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEE2E2'),
    borderColor: (themeColors.isDark ? themeColors.border : '#FEE2E2'),
  },
  highBadgeActive: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  highText: {
    color: '#DC2626',
  },
  priorityBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeBadgeText: {
    fontWeight: '800',
  },
  submitContainer: {
    paddingTop: 12,
  },
  updateBtn: {
    backgroundColor: '#713DE8',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
    marginBottom: 4,
  },
  pickerOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F4F2FA'),
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  pickerSubtext: {
    fontSize: 12,
    color: (themeColors.isDark ? themeColors.textSecondary : '#8A879A'),
    marginTop: 2,
  },
});
