import React, { useEffect, useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { choreService } from '@/services/choreService';
import { familyService } from '@/services/familyService';

export default function AddChoreScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [assignedName, setAssignedName] = useState<string>('');

  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [dueDateString, setDueDateString] = useState<string>('');

  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals for pickers
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    familyService.getMyFamily()
      .then((res) => setMembers(res.members.map((m) => ({
        id: m.id, name: m.name || m.email, email: m.email,
      }))))
      .catch(() => setError('Failed to load household members.'));
  }, []);

  const handleCreateChore = async () => {
    if (!title.trim()) {
      setError('Please enter a chore title.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await choreService.createChore({
        title: title.trim(),
        description: description.trim() || undefined,
        category: 'General',
        priority,
        recurrence,
        assigned_to: assignedTo,
        due_date: dueDate.toISOString(),
      });

      Alert.alert('Success', 'Chore created successfully!');
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chore.');
    } finally {
      setLoading(false);
    }
  };

  const getRepeatLabel = (rec: string) => {
    switch (rec) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'No repeat';
    }
  };

  const formattedDate = dueDateString
    ? dueDateString
    : dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color="#1E1B2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Add New Chore</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Chore Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Chore Title <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter chore title"
            placeholderTextColor="#9592A6"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter description (optional)"
            placeholderTextColor="#9592A6"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Assign to Member */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Assign to Member <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowMemberPicker(true)}
            style={styles.dropdownInput}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons name="person-outline" size={18} color="#8A879A" />
              <Text
                style={[
                  styles.dropdownText,
                  assignedName ? styles.selectedDropdownText : styles.placeholderText,
                ]}
              >
                {assignedName || 'Select a member'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#8A879A" />
          </Pressable>
        </View>

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Priority <Text style={styles.requiredAsterisk}>*</Text>
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
              >
                Low
              </Text>
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
              >
                Medium
              </Text>
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
              >
                High
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Due Date <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.dropdownInput}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons name="calendar-outline" size={18} color="#8A879A" />
              <Text style={styles.selectedDropdownText}>{formattedDate}</Text>
            </View>
          </Pressable>
        </View>

        {/* Repeat */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Repeat</Text>
          <Pressable
            onPress={() => setShowRepeatPicker(true)}
            style={styles.dropdownInput}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons name="refresh-outline" size={18} color="#8A879A" />
              <Text style={styles.selectedDropdownText}>
                {getRepeatLabel(recurrence)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#8A879A" />
          </Pressable>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Pressable
            onPress={handleCreateChore}
            disabled={loading}
            style={({ pressed }) => [
              styles.createBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.createBtnText}>Create Chore</Text>
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
            <Text style={styles.pickerTitle}>Select Member</Text>
            <Pressable
              style={styles.pickerOption}
              onPress={() => {
                setAssignedTo(null);
                setAssignedName('');
                setShowMemberPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>Unassigned</Text>
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
                <Text style={styles.pickerOptionText}>👤 {m.name}</Text>
                <Text style={styles.pickerSubtext}>{m.email}</Text>
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
            <Text style={styles.pickerTitle}>Select Repeat</Text>
            {[
              { label: 'No repeat', value: 'none' },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
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

      {/* Date Selector Modal */}
      <Modal visible={showDatePicker} animationType="slide" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Due Date</Text>
            {[
              { label: 'Today', offsetDays: 0 },
              { label: 'Tomorrow', offsetDays: 1 },
              { label: 'In 3 Days', offsetDays: 3 },
              { label: 'Next Week (7 Days)', offsetDays: 7 },
            ].map((opt) => (
              <Pressable
                key={opt.label}
                style={styles.pickerOption}
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + opt.offsetDays);
                  setDueDate(d);
                  setDueDateString(
                    d.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F2FA',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 18,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B2E',
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FAFAFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E1B2E',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE7F5',
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
    color: '#9592A6',
  },
  selectedDropdownText: {
    color: '#1E1B2E',
    fontWeight: '600',
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
    backgroundColor: '#DCFCE7',
    borderColor: '#DCFCE7',
  },
  lowBadgeActive: {
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  lowText: {
    color: '#16A34A',
  },
  mediumBadge: {
    backgroundColor: '#EDE9FE',
    borderColor: '#EDE9FE',
  },
  mediumBadgeActive: {
    borderColor: '#713DE8',
    borderWidth: 2,
  },
  mediumText: {
    color: '#713DE8',
  },
  highBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FEE2E2',
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
  createBtn: {
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
  createBtnText: {
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B2E',
    marginBottom: 4,
  },
  pickerOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F2FA',
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B2E',
  },
  pickerSubtext: {
    fontSize: 12,
    color: '#8A879A',
    marginTop: 2,
  },
});
