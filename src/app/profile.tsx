import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Task } from '@/components/task-category';
import { DiaryPalette, ThemeKey, themes } from '@/constants/theme';
import { useDiaryTheme } from '@/utils/theme-context';

type CategoryData = {
  id: string;
  title: string;
  tasks: Task[];
};

const TASKS_KEY = 'mydiary_tasks';
const STREAK_KEY = 'mydiary_streak';
const PROGRESS_KEY = 'mydiary_tiers_cleared';

export default function ProfileScreen() {
  const { colors: DiaryColors, themeKey, setThemeKey } = useDiaryTheme();
  const [tiersCleared, setTiersCleared] = useState(0);
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [notificationsOn, setNotificationsOn] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const savedTasks = await AsyncStorage.getItem(TASKS_KEY);
          if (savedTasks) setCategories(JSON.parse(savedTasks));

          const savedStreak = await AsyncStorage.getItem(STREAK_KEY);
          if (savedStreak) setStreakCount(JSON.parse(savedStreak).count ?? 0);
          
          const savedTiers = await AsyncStorage.getItem(PROGRESS_KEY);
          setTiersCleared(savedTiers ? parseInt(savedTiers, 10) : 0);
        } catch (e) {
          console.log('Failed to load profile data', e);
        }
      };
      load();
    }, [])
  );

  const allTasks = categories.flatMap((c) => c.tasks);
  const totalStars = allTasks.filter((t) => t.done).length;
  const totalTasks = allTasks.length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
             {tiersCleared >= 9 && <Text style={styles.crown}>👑</Text>}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>S</Text>
            </View>
            <Text style={styles.name}>Sakshi ♥</Text>
            {tiersCleared >= 9 && <Text style={styles.queenTitle}>Diary Queen</Text>}
            <Text style={styles.subtitle}>Keeping it together, one task at a time</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Total tasks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalStars}</Text>
              <Text style={styles.statLabel}>Stars</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{streakCount}</Text>
              <Text style={styles.statLabel}>Day streak</Text>
            </View>
          </View>
                    {tiersCleared >= 12 && (
            <TouchableOpacity
              style={styles.secretCard}
              onPress={() =>
                Alert.alert(
                  '💌 A secret message',
                  'Sakshi, you showed up again and again, and nobody handed you this. You built it, one task at a time. Proud of you. 🩵'
                )
              }
            >
              <Text style={styles.secretText}>💌 Tap to open your secret message</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionTitle}>Settings</Text>
                    <Text style={styles.sectionTitle}>Theme</Text>
          {(Object.keys(themes) as ThemeKey[]).map((key) => {
            const t = themes[key];
            const unlocked = tiersCleared >= t.needTiers;
            const selected = themeKey === key;

            return (
              <TouchableOpacity
                key={key}
                style={[styles.themeCard, selected && styles.themeCardSelected]}
                onPress={() => {
                  if (unlocked) {
                    setThemeKey(key);
                  } else {
                    Alert.alert(
                      'Locked 🔒',
                      `Clear ${t.needTiers} tiers on the Rewards path to unlock ${t.name}. You have cleared ${tiersCleared}.`
                    );
                  }
                }}
              >
                <Text style={styles.themeEmoji}>{unlocked ? t.emoji : '🔒'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{t.name}</Text>
                  <Text style={styles.settingValue}>
                    {!unlocked
                      ? `Clear ${t.needTiers} tiers to unlock`
                      : selected
                      ? 'In use'
                      : 'Tap to use'}
                  </Text>
                </View>
                <View style={styles.swatchRow}>
                  <View style={[styles.swatch, { backgroundColor: t.colors.background }]} />
                  <View style={[styles.swatch, { backgroundColor: t.colors.primaryBlue }]} />
                  <View style={[styles.swatch, { backgroundColor: t.colors.accentPink }]} />
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingValue}>Blue Diary (default)</Text>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (DiaryColors: DiaryPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: DiaryColors.background },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DiaryColors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: DiaryColors.textPrimary },
  subtitle: { fontSize: 13, color: DiaryColors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statBox: {
    flex: 1,
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: DiaryColors.textPrimary },
  statLabel: { fontSize: 11, color: DiaryColors.textSecondary, marginTop: 4, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
    marginTop: 24,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  settingLabel: { fontSize: 14, fontWeight: '600', color: DiaryColors.textPrimary },
  settingValue: { fontSize: 13, color: DiaryColors.textSecondary },
    crown: { fontSize: 28, marginBottom: -6 },
  queenTitle: { fontSize: 13, fontWeight: '800', color: DiaryColors.primaryBlue, marginTop: 2 },
  secretCard: {
    backgroundColor: DiaryColors.accentYellow,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  secretText: { fontSize: 14, fontWeight: '700', color: DiaryColors.textPrimary },
    themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  themeCardSelected: { borderColor: DiaryColors.primaryBlue, borderWidth: 2 },
  themeEmoji: { fontSize: 26 },
  swatchRow: { flexDirection: 'row', gap: 4 },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: DiaryColors.border },
});



