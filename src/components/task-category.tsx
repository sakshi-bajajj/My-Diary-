import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DiaryPalette } from '@/constants/theme';
import { useDiaryTheme } from '@/utils/theme-context';
import { useMemo } from 'react';

export type Priority = 'high' | 'medium' | 'low';

export const priorityColors: Record<Priority, string> = {
  high: '#E4626F',
  medium: '#F0A860',
  low: '#6FBF8B',
};

export type SubTask = {
  id: string;
  title: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  time: string;
  priority: Priority;
  done?: boolean;
  date?: string; // YYYY-MM-DD, defaults to "today" if missing
  notes?: string;
  subtasks?: SubTask[];
  reminderId?: string;
  completedOn?: string;

};

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  headerColor: string;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onPressTask: (taskId: string) => void;
  onToggleReminder: (taskId: string) => void;
  note?: string;
};

export function TaskCategory({ icon, title, count,note,headerColor, tasks, onToggleTask, onPressTask, onToggleReminder }: Props) {
  const { colors: DiaryColors } = useDiaryTheme();
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);

  return (
    <View style={styles.card}>
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <Ionicons name={icon} size={18} color={DiaryColors.darkBlue} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.headerNote}>{note ?? '✦'}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>

      {tasks.map((task) => (
        <View key={task.id} style={styles.taskRow}>
          <TouchableOpacity
            style={[styles.checkbox, task.done && styles.checkboxDone]}
            onPress={() => onToggleTask(task.id)}
          >
            {task.done && <Ionicons name="checkmark" size={14} color="#fff" />}
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1 }} onPress={() => onPressTask(task.id)}>
            <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>
              {task.title}
            </Text>
            {((task.subtasks?.length ?? 0) > 0 || !!task.notes) && (
              <Text style={styles.taskMeta}>
                {(task.subtasks?.length ?? 0) > 0
                  ? `☑ ${task.subtasks!.filter((s) => s.done).length}/${task.subtasks!.length}  `
                  : ''}
                {task.notes ? '📝' : ''}
              </Text>
            )}
          </TouchableOpacity>

          <View style={[styles.dot, { backgroundColor: priorityColors[task.priority] }]} />
          <Text style={styles.taskTime}>{task.time}</Text>
           <TouchableOpacity onPress={() => onToggleReminder(task.id)} hitSlop={10}>
            <Ionicons
              name={task.reminderId && !task.done ? 'notifications' : 'notifications-outline'}
              size={16}
              color={task.reminderId && !task.done ? DiaryColors.primaryBlue : DiaryColors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (DiaryColors: DiaryPalette) => StyleSheet.create({
  card: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 16,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
    flex: 1,
  },
  headerNote: { fontSize: 11, fontWeight: '600', fontStyle: 'italic', color: DiaryColors.textSecondary },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: DiaryColors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DiaryColors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: DiaryColors.primaryBlue,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    color: DiaryColors.textPrimary,
  },
  taskTitleDone: {
    
    color: DiaryColors.textSecondary,
  },

    taskMeta: {
    fontSize: 11,
    color: DiaryColors.textSecondary,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskTime: {
    fontSize: 12,
    color: DiaryColors.textSecondary,
  },
});



