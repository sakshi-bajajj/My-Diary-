import { localDateString } from '@/utils/date';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
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

function todayString() {
    return localDateString();
}

export default function CalendarScreen() {
  const { colors: DiaryColors, themeKey } = useDiaryTheme();
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayString());

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (saved) setCategories(JSON.parse(saved));
        } catch (e) {
          console.log('Failed to load calendar data', e);
        }
      };
      load();
    }, [])
  );

  const allTasks = categories.flatMap((c) =>
    c.tasks.map((t) => ({ ...t, categoryTitle: c.title, categoryColor: c.headerColor }))
  );

  // Tasks with no date are treated as "today"
  const tasksForDate = (date: string) =>
    allTasks.filter((t) => (t.date ?? todayString()) === date);

  // Mark every date that has at least one task
  const markedDates: Record<string, any> = {};
  allTasks.forEach((t) => {
    const d = t.date ?? todayString();
    markedDates[d] = { marked: true, dotColor: DiaryColors.primaryBlue };
  });
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: DiaryColors.primaryBlue,
  };

  const dayTasks = tasksForDate(selectedDate);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Calendar ♥</Text>
          <View style={styles.calendarCard}>
            <Calendar
              key={themeKey}
              onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                backgroundColor: DiaryColors.cardBackground,
                calendarBackground: DiaryColors.cardBackground,
                textSectionTitleColor: DiaryColors.textSecondary,
                selectedDayBackgroundColor: DiaryColors.primaryBlue,
                selectedDayTextColor: '#ffffff',
                todayTextColor: DiaryColors.primaryBlue,
                dayTextColor: DiaryColors.textPrimary,
                dotColor: DiaryColors.primaryBlue,
                arrowColor: DiaryColors.primaryBlue,
                monthTextColor: DiaryColors.textPrimary,
                textDayFontWeight: '600',
                textMonthFontWeight: '700',
              }}
              style={styles.calendar}
            />
          </View>

          <Text style={styles.sectionTitle}>
            Tasks on {selectedDate === todayString() ? 'Today' : selectedDate}
          </Text>

          {dayTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tasks on this day 🌷</Text>
            </View>
          ) : (
            dayTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View
                  style={[styles.priorityDot, { backgroundColor: priorityColors[task.priority] }]}
                />
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskMeta}>
                    {task.categoryTitle} • {task.time}
                  </Text>
                </View>
                {task.done && <Text style={styles.doneCheck}>✓</Text>}
              </View>
            ))
          )}
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
  calendarCard: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: DiaryColors.border,
    overflow: 'hidden',
  },
  calendar: {
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  emptyText: {
    color: DiaryColors.textSecondary,
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: DiaryColors.border,
    gap: 12,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskInfo: { flex: 1 },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DiaryColors.textPrimary,
  },
  taskTitleDone: {
    color: DiaryColors.textSecondary,
  },
  taskMeta: {
    fontSize: 12,
    color: DiaryColors.textSecondary,
    marginTop: 2,
  },
  doneCheck: {
    color: DiaryColors.primaryBlue,
    fontWeight: '700',
    fontSize: 16,
  },
});



