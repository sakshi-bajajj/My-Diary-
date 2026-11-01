import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Priority, SubTask, Task } from '@/components/task-category';
import { DiaryPalette } from '@/constants/theme';
import { useDiaryTheme } from '@/utils/theme-context';

type Props = {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (updated: Task) => void;
  onDelete: () => void;
};

const priorityOptions: { label: string; value: Priority; color: string }[] = [
  { label: 'High', value: 'high', color: '#E4626F' },
  { label: 'Medium', value: 'medium', color: '#F0A860' },
  { label: 'Low', value: 'low', color: '#6FBF8B' },
];
export function EditTaskModal({ visible, task, onClose, onSave, onDelete }: Props) {
  const { colors: DiaryColors } = useDiaryTheme();
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Load the selected task into the form whenever a different task is opened
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? '');
      setPriority(task.priority);
      setSubtasks(task.subtasks ?? []);
      setNewSubtask('');
    }
  }, [task?.id, visible]);

  if (!task) return null;

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newSubtask.trim(), done: false },
    ]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) =>
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));

  const removeSubtask = (id: string) =>
    setSubtasks((prev) => prev.filter((s) => s.id !== id));

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ ...task, title: title.trim(), notes: notes.trim(), priority, subtasks });
    onClose();
  };

  const confirmDelete = () => {
    Alert.alert('Delete task?', `"${task.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Edit Task ♥</Text>

          <Text style={styles.label}>Task name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={DiaryColors.textSecondary}
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.row}>
            {priorityOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  { borderColor: opt.color },
                  priority === opt.value && { backgroundColor: opt.color },
                ]}
                onPress={() => setPriority(opt.value)}
              >
                <Text style={[styles.chipText, priority === opt.value && { color: '#fff' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Subtasks</Text>
          {subtasks.map((s) => (
            <View key={s.id} style={styles.subRow}>
              <TouchableOpacity
                style={[styles.subBox, s.done && styles.subBoxDone]}
                onPress={() => toggleSubtask(s.id)}
              >
                {s.done && <Text style={styles.subCheck}>✓</Text>}
              </TouchableOpacity>
              <Text style={[styles.subText, s.done && styles.subTextDone]}>{s.title}</Text>
              <TouchableOpacity onPress={() => removeSubtask(s.id)}>
                <Text style={styles.subRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.subRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Add a subtask"
              placeholderTextColor={DiaryColors.textSecondary}
              value={newSubtask}
              onChangeText={setNewSubtask}
              onSubmitEditing={addSubtask}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addSubButton} onPress={addSubtask}>
              <Text style={styles.addSubText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Write anything here..."
            placeholderTextColor={DiaryColors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
            <Text style={styles.deleteText}>Delete task</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const makeStyles = (DiaryColors: DiaryPalette) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: DiaryColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: '700', color: DiaryColors.textPrimary, marginBottom: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: DiaryColors.textSecondary,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: DiaryColors.textPrimary,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  chip: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: { color: DiaryColors.textPrimary, fontSize: 13, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  subBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DiaryColors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBoxDone: { backgroundColor: DiaryColors.primaryBlue },
  subCheck: { color: '#fff', fontSize: 12, fontWeight: '700' },
  subText: { flex: 1, fontSize: 14, color: DiaryColors.textPrimary },
  subTextDone: { color: DiaryColors.textSecondary },
  subRemove: { color: DiaryColors.textSecondary, fontSize: 16, paddingHorizontal: 4 },
  addSubButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DiaryColors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: DiaryColors.cardBackground,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  cancelText: { color: DiaryColors.textPrimary, fontWeight: '600' },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: DiaryColors.primaryBlue,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  deleteButton: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  deleteText: { color: '#E4626F', fontWeight: '700' },
});
