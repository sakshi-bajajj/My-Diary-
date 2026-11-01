import { localDateString } from '@/utils/date';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Task, priorityColors } from '@/components/task-category';
import { DiaryPalette } from '@/constants/theme';
import { useDiaryTheme } from '@/utils/theme-context';

type CategoryData = {
  id: string;
  title: string;
  headerColor: string;
  tasks: Task[];
};

const STORAGE_KEY = 'mydiary_tasks';

const headerColorKey: Record<string, keyof DiaryPalette> = {
  work: 'accentPink',
  study: 'cardBlue',
  personal: 'accentGreen',
  content: 'accentYellow',
  other: 'accentOrange',
};

export default function ProgressScreen() {
  const { colors: DiaryColors } = useDiaryTheme();
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // Reload data every time this tab is opened, so it's always current
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (saved) setCategories(JSON.parse(saved));
        } catch (e) {
          console.log('Failed to load progress data', e);
        }
      };
      load();
    }, [])
  );

  const allTasks = categories.flatMap((c) => c.tasks);
  const totalCount = allTasks.length;
  const doneCount = allTasks.filter((t) => t.done).length;
  const overallPercent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const priorityCounts = {
    high: allTasks.filter((t) => t.priority === 'high').length,
    medium: allTasks.filter((t) => t.priority === 'medium').length,
    low: allTasks.filter((t) => t.priority === 'low').length,
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = localDateString(d);
    const count = allTasks.filter((t) => t.done && (t.completedOn ?? t.date) === key).length;
    return {
      key,
      label: d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 3),
      count,
      isToday: i === 6,
    };
  });
  const maxCount = Math.max(1, ...weekDays.map((d) => d.count));
  const weekTotal = weekDays.reduce((sum, d) => sum + d.count, 0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Your Progress ♥</Text>

          {/* Overall completion card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Completion</Text>
            <Text style={styles.bigNumber}>{overallPercent}%</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${overallPercent}%` }]} />
            </View>
            <Text style={styles.subLabel}>
              {doneCount} of {totalCount} tasks completed
            </Text>
          </View>
                  {/* Weekly chart */}
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.card}>
            <View style={styles.chartRow}>
              {weekDays.map((d) => (
                <View key={d.key} style={styles.chartCol}>
                  <Text style={styles.chartCount}>{d.count > 0 ? d.count : ''}</Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${(d.count / maxCount) * 100}%`,
                          backgroundColor: d.isToday
                            ? DiaryColors.primaryBlue
                            : DiaryColors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, d.isToday && styles.chartLabelToday]}>
                    {d.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.subLabel}>{weekTotal} tasks completed in the last 7 days</Text>
          </View>

                    {/* Priority breakdown */}
          <Text style={styles.sectionTitle}>By Priority</Text>
          {(['high', 'medium', 'low'] as const).map((level) => {
            const levelTasks = allTasks.filter((t) => t.priority === level);
            const levelTotal = levelTasks.length;
            const levelDone = levelTasks.filter((t) => t.done).length;
            const levelPercent = levelTotal === 0 ? 0 : Math.round((levelDone / levelTotal) * 100);

            return (
              <View key={level} style={styles.categoryRow}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.priorityLabelRow}>
                    <View style={[styles.priorityDot, { backgroundColor: priorityColors[level] }]} />
                    <Text style={styles.categoryName}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.categoryCount}>
                    {levelDone}/{levelTotal}
                  </Text>
                </View>
                <View style={styles.progressBarTrackSmall}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${levelPercent}%`, backgroundColor: priorityColors[level] },
                    ]}
                  />
                </View>
              </View>
            );
          })}

          {/* Per-category breakdown */}
          <Text style={styles.sectionTitle}>By Category</Text>
          {categories.map((cat) => {
            const catTotal = cat.tasks.length;
            const catDone = cat.tasks.filter((t) => t.done).length;
            const catPercent = catTotal === 0 ? 0 : Math.round((catDone / catTotal) * 100);

            return (
              <View key={cat.id} style={styles.categoryRow}>
                <View style={styles.categoryHeaderRow}>
                  <Text style={styles.categoryName}>{cat.title}</Text>
                  <Text style={styles.categoryCount}>
                    {catDone}/{catTotal}
                  </Text>
                </View>
                <View style={styles.progressBarTrackSmall}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${catPercent}%`, backgroundColor: DiaryColors[headerColorKey[cat.id] ?? 'primaryBlue'] },
                    ]}
                  />
                </View>
              </View>
            );
          })}

          
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (DiaryColors: DiaryPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: DiaryColors.background },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DiaryColors.textSecondary,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: DiaryColors.primaryBlue,
    marginTop: 4,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: DiaryColors.cardBlue,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBarTrackSmall: {
    height: 8,
    backgroundColor: DiaryColors.cardBlue,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: DiaryColors.primaryBlue,
    borderRadius: 8,
  },
  subLabel: {
    color: DiaryColors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
    marginTop: 8,
    marginBottom: 10,
  },
  categoryRow: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontWeight: '600',
    color: DiaryColors.textPrimary,
  },
  categoryCount: {
    color: DiaryColors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
    priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  priorityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityLabel: {
    flex: 1,
    fontWeight: '600',
    color: DiaryColors.textPrimary,
  },
  priorityCount: {
    color: DiaryColors.textSecondary,
    fontSize: 13,
  },
    chartRow: { flexDirection: 'row', justifyContent: 'space-between', height: 140 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartCount: { fontSize: 11, fontWeight: '700', color: DiaryColors.textPrimary, height: 16 },
  chartTrack: { flex: 1, width: 18, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 6, minHeight: 3 },
  chartLabel: { fontSize: 11, color: DiaryColors.textSecondary, marginTop: 6, fontWeight: '600' },
  chartLabelToday: { color: DiaryColors.primaryBlue, fontWeight: '800' },
});
