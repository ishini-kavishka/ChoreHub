import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { familyService, SearchedUser } from '@/services/familyService';
import { Avatar } from '@/components/profile/Avatar';

const RELATIONSHIPS = ['Mother', 'Father', 'Daughter', 'Son', 'Other'];

export default function AddFamilyMemberScreen() {
  const [emailInput, setEmailInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState('Mother');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSearch = async () => {
    if (!emailInput.trim()) {
      setError('Please enter a registered user email address.');
      setSearchedUser(null);
      return;
    }

    setSearching(true);
    setError('');
    setSuccessMsg('');
    setSearchedUser(null);

    try {
      const user = await familyService.searchUserByEmail(emailInput.trim());
      setSearchedUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User not found.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!searchedUser) return;
    if (searchedUser.is_already_member) {
      setError('This user is already a member of your family.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await familyService.addFamilyMember(searchedUser.id, selectedRelationship);
      setSuccessMsg(`${searchedUser.name} has been added as ${selectedRelationship}! 🎉`);
      setSearchedUser(null);
      setEmailInput('');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add family member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
              <Ionicons name="arrow-back" size={24} color="#1E1B2E" />
            </Pressable>
            <Text style={styles.headerTitle}>Add Family Member</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.subtitle}>
            Connect an existing registered ChoreHub user to your household.
          </Text>

          {/* ── Error / Success Banners ── */}
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* ── Step 1: Search by Email ── */}
          <View style={styles.cardSection}>
            <Text style={styles.stepLabel}>STEP 1: FIND USER BY EMAIL</Text>

            <View style={styles.searchRow}>
              <View style={styles.inputCard}>
                <Ionicons name="mail-outline" size={20} color="#8A879A" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter registered email..."
                  placeholderTextColor="#A09DB1"
                  value={emailInput}
                  onChangeText={(t) => {
                    setEmailInput(t);
                    if (error) setError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
              </View>

              <Pressable
                onPress={handleSearch}
                disabled={searching}
                style={({ pressed }) => [
                  styles.searchBtn,
                  pressed && { opacity: 0.88 },
                ]}
              >
                {searching ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>

          {/* ── Step 2 & 3: Found User Preview ── */}
          {searchedUser ? (
            <View style={styles.cardSection}>
              <Text style={styles.stepLabel}>STEP 2: USER FOUND</Text>

              <View style={styles.userPreviewCard}>
                <Avatar
                  name={searchedUser.name}
                  uri={searchedUser.avatar || undefined}
                  size={54}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{searchedUser.name}</Text>
                  <Text style={styles.userEmail}>{searchedUser.email}</Text>
                  {searchedUser.is_already_member ? (
                    <View style={styles.alreadyBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#713DE8" />
                      <Text style={styles.alreadyText}>Already in your family</Text>
                    </View>
                  ) : (
                    <View style={styles.availableBadge}>
                      <Ionicons name="sparkles" size={12} color="#10B981" />
                      <Text style={styles.availableText}>Available to add</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* ── Step 4: Choose Relationship Role ── */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.stepLabel}>STEP 3: CHOOSE RELATIONSHIP</Text>
                <View style={styles.pillsRow}>
                  {RELATIONSHIPS.map((rel) => {
                    const isSelected = selectedRelationship === rel;
                    return (
                      <Pressable
                        key={rel}
                        onPress={() => setSelectedRelationship(rel)}
                        style={[
                          styles.relPill,
                          isSelected && styles.relPillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.relPillText,
                            isSelected && styles.relPillTextSelected,
                          ]}
                        >
                          {rel}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── Step 5: Add to Family Button ── */}
              <Pressable
                onPress={handleAddMember}
                disabled={loading || Boolean(searchedUser.is_already_member)}
                style={({ pressed }) => [
                  styles.addBtn,
                  searchedUser.is_already_member && styles.disabledBtn,
                  pressed && { opacity: 0.88 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.addBtnText}>
                    {searchedUser.is_already_member
                      ? 'Already in Household'
                      : `Add to Family as ${selectedRelationship}`}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A879A',
    textAlign: 'center',
    marginBottom: 4,
  },

  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  successCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  successText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '700',
    flex: 1,
  },

  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAE7F5',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#713DE8',
    letterSpacing: 0.8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputCard: {
    flex: 1,
    height: 52,
    backgroundColor: '#FAFAFD',
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1B2E',
  },
  searchBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#713DE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },

  userPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FAFAFD',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B2E',
  },
  userEmail: {
    fontSize: 13,
    color: '#8A879A',
    fontWeight: '500',
  },
  alreadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  alreadyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#713DE8',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  availableText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  relPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#EAE7F5',
  },
  relPillSelected: {
    backgroundColor: '#713DE8',
    borderColor: '#713DE8',
  },
  relPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B2E',
  },
  relPillTextSelected: {
    color: '#FFFFFF',
  },

  addBtn: {
    width: '100%',
    backgroundColor: '#713DE8',
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#713DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#A09DB1',
    shadowOpacity: 0,
    elevation: 0,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
