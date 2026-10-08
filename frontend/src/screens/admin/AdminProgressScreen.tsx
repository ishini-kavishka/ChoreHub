import { translateFeedback } from '@/i18n/translations';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '@/context/LanguageContext';
import {
  adminComponent04Service,
  Dashboard,
  Household,
  Range,
} from '@/services/adminComponent04Service';
import {
  Action,
  AdminGate,
  AdminPage,
  Card,
  Label,
  s,
  useAdminColors,
} from './AdminComponent04Shared';

// Category donut colors matching the reference design
const CATEGORY_COLORS = [
  '#4F46E5', // Indigo / Kitchen
  '#9333EA', // Purple / Living Room
  '#F97316', // Orange / Outdoor
  '#10B981', // Teal-Green / Bathroom
  '#EC4899', // Pink / Bedroom
  '#06B6D4', // Cyan / General
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
];

// Member avatar background colors
const MEMBER_AVATAR_COLORS = [
  { bg: '#E0E7FF', text: '#4338CA' }, // Indigo
  { bg: '#FEE2E2', text: '#DC2626' }, // Coral red
  { bg: '#FEF3C7', text: '#D97706' }, // Amber
  { bg: '#D1FAE5', text: '#059669' }, // Emerald
  { bg: '#EDE9FE', text: '#7C3AED' }, // Violet
  { bg: '#FCE7F3', text: '#DB2777' }, // Rose
];

export default function AdminProgressScreen() {
  return <AdminGate>{(household) => <Progress household={household} />}</AdminGate>;
}

function Progress({ household }: { household: Household }) {
  const themeColors = useClientTheme().colors;
  const { t, language } = useLanguage();
  const c = useAdminColors();

  const [range, setRange] = useState<Range>('week');
  const [data, setData] = useState<Dashboard | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<{
    label: string;
    bucket?: 'pending' | 'completed' | 'overdue';
    member?: string;
  } | null>(null);

  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setBusy(true);
    setError('');
    setData(null);
    try {
      const result = await adminComponent04Service.progress(household.id, range);
      if (version === requestVersion.current) setData(result);
    } catch {
      if (version === requestVersion.current) setError(t('admin_error'));
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }, [household.id, range, t]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestVersion.current += 1; };
  }, [load]));

  // Donut circumference for r=50 (100px diameter inside 140x140 view)
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.159

  let cumulativeOffset = 0;

  return (
    <AdminPage
      showNotificationBell={false}
      title={t('admin_progress')}
      household={household}
      busy={busy}
      error={translateFeedback(error, t)}
      refresh={() => void load()}
    >
      {/* ── Date Range Filters (Today / This Week / This Month) ──────────── */}
      <View style={styles.filterBar}>
        {(['today', 'week', 'month'] as const).map((key) => {
          const isSelected = range === key;
          const label =
            key === 'today'
              ? t('filter_today')
              : key === 'week'
              ? t('filter_week')
              : t('filter_month');
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              disabled={busy}
              onPress={() => {
                setRange(key);
                setDetail(null);
              }}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isSelected ? c.accent : c.soft,
                  borderColor: isSelected ? c.accent : c.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: isSelected
                      ? c.bg === (themeColors.isDark ? themeColors.textPrimary : '#14121F')
                        ? (themeColors.isDark ? themeColors.textPrimary : '#211C35')
                        : '#FFFFFF'
                      : c.accent,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Label muted>{t('admin_scope')}</Label>

      {data && (
        <>
          {/* ── 1. Overall Completion Card (Matches Attached Image) ───────── */}
          <Card>
            {/* Header: Title + Purple Percentage Badge */}
            <View style={styles.overallHeader}>
              <Text style={[styles.overallTitle, { color: c.text }]}>
                {t('overall_completion')}
              </Text>
              <View style={[styles.percentagePill, { backgroundColor: c.soft }]}>
                <Text style={[styles.percentagePillText, { color: c.accent }]}>
                  {data.summary.percentage}%
                </Text>
              </View>
            </View>

            {/* Overall Purple Progress Bar */}
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: data.summary.percentage }}
              style={[styles.progressBarTrack, { backgroundColor: c.soft }]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, data.summary.percentage))}%`,
                    backgroundColor: c.accent,
                  },
                ]}
              />
            </View>

            {/* 4 Summary Tiles: Total, Pending, Completed, Overdue */}
            <View style={styles.summaryRow}>
              {/* Total */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('admin_total')}: ${data.summary.total}`}
                onPress={() => setDetail({ label: t('admin_total'), bucket: undefined })}
                style={({ pressed }) => [
                  styles.summaryTile,
                  pressed && styles.tilePressed,
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FFF8E6') }]}>
                  <Ionicons name="list" size={18} color="#D97706" />
                </View>
                <Text style={[styles.summaryNumber, { color: c.text }]}>
                  {data.summary.total}
                </Text>
                <Text style={[styles.summaryLabel, { color: c.muted }]}>
                  {t('admin_total')}
                </Text>
              </Pressable>

              {/* Pending */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('admin_pending')}: ${data.summary.pending}`}
                onPress={() =>
                  setDetail({ label: t('admin_pending'), bucket: 'pending' })
                }
                style={({ pressed }) => [
                  styles.summaryTile,
                  pressed && styles.tilePressed,
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#F0EAFF') }]}>
                  <Ionicons name="hourglass" size={17} color="#713DE8" />
                </View>
                <Text style={[styles.summaryNumber, { color: c.text }]}>
                  {data.summary.pending}
                </Text>
                <Text style={[styles.summaryLabel, { color: c.muted }]}>
                  {t('admin_pending')}
                </Text>
              </Pressable>

              {/* Completed */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('admin_completed')}: ${data.summary.completed}`}
                onPress={() =>
                  setDetail({ label: t('admin_completed'), bucket: 'completed' })
                }
                style={({ pressed }) => [
                  styles.summaryTile,
                  pressed && styles.tilePressed,
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#ECFDF5') }]}>
                  <Ionicons name="checkmark" size={18} color="#10B981" />
                </View>
                <Text style={[styles.summaryNumber, { color: c.text }]}>
                  {data.summary.completed}
                </Text>
                <Text style={[styles.summaryLabel, { color: c.muted }]}>
                  {t('admin_completed')}
                </Text>
              </Pressable>

              {/* Overdue */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('admin_overdue')}: ${data.summary.overdue}`}
                onPress={() =>
                  setDetail({ label: t('admin_overdue'), bucket: 'overdue' })
                }
                style={({ pressed }) => [
                  styles.summaryTile,
                  pressed && styles.tilePressed,
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FEF2F2') }]}>
                  <Ionicons name="alert" size={17} color="#EF4444" />
                </View>
                <Text
                  style={[
                    styles.summaryNumber,
                    { color: data.summary.overdue > 0 ? c.error : c.text },
                  ]}
                >
                  {data.summary.overdue}
                </Text>
                <Text style={[styles.summaryLabel, { color: c.muted }]}>
                  {t('admin_overdue')}
                </Text>
              </Pressable>
            </View>

            <Label muted>{t('admin_buckets')}</Label>
            {data.summary.total === 0 && <Label>{t('admin_empty')}</Label>}
          </Card>

          {/* ── 2. Completion by Member (Matches Attached Image) ──────────── */}
          <Card>
            <Text style={[styles.sectionHeading, { color: c.text }]}>
              {t('progress_by_member')}
            </Text>

            {data.members.length === 0 ? (
              <Label muted>{t('admin_empty')}</Label>
            ) : (
              <View style={styles.memberList}>
                {data.members.map((member, index) => {
                  const percentage = Number.isFinite(member.percentage)
                    ? Math.min(100, Math.max(0, member.percentage)) : 0;
                  const avatarTheme =
                    MEMBER_AVATAR_COLORS[index % MEMBER_AVATAR_COLORS.length];
                  const initial =
                    member.name.trim().charAt(0).toUpperCase() || '?';

                  return (
                    <Pressable
                      key={member.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${member.name}, ${member.percentage}%, ${member.completed}/${member.total}`}
                      onPress={() =>
                        setDetail({ label: member.name, member: member.id })
                      }
                      style={({ pressed }) => [
                        styles.memberRow,
                        pressed && styles.tilePressed,
                      ]}
                    >
                      {/* Avatar with initial or image */}
                      <View
                        style={[
                          styles.memberAvatar,
                          { backgroundColor: avatarTheme.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.memberAvatarText,
                            { color: avatarTheme.text },
                          ]}
                        >
                          {initial}
                        </Text>
                      </View>

                      {/* Member Name */}
                      <View style={styles.memberIdentity}>
                        <Text numberOfLines={1} style={[styles.memberName, { color: c.text }]}>
                          {member.name}
                        </Text>
                        <Text style={[styles.memberCounts, { color: c.muted }]}>
                          {member.completed}/{member.total} {t('admin_completed')}
                        </Text>
                      </View>

                      {/* Horizontal Progress Bar */}
                      <View
                        accessible
                        accessibilityRole="progressbar"
                        accessibilityValue={{
                          min: 0,
                          max: 100,
                          now: percentage,
                        }}
                        style={[
                          styles.memberBarTrack,
                          { backgroundColor: c.soft },
                        ]}
                      >
                        <View
                          style={[
                            styles.memberBarFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: c.accent,
                            },
                          ]}
                        />
                      </View>

                      {/* Percentage */}
                      <Text style={[styles.memberPercentage, { color: c.muted }]}>
                        {percentage}%
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>

          {/* ── 3. Chores by Category (Donut Chart & Legend) ──────────────── */}
          <Card>
            <Text style={[styles.sectionHeading, { color: c.text }]}>
              {t('admin_categories')}
            </Text>

            <View style={styles.categoryContainer}>
              {/* Donut Chart */}
              <View
                accessible
                accessibilityLabel={`${t('admin_categories')}: ${
                  data.categories.map((x) => `${x.name} ${x.count}`).join(', ') ||
                  t('admin_empty')
                }`}
                style={styles.donutWrapper}
              >
                <Svg width={140} height={140} viewBox="0 0 140 140">
                  {/* Background Track Circle */}
                  <Circle
                    cx={70}
                    cy={70}
                    r={radius}
                    fill="none"
                    stroke={c.soft}
                    strokeWidth={18}
                  />

                  {/* Colored Category Arcs */}
                  {data.summary.total > 0 &&
                    data.categories.map((category, index) => {
                      const portion =
                        (category.count / data.summary.total) * circumference;
                      const offset = cumulativeOffset;
                      cumulativeOffset += portion;

                      return (
                        <Circle
                          key={category.name}
                          cx={70}
                          cy={70}
                          r={radius}
                          fill="none"
                          stroke={
                            CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                          }
                          strokeWidth={18}
                          strokeDasharray={`${portion} ${
                            circumference - portion
                          }`}
                          strokeDashoffset={-offset}
                          rotation={-90}
                          origin="70, 70"
                          strokeLinecap="butt"
                        />
                      );
                    })}
                </Svg>

                {/* Donut Center: Total Number + Subtitle */}
                <View pointerEvents="none" style={styles.donutCenter}>
                  <Text style={[styles.donutTotalNumber, { color: c.text }]}>
                    {data.summary.total}
                  </Text>
                  <Text style={[styles.donutTotalLabel, { color: c.muted }]}>
                    {t('admin_total')}
                  </Text>
                </View>
              </View>

              {/* Category Legend */}
              <View style={styles.legendContainer}>
                {data.categories.length === 0 ? (
                  <Label muted>{t('admin_empty')}</Label>
                ) : (
                  data.categories.map((category, index) => {
                    const color =
                      CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                    return (
                      <View key={category.name} style={styles.legendRow}>
                        <View
                          style={[
                            styles.legendIndicator,
                            { backgroundColor: color },
                          ]}
                        />
                        <Text
                          numberOfLines={1}
                          style={[styles.legendName, { color: c.text }]}
                        >
                          {category.name}
                        </Text>
                        <Text
                          style={[styles.legendCount, { color: c.text }]}
                        >
                          {category.count}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </Card>

          {/* ── Drill-Down Modal for Tapped Summary / Member ──────────────── */}
          {detail && (
            <Modal
              transparent
              animationType="fade"
              onRequestClose={() => setDetail(null)}
            >
              <View style={styles.modalOverlay}>
                <ScrollView
                  accessibilityViewIsModal
                  style={[
                    styles.modalContent,
                    { backgroundColor: c.card, borderColor: c.border },
                  ]}
                >
                  <Card>
                    <View style={[s.wrap, { justifyContent: 'space-between' }]}>
                      <Label heading>
                        {t('admin_details')} · {detail.label}
                      </Label>
                      <Action
                        label={t('admin_close')}
                        onPress={() => setDetail(null)}
                      />
                    </View>

                    {data.chores.filter(
                      (x) =>
                        (!detail.bucket || x.bucket === detail.bucket) &&
                        (!detail.member || x.assigned_to === detail.member)
                    ).length === 0 && <Label>{t('admin_empty')}</Label>}

                    {data.chores
                      .filter(
                        (x) =>
                          (!detail.bucket || x.bucket === detail.bucket) &&
                          (!detail.member || x.assigned_to === detail.member)
                      )
                      .map((chore) => (
                        <View
                          key={chore.id}
                          style={[
                            styles.choreDetailRow,
                            { borderColor: c.border },
                          ]}
                        >
                          <Label heading>{chore.title}</Label>
                          <Label>
                            {t(`admin_${chore.bucket}` as any)} ·{' '}
                            {data.members.find(
                              (m) => m.id === chore.assigned_to
                            )?.name || t('admin_unassigned')}
                          </Label>
                          <Label muted>
                            {chore.due_date
                              ? new Date(chore.due_date).toLocaleString(
                                  language
                                )
                              : t('admin_no_due')}
                          </Label>
                        </View>
                      ))}
                  </Card>
                </ScrollView>
              </View>
            </Modal>
          )}
        </>
      )}

      {/* ── Completed Chores History Link ───────────────────────────────── */}
      <Action
        label={t('completed_chores_title')}
        onPress={() =>
          router.push({
            pathname: '/admin/completed-chores',
            params: { family_id: household.id },
          })
        }
      />

    </AdminPage>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  percentagePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  percentagePillText: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  summaryTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tilePressed: {
    opacity: 0.75,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  memberList: {
    gap: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  memberIdentity: {
    width: 130,
    flexShrink: 1,
    gap: 3,
  },
  memberCounts: {
    fontSize: 11,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberBarTrack: {
    flex: 1,
    minWidth: 24,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  memberBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  memberPercentage: {
    width: 40,
    flexShrink: 0,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    paddingVertical: 4,
  },
  donutWrapper: {
    width: 140,
    height: 140,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTotalNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  donutTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendContainer: {
    flex: 1,
    minWidth: 140,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  legendCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    padding: 20,
    justifyContent: 'center',
  },
  modalContent: {
    maxHeight: '85%',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  choreDetailRow: {
    gap: 4,
    borderTopWidth: 1,
    paddingTop: 12,
  },
});
