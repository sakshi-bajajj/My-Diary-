
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { AddTaskModal, NewTaskInput } from '@/components/add-task-modal';
import { EditTaskModal } from '@/components/edit-task-modal';
import { Task, TaskCategory } from '@/components/task-category';
import { DiaryColors, DiaryPalette } from '@/constants/theme';
import { greetingFor, localDateString, prettyDate } from '@/utils/date';
import { usePerks } from '@/utils/perks';
import { cancelReminder, scheduleReminder } from '@/utils/reminders';
import { useDiaryTheme } from '@/utils/theme-context';
import { FocusTimerModal } from '@/components/focus-timer-modal';

type CategoryData = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  headerColor: string;
  tasks: Task[];
};

const initialData: CategoryData[] = [
  {
    id: 'work',
    icon: 'briefcase',
    title: 'Work',
    headerColor: DiaryColors.accentPink,
    tasks: [
      { id: '1', title: 'Submit job application', time: '10:00 AM', priority: 'high' },
      { id: '2', title: 'Send follow-up email', time: '2:00 PM', priority: 'medium' },
    ],
  },
  {
    id: 'study',
    icon: 'book',
    title: 'Study',
    headerColor: DiaryColors.cardBlue,
    tasks: [
      { id: '3', title: 'Revise Power Systems', time: '9:00 AM', priority: 'low', done: true },
      { id: '4', title: 'Complete ETAP notes', time: '4:00 PM', priority: 'low' },
    ],
  },
  {
    id: 'personal',
    icon: 'home',
    title: 'Personal',
    headerColor: DiaryColors.accentGreen,
    tasks: [
      { id: '5', title: 'Dance practice', time: '6:00 PM', priority: 'low' },
      { id: '6', title: 'Clean room', time: '8:00 PM', priority: 'low' },
    ],
  },
  {
    id: 'content',
    icon: 'videocam',
    title: 'Content',
    headerColor: DiaryColors.accentYellow,
    tasks: [],
  },
  {
    id: 'other',
    icon: 'star',
    title: 'Other',
    headerColor: DiaryColors.accentOrange,
    tasks: [
      { id: '7', title: 'Read 10 pages', time: 'Day', priority: 'medium' },
    ],
  },
];

const STORAGE_KEY = 'mydiary_tasks';
const celebrationMessages = [
  
  'Look at you go! ✨',
  'One step closer 🌷',
  'You did it, Sakshi! ♥',
  'Small steps, big dreams 🌸',
  'Proud of you! 🩵',
  'Nailed it! 💪',
  'Keep glowing ✨',
  'Another win! 🎀',
  'Progress, not perfection ♥',
];

const sparklyMessages = [
  '✨ You are glowing today ✨',
  '🌟 Starlight energy! 🌟',
  '💫 Another star for your sky 💫',
  '✨ Look at you sparkle ✨',
  '🌠 Making wishes come true 🌠',
];

const bannerQuotes = [
  "Believe in yourself, Sakshi! You can do this, and you're going to do great! ♥",
  "Small steps create big dreams 🌷",
  "You're capable, talented and doing better than you think ✨",
  "Good things take time. Keep going ♥",
  "Progress, not perfection 🌸",
  "Today is a fresh start. Let's nail it! 🩵",
  "You've got this, one task at a time 🎀",
  "Be proud of how far you've come ♥",

];

const pickRandom = (list: string[]) => list[Math.floor(Math.random() * list.length)];
// Unfinished tasks from earlier days move to today; undated tasks count as today
function carryOver(cats: CategoryData[]): CategoryData[] {
  const today = localDateString();
  return cats.map((cat) => ({
    ...cat,
    tasks: cat.tasks.map((t) => {
      const d = t.date ?? today;
      return !t.done && d < today ? { ...t, date: today } : { ...t, date: d };
    }),
  }));
}
const STREAK_KEY = 'mydiary_streak';

function todayString() {
  return localDateString();
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateString(d);
}

async function bumpStreak() {
  try {
    const saved = await AsyncStorage.getItem(STREAK_KEY);
    const streak = saved ? JSON.parse(saved) : { count: 0, lastActiveDate: '' };
    const today = todayString();
    const yesterday = yesterdayString();

    if (streak.lastActiveDate === today) return; // already counted today
    const updated =
      streak.lastActiveDate === yesterday
        ? { count: streak.count + 1, lastActiveDate: today }
        : { count: 1, lastActiveDate: today };

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.log('Failed to update streak', e);
  }
}
const headerColorKey: Record<string, keyof DiaryPalette> = {
  work: 'accentPink',
  study: 'cardBlue',
  personal: 'accentGreen',
  content: 'accentYellow',
  other: 'accentOrange',
};

const categoryNotes: Record<string, string> = {
  work: 'Focus ✦',
  study: 'Progress, not perfection ♡',
  personal: 'Good things take time ♡',
  content: 'Create something ✦',
  other: 'You got this ✦',
};

export default function HomeScreen() {
  const { colors: DiaryColors } = useDiaryTheme();
  const perks = usePerks();
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);
  const [categories, setCategories] = useState<CategoryData[]>(initialData);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ categoryId: string; taskId: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState(celebrationMessages[0]);
  const [bannerQuote] = useState(() => pickRandom(bannerQuotes));
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(20)).current;

  const currentToast = useRef<Animated.CompositeAnimation | null>(null);

  const showToast = (message: string, onDone?: () => void) => {
    setToastMessage(message);
    toastOpacity.setValue(0);
    toastTranslate.setValue(20);
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(toastTranslate, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);
    currentToast.current = anim;
    anim.start(({ finished }) => {
      if (finished) onDone?.();
    });
  };

  const celebrate = () => {
    currentToast.current?.stop(); // if you tick tasks quickly, restart cleanly
    bumpStreak();
    showToast(perks.starlight ? '✨ Task done! +1 ⭐ ✨' : '🎉 Task done! +1 ⭐', () =>
      showToast(pickRandom(perks.starlight ? sparklyMessages : celebrationMessages))
    );
  };
  // Load saved tasks when the app opens
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setCategories(carryOver(JSON.parse(saved)));
        }
      } catch (e) {
        console.log('Failed to load tasks', e);
      } finally {
        setLoaded(true);
      }
    };
    loadTasks();
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (!loaded) return; // don't overwrite storage before initial load finishes
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories)).catch((e) =>
      console.log('Failed to save tasks', e)
    );
  }, [categories, loaded]);

    const toggleTask = (categoryId: string, taskId: string) => {
    const task = categories
      .find((c) => c.id === categoryId)
      ?.tasks.find((t) => t.id === taskId);
        if (task && !task.done) {
      celebrate(); 
      if (task.reminderId) cancelReminder(task.reminderId); // no reminder for finished tasks
    } // only when ticking ON, not un-ticking

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : {
              ...cat,
              tasks: cat.tasks.map((t) =>
                   t.id === taskId
                  ? { ...t, done: !t.done, completedOn: !t.done ? localDateString() : undefined }
                  : t
              ),
            }
      )
    );
  };
     const editingTask = editing
    ? categories.find((c) => c.id === editing.categoryId)?.tasks.find((t) => t.id === editing.taskId) ?? null
    : null;

  const updateTask = (updated: Task) => {
    if (!editing) return;
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== editing.categoryId
          ? cat
          : { ...cat, tasks: cat.tasks.map((t) => (t.id === updated.id ? updated : t)) }
      )
    );
  };

  const deleteTask = () => {
    if (!editing) return;
    if (editingTask?.reminderId) cancelReminder(editingTask.reminderId);
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== editing.categoryId
          ? cat
          : { ...cat, tasks: cat.tasks.filter((t) => t.id !== editing.taskId) }
      )
    );
  };

    const setReminderId = (categoryId: string, taskId: string, reminderId?: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : { ...cat, tasks: cat.tasks.map((t) => (t.id === taskId ? { ...t, reminderId } : t)) }
      )
    );
  };

  const toggleReminder = async (categoryId: string, taskId: string) => {
    const task = categories.find((c) => c.id === categoryId)?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.reminderId) {
      await cancelReminder(task.reminderId);
      setReminderId(categoryId, taskId, undefined);
      return;
    }

    const result = await scheduleReminder(task.title, task.date ?? localDateString(), task.time);
    if (result.status === 'ok') {
      setReminderId(categoryId, taskId, result.id);
    } else if (result.status === 'no-permission') {
      Alert.alert('Notifications are off', 'Allow notifications for Expo Go in your iPhone Settings.');
    } else if (result.status === 'no-time') {
      Alert.alert('No time set', 'This task has no time, so there is nothing to remind you at.');
    } else {
      Alert.alert('Time already passed', 'Pick a task time that is still ahead.');
    }
  };

    const addTask = (newTask: NewTaskInput) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== newTask.categoryId
          ? cat
          : {
              ...cat,
              tasks: [
                ...cat.tasks,
                {
                  id: Date.now().toString(),
                  title: newTask.title,
                  time: newTask.time,
                  priority: newTask.priority,
                  date: newTask.date,
                },
              ],
            }
      )
    );
  };
    const q = query.trim().toLowerCase();
  const searching = searchOpen && q.length > 0;
  const results = categories.flatMap((cat) =>
    cat.tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes ?? '').toLowerCase().includes(q) ||
          (t.subtasks ?? []).some((s) => s.title.toLowerCase().includes(q))
      )
      .map((t) => ({ task: t, categoryId: cat.id, categoryTitle: cat.title }))
  );

  const today = localDateString();
  const visibleCategories = categories.map((cat) => ({
    ...cat,
    tasks: cat.tasks.filter((t) => (t.date ?? today) === today),
  }));
  const allTasks = visibleCategories.flatMap((c) => c.tasks);
  const totalCount = allTasks.length;
  const doneCount = allTasks.filter((t) => t.done).length;
  const progressPercent = totalCount === 0 ? 0 : (doneCount / totalCount) * 100;

  const flowerCount = totalCount;
  const filledFlowers = doneCount;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{greetingFor()}, 🧸</Text>
              <Text style={styles.name}>Sakshi! ♥</Text>
            </View>
            <View style={styles.iconRow}>
                <TouchableOpacity onPress={() => setTimerOpen(true)}>
                <Ionicons name="timer-outline" size={22} color={DiaryColors.darkBlue} />
              </TouchableOpacity>
             <TouchableOpacity
                onPress={() => {
                  setSearchOpen(!searchOpen);
                  setQuery('');
                }}
              >
                <Ionicons
                  name={searchOpen ? 'close' : 'search'}
                  size={22}
                  color={DiaryColors.darkBlue}
                />
              </TouchableOpacity>
              <Ionicons name="notifications-outline" size={22} color={DiaryColors.darkBlue} />
              <Ionicons name="settings-outline" size={22} color={DiaryColors.darkBlue} />
            </View>
          </View>

          <View style={styles.badge}>
             <Text style={styles.badgeText}>Let's nail this day! ♥{perks.tulip ? ' 🌷' : ''}</Text>
          </View>

          <Text style={styles.subText}>
            You're capable, talented and doing better than you think. ♡
          </Text>
                    {!searching && (
            <View style={styles.heroRow}>
              <Text style={styles.heroEmoji}>🐱📚🌷</Text>
              <View style={styles.heroNote}>
                <View style={styles.tape} />
                <Text style={styles.heroNoteText}>Small steps create big dreams ♥</Text>
              </View>
            </View>
          )}
          <View style={styles.dateRow}>
            <Text style={styles.inlineEmoji}>🌿</Text>
            <Ionicons name="calendar-outline" size={18} color={DiaryColors.darkBlue} />
             <Text style={styles.dateText}>{prettyDate()}</Text>
             {perks.tulip && <Text style={styles.inlineEmoji}>🌷 🌷 🌷</Text>}
          </View>
                  {searchOpen && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks, notes, subtasks..."
              placeholderTextColor={DiaryColors.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
          )}

          {!searching && (
            <>
              <View style={styles.progressCard}>
                <View style={[styles.tape, { left: 24 }]} />
                <View style={styles.progressTitleRow}>
                  <Text style={styles.progressTitle}>Today's Progress ♥</Text>
                  <Text style={styles.inlineEmoji}>🌟</Text>
                </View>

                <View style={styles.progressBarRow}>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                  <Text style={styles.progressCount}>{doneCount} / {totalCount}</Text>
                </View>
                <Text style={styles.progressLabel}>completed</Text>

                <View style={styles.flowerRow}>
                  {Array.from({ length: flowerCount }).map((_, i) => (
                    <Text key={i} style={{ fontSize: 22 }}>
                      {i < filledFlowers ? '🌸' : '🤍'}
                    </Text>
                  ))}
                </View>

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#E4626F' }]} />
                    <Text style={styles.legendText}>High</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F0A860' }]} />
                    <Text style={styles.legendText}>Medium</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#6FBF8B' }]} />
                    <Text style={styles.legendText}>Low</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stickyNote}>
                <Text style={styles.stickyNoteText}>You're doing amazing! ♥</Text>
              </View>

              <View style={styles.quoteBanner}>
                <Ionicons name="sunny" size={20} color="#F0B429" />
                <Text style={styles.quoteText}>{bannerQuote}</Text>
              </View>
            </>
          )}        

          {searching ? (
            results.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No tasks found 🌷</Text>
              </View>
            ) : (
              results.map(({ task, categoryId, categoryTitle }) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.resultCard}
                  onPress={() => setEditing({ categoryId, taskId: task.id })}
                >
                  <Text style={[styles.resultTitle, task.done && { color: DiaryColors.textSecondary }]}>
                    {task.done ? '✓ ' : ''}{task.title}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {categoryTitle} • {task.date ?? today} • {task.time}
                  </Text>
                </TouchableOpacity>
              ))
            )
          ) : (
            visibleCategories.map((cat) => (
              <TaskCategory
                key={cat.id}
                icon={cat.icon}
                title={cat.title}
                count={cat.tasks.length}
                headerColor={DiaryColors[headerColorKey[cat.id] ?? 'cardBlue']}
                note={categoryNotes[cat.id]}
                tasks={cat.tasks}
                onToggleTask={(taskId) => toggleTask(cat.id, taskId)}
                onPressTask={(taskId) => setEditing({ categoryId: cat.id, taskId })}
                onToggleReminder={(taskId) => toggleReminder(cat.id, taskId)}
              />
            ))
          )}
        </ScrollView>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { opacity: toastOpacity, transform: [{ translateY: toastTranslate }] },
          ]}
        >
            <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>

        <View style={styles.cornerNote}>
          <Text style={styles.cornerNoteText}>you got this 🌸</Text>
        </View>

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
        <FocusTimerModal visible={timerOpen} onClose={() => setTimerOpen(false)} />
         <EditTaskModal
          visible={editing !== null}
          task={editingTask}
          onClose={() => setEditing(null)}
          onSave={updateTask}
          onDelete={deleteTask}
        />

        <AddTaskModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={addTask}
          categories={categories.map((c) => ({ id: c.id, title: c.title }))}
        />
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (DiaryColors: DiaryPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: DiaryColors.background },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '700', color: DiaryColors.textPrimary },
  name: { fontSize: 26, fontWeight: '700', color: DiaryColors.textPrimary },
  iconRow: { flexDirection: 'row', gap: 16, paddingTop: 8 },
  badge: { backgroundColor: DiaryColors.accentYellow, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 10 },
  badgeText: { color: DiaryColors.textPrimary, fontWeight: '600' },
  subText: { color: DiaryColors.textSecondary, marginTop: 10, fontSize: 14, lineHeight: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  dateText: { color: DiaryColors.textPrimary, fontWeight: '600', fontSize: 15 },
  progressCard: { backgroundColor: DiaryColors.cardBackground, borderRadius: 20, padding: 18, marginTop: 20, borderWidth: 1, borderColor: DiaryColors.border },
  progressTitle: { fontSize: 17, fontWeight: '700', color: DiaryColors.textPrimary, marginBottom: 12 },
  progressBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBarTrack: { flex: 1, height: 10, backgroundColor: DiaryColors.cardBlue, borderRadius: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: DiaryColors.primaryBlue, borderRadius: 8 },
  progressCount: { fontWeight: '700', color: DiaryColors.textPrimary },
  progressLabel: { color: DiaryColors.textSecondary, fontSize: 13, marginTop: 4 },
  flowerRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  stickyNote: { backgroundColor: DiaryColors.accentYellow, borderRadius: 14, padding: 14, marginTop: 14, alignSelf: 'flex-end', maxWidth: '55%', transform: [{ rotate: '3deg' }] },
  stickyNoteText: { color: DiaryColors.textPrimary, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  quoteBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: DiaryColors.accentYellow, borderRadius: 16, padding: 14, marginTop: 14 },
  quoteText: { flex: 1, color: DiaryColors.textPrimary, fontWeight: '600', fontSize: 13, lineHeight: 18 },
  sticker: { position: 'absolute', zIndex: 1 },
    heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  heroEmoji: { fontSize: 44 },
  heroNote: {
    backgroundColor: DiaryColors.accentYellow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '55%',
    transform: [{ rotate: '3deg' }],
  },
  heroNoteText: { fontSize: 13, fontWeight: '700', color: DiaryColors.textPrimary, textAlign: 'center' },
  tape: {
    position: 'absolute',
    top: -9,
    alignSelf: 'center',
    width: 46,
    height: 15,
    borderRadius: 3,
    backgroundColor: DiaryColors.primaryBlue,
    opacity: 0.45,
    transform: [{ rotate: '-4deg' }],
  },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 14, marginLeft: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: DiaryColors.textSecondary, fontWeight: '600' },
    inlineEmoji: {
    fontSize: 14,
  },
  progressTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
    cornerNote: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    backgroundColor: DiaryColors.accentYellow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cornerNoteText: {
    fontSize: 11,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
    searchInput: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: DiaryColors.textPrimary,
    borderWidth: 1,
    borderColor: DiaryColors.border,
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  resultTitle: { fontSize: 14, fontWeight: '600', color: DiaryColors.textPrimary },
  resultMeta: { fontSize: 12, color: DiaryColors.textSecondary, marginTop: 3 },
  noResults: { alignItems: 'center', padding: 24 },
  noResultsText: { color: DiaryColors.textSecondary, fontWeight: '600' },
  toast: { position: 'absolute', bottom: 160, alignSelf: 'center', backgroundColor: DiaryColors.darkBlue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: DiaryColors.primaryBlue, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
});


