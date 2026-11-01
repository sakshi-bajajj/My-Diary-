import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Task } from '@/components/task-category';
import { DiaryPalette } from '@/constants/theme';
import { localDateString } from '@/utils/date';
import { useDiaryTheme } from '@/utils/theme-context';

type CategoryData = { id: string; title: string; tasks: Task[] };
type Stats = { total: number; streak: number; high: number };
type Goal = { label: string; key: keyof Stats; target: number };
type Tier = { name: string; medal: string; bonusXp: number; goals: Goal[] };

const TASKS_KEY = 'mydiary_tasks';
const STREAK_KEY = 'mydiary_streak';
const PROGRESS_KEY = 'mydiary_tiers_cleared';

const XP_PER_TASK = 10;
const XP_PER_HIGH_TASK = 20;
const XP_PER_LEVEL = 200;

// Change any target below to make it harder or easier
const stages: {
  emoji: string;
  name: string;
  reward: string;
  tiers: Tier[];
}[] = [
  {
    emoji: '🌷',
    name: 'Tulip',
    reward: '🌸 Pink Blossom theme + tulip sticker pack',
    tiers: [
      { name: 'Bronze', medal: '🥉', bonusXp: 25, goals: [{ label: 'Tasks done', key: 'total', target: 5 }] },
      { name: 'Silver', medal: '🥈', bonusXp: 50, goals: [{ label: 'Tasks done', key: 'total', target: 15 }] },
      { name: 'Gold', medal: '🥇', bonusXp: 100, goals: [{ label: 'Tasks done', key: 'total', target: 30 }] },
    ],
  },
  {
    emoji: '🌟',
    name: 'Starlight',
    reward: '💜 Lavender Dream theme + sparkly popups',
    tiers: [
      { name: 'Bronze', medal: '🥉', bonusXp: 25, goals: [{ label: 'Day streak', key: 'streak', target: 3 }] },
      { name: 'Silver', medal: '🥈', bonusXp: 50, goals: [{ label: 'Day streak', key: 'streak', target: 7 }] },
      { name: 'Gold', medal: '🥇', bonusXp: 100, goals: [{ label: 'Day streak', key: 'streak', target: 14 }] },
    ],
  },
  {
    emoji: '👑',
    name: 'Diary Queen',
    reward: '👑 Crown on Profile + "Diary Queen" title',
    tiers: [
      { name: 'Bronze', medal: '🥉', bonusXp: 25, goals: [{ label: 'High-priority done', key: 'high', target: 5 }] },
      { name: 'Silver', medal: '🥈', bonusXp: 50, goals: [{ label: 'High-priority done', key: 'high', target: 15 }] },
      { name: 'Gold', medal: '🥇', bonusXp: 100, goals: [{ label: 'High-priority done', key: 'high', target: 30 }] },
    ],
  },
  {
    emoji: '💎',
    name: 'Diamond',
    reward: '🌙 Midnight theme + a secret message 💌',
    tiers: [
      { name: 'Bronze', medal: '🥉', bonusXp: 25, goals: [{ label: 'Tasks done', key: 'total', target: 75 }] },
      { name: 'Silver', medal: '🥈', bonusXp: 50, goals: [{ label: 'Day streak', key: 'streak', target: 21 }] },
      {
        name: 'Gold',
        medal: '🥇',
        bonusXp: 100,
        goals: [
          { label: 'Tasks done', key: 'total', target: 150 },
          { label: 'Day streak', key: 'streak', target: 30 },
        ],
      },
    ],
  },
];

const TIERS_PER_STAGE = 3;
const TOTAL_TIERS = stages.length * TIERS_PER_STAGE;

const tierAt = (index: number) => stages[Math.floor(index / TIERS_PER_STAGE)].tiers[index % TIERS_PER_STAGE];
const tierMet = (index: number, stats: Stats) => tierAt(index).goals.every((g) => stats[g.key] >= g.target);

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateString(d);
}

export default function RewardsScreen() {
  const { colors: DiaryColors } = useDiaryTheme();
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);
  const [stats, setStats] = useState<Stats>({ total: 0, streak: 0, high: 0 });
  const [cleared, setCleared] = useState(0); // number of tiers cleared (0 to 12)
  const [xp, setXp] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const savedTasks = await AsyncStorage.getItem(TASKS_KEY);
          const cats: CategoryData[] = savedTasks ? JSON.parse(savedTasks) : [];
          const done = cats.flatMap((c) => c.tasks).filter((t) => t.done);
          const highDone = done.filter((t) => t.priority === 'high').length;

          const savedStreak = await AsyncStorage.getItem(STREAK_KEY);
          const streakData = savedStreak ? JSON.parse(savedStreak) : { count: 0, lastActiveDate: '' };
          const alive =
            streakData.lastActiveDate === localDateString() ||
            streakData.lastActiveDate === yesterdayString();

          const newStats: Stats = {
            total: done.length,
            streak: alive ? streakData.count : 0,
            high: highDone,
          };

          const saved = await AsyncStorage.getItem(PROGRESS_KEY);
          const before = saved ? parseInt(saved, 10) : 0;
          let now = before;
          while (now < TOTAL_TIERS && tierMet(now, newStats)) now++;

          if (now !== before) {
            await AsyncStorage.setItem(PROGRESS_KEY, String(now));

            const lines: string[] = [];
            for (let i = before; i < now; i++) {
              const stage = stages[Math.floor(i / TIERS_PER_STAGE)];
              const tier = tierAt(i);
              lines.push(`${tier.medal} ${stage.name} ${tier.name} cleared! +${tier.bonusXp} XP`);
              if (i % TIERS_PER_STAGE === TIERS_PER_STAGE - 1) {
                lines.push(`${stage.emoji} ${stage.name} badge unlocked!\nReward: ${stage.reward}`);
              }
            }
            Alert.alert('Challenge cleared! 🎉', lines.join('\n\n'));
          }

          let bonus = 0;
          for (let i = 0; i < now; i++) bonus += tierAt(i).bonusXp;
          const taskXp = (done.length - highDone) * XP_PER_TASK + highDone * XP_PER_HIGH_TASK;

                    const savedFocus = await AsyncStorage.getItem('mydiary_focus_xp');
          const focusXp = savedFocus ? parseInt(savedFocus, 10) : 0;

          setStats(newStats);
          setCleared(now);
          setXp(taskXp + bonus + focusXp);
        } catch (e) {
          console.log('Failed to load rewards data', e);
        }
      };
      load();
    }, [])
  );

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const currentStageIndex = Math.floor(cleared / TIERS_PER_STAGE);
  const allDone = cleared >= TOTAL_TIERS;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Rewards ♥</Text>

          <View style={styles.xpCard}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLevel}>Level {level}</Text>
              <Text style={styles.xpCount}>
                {xpInLevel}/{XP_PER_LEVEL} XP
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }]} />
            </View>
            <Text style={styles.xpHint}>
              +{XP_PER_TASK} XP per task, +{XP_PER_HIGH_TASK} XP for high priority
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.statCard, { backgroundColor: DiaryColors.accentYellow }]}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Tasks done</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: DiaryColors.accentPink }]}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statNumber}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Day streak</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Your Path 🗺️</Text>

          {stages.map((stage, si) => {
            const stageState = si < currentStageIndex || allDone ? 'done' : si === currentStageIndex ? 'current' : 'locked';

            return (
              <View key={stage.name}>
                {si > 0 && <Text style={styles.connector}>┊</Text>}
                <View
                  style={[
                    styles.stageCard,
                    stageState === 'done' && styles.stageDone,
                    stageState === 'locked' && styles.stageLocked,
                  ]}
                >
                  <View style={styles.stageHeader}>
                    <Text style={styles.stageEmoji}>{stageState === 'locked' ? '🔒' : stage.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stageTitle}>
                        Stage {si + 1}: {stageState === 'locked' ? '???' : stage.name}
                      </Text>
                      <Text style={styles.stageReward}>
                        {stageState === 'locked' ? '🎁 Hidden reward' : `🎁 ${stage.reward}`}
                      </Text>
                      {stageState === 'done' && <Text style={styles.unlocked}>Unlocked ✓</Text>}
                    </View>
                  </View>

                  {stageState !== 'locked' &&
                    stage.tiers.map((tier, ti) => {
                      const index = si * TIERS_PER_STAGE + ti;
                      const tierDone = index < cleared;
                      const isCurrent = index === cleared;

                      return (
                        <View key={tier.name} style={styles.tierBlock}>
                          <Text style={[styles.tierTitle, !tierDone && !isCurrent && styles.tierDim]}>
                            {tier.medal} {tier.name} {tierDone ? '✓' : `(+${tier.bonusXp} XP)`}
                          </Text>

                          {isCurrent &&
                            tier.goals.map((g) => {
                              const value = Math.min(stats[g.key], g.target);
                              return (
                                <View key={g.label} style={styles.goalBlock}>
                                  <View style={styles.goalRow}>
                                    <Text style={styles.goalLabel}>{g.label}</Text>
                                    <Text style={styles.goalCount}>
                                      {value}/{g.target}
                                    </Text>
                                  </View>
                                  <View style={styles.track}>
                                    <View style={[styles.fill, { width: `${(value / g.target) * 100}%` }]} />
                                  </View>
                                </View>
                              );
                            })}

                          {!tierDone && !isCurrent && (
                            <Text style={styles.goalLabelDim}>
                              {tier.goals.map((g) => `${g.label}: ${g.target}`).join('  •  ')}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                </View>
              </View>
            );
          })}

          {allDone && <Text style={styles.allDone}>You cleared the whole path. Legend! ✨</Text>}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (DiaryColors: DiaryPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: DiaryColors.background },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: DiaryColors.textPrimary, marginBottom: 16 },
  xpCard: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLevel: { fontSize: 20, fontWeight: '800', color: DiaryColors.textPrimary },
  xpCount: { fontSize: 13, fontWeight: '700', color: DiaryColors.textSecondary },
  xpHint: { fontSize: 11, color: DiaryColors.textSecondary, marginTop: 8 },
  track: {
    height: 8,
    backgroundColor: DiaryColors.cardBlue,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: { height: '100%', backgroundColor: DiaryColors.primaryBlue, borderRadius: 8 },
  row: { flexDirection: 'row', gap: 14 },
  statCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center' },
  statEmoji: { fontSize: 28 },
  statNumber: { fontSize: 26, fontWeight: '800', color: DiaryColors.textPrimary, marginTop: 4 },
  statLabel: { fontSize: 12, color: DiaryColors.textSecondary, fontWeight: '600', marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  connector: { textAlign: 'center', color: DiaryColors.textSecondary, fontSize: 16, marginVertical: 2 },
  stageCard: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  stageDone: { backgroundColor: DiaryColors.accentYellow },
  stageLocked: { backgroundColor: DiaryColors.cardBlue, opacity: 0.6 },
  stageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stageEmoji: { fontSize: 32 },
  stageTitle: { fontSize: 15, fontWeight: '700', color: DiaryColors.textPrimary },
  stageReward: { fontSize: 12, color: DiaryColors.textSecondary, marginTop: 2, fontWeight: '600' },
  unlocked: { fontSize: 12, color: DiaryColors.primaryBlue, fontWeight: '800', marginTop: 2 },
  tierBlock: { marginTop: 14 },
  tierTitle: { fontSize: 13, fontWeight: '700', color: DiaryColors.textPrimary },
  tierDim: { color: DiaryColors.textSecondary },
  goalBlock: { marginTop: 8 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalLabel: { fontSize: 13, color: DiaryColors.textPrimary, fontWeight: '600' },
  goalLabelDim: { fontSize: 12, color: DiaryColors.textSecondary, marginTop: 2 },
  goalCount: { fontSize: 13, color: DiaryColors.textSecondary, fontWeight: '700' },
  allDone: { textAlign: 'center', color: DiaryColors.textPrimary, fontWeight: '700', marginVertical: 16 },
});


