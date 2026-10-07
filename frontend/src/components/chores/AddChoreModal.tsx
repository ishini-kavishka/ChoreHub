import { translateFeedback } from '@/i18n/translations';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
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
import { choreService } from '@/services/choreService';
import { familyService, FamilyMember } from '@/services/familyService';

interface AddChoreModalProps {
  visible: boolean;
  onClose: () => void;
  onChoreCreated: () => void;
}

export function AddChoreModal({
  visible,
  onClose,
  onChoreCreated,
}: AddChoreModalProps) {
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      choreService.getAdminAllUsers()
        .then((res) => setMembers(res.users.map((u) => ({
          id: u.id,
          family_id: null,
          user_id: u.id,
          role: u.role || 'member',
          relationship: 'Other',
          name: u.name || u.email,
          email: u.email,
          avatar: u.avatar,
        }))))
        .catch(() => {
          familyService.getMyFamily()
            .then((res) => setMembers(res.members))
            .catch(() => setError(t('ui_failed_to_load_household_members')));
        });
    }
  }, [visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('General');
    setPriority('medium');
    setRecurrence('none');
    setAssignedTo(null);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t('ui_please_enter_a_chore_title'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await choreService.createChore({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        recurrence,
        assigned_to: assignedTo,
        due_date: new Date().toISOString(),
      });

      resetForm();
      onChoreCreated();
      onClose();
    } catch (err) {
      setError(t('admin_error'));
    } finally {
      setLoading(false);
    }
  };

  const categories = ['General', 'Cleaning', 'Kitchen', 'Laundry', 'Yard', 'Pets'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('ui_add_new_chore')}</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {error ? <Text style={styles.errorText}>{translateFeedback(error, t)}</Text> : null}

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('ui_title')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('ui_e_g_wash_the_dinner_dishes')}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A0A0B0"}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('ui_description_optional')}</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder={t('ui_add_any_specific_instructions')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#A0A0B0"}
              />
            </View>

            {/* Priority Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('priority_label')}</Text>
              <View style={styles.pillRow}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.pill,
                      priority === p && styles.prioritySelectedPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        priority === p && styles.selectedPillText,
                      ]}
                    >
                      {t('priority_' + p)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('ui_category')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}
              >
                {categories.map((cat) => (
                  <Pressable
                    key={t('ui_' + cat.toLowerCase(), cat)}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.pill,
                      category === cat && styles.categorySelectedPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        category === cat && styles.selectedPillText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Repeat Options */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('repeat_label')}</Text>
              <View style={styles.pillRow}>
                {(['none', 'daily', 'weekly', 'monthly'] as const).map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setRecurrence(r)}
                    style={[
                      styles.pill,
                      recurrence === r && styles.repeatSelectedPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        recurrence === r && styles.selectedPillText,
                      ]}
                    >
                      {t('repeat_' + r)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Assign Member */}
            {members.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('ui_assign_to')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillRow}
                >
                  <Pressable
                    onPress={() => setAssignedTo(null)}
                    style={[
                      styles.pill,
                      assignedTo === null && styles.assigneeSelectedPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        assignedTo === null && styles.selectedPillText,
                      ]}
                    >{t('admin_unassigned')}</Text>
                  </Pressable>

                  {members.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => setAssignedTo(m.id)}
                      style={[
                        styles.pill,
                        assignedTo === m.id && styles.assigneeSelectedPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          assignedTo === m.id && styles.selectedPillText,
                        ]}
                      >
                        👤 {m.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t('ui_create_chore')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#FFFFFF'),
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: (themeColors.isDark ? themeColors.border : '#F0EFF8'),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  closeBtn: {
    padding: 6,
  },
  closeIcon: {
    fontSize: 18,
    color: (themeColors.isDark ? themeColors.textSecondary : '#757288'),
    fontWeight: '800',
  },
  formContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
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
    fontSize: 13,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#4B485C'),
  },
  input: {
    backgroundColor: (themeColors.isDark ? themeColors.card : '#F8F7FC'),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: (themeColors.isDark ? themeColors.border : '#EAE7F5'),
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: (themeColors.isDark ? themeColors.textPrimary : '#1E1B2E'),
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#F0EFF8'),
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
  },
  prioritySelectedPill: {
    backgroundColor: '#713DE8',
  },
  categorySelectedPill: {
    backgroundColor: '#713DE8',
  },
  repeatSelectedPill: {
    backgroundColor: '#713DE8',
  },
  assigneeSelectedPill: {
    backgroundColor: '#713DE8',
  },
  selectedPillText: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  submitBtn: {
    backgroundColor: '#713DE8',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
