import { localDateString } from '@/utils/date';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
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
import { Calendar, DateData } from 'react-native-calendars';

import { DiaryPalette } from '@/constants/theme';
import { useDiaryTheme } from '@/utils/theme-context';

export type Priority = 'high' | 'medium' | 'low';

export type NewTaskInput = {
  title: string;
  time: string;
  categoryId: string;
  priority: Priority;
  date: string;
};
type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (task: NewTaskInput) => void;
  categories: { id: string; title: string }[];
};

const priorityOptions: { label: string; value: Priority; color: string }[] = [
  { label: 'High', value: 'high', color: '#E4626F' },
  { label: 'Medium', value: 'medium', color: '#F0A860' },
  { label: 'Low', value: 'low', color: '#6FBF8B' },
];
export function AddTaskModal({ visible, onClose, onSave, categories }: Props) {
  const { colors: DiaryColors } = useDiaryTheme();
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);
  const todayStr = localDateString();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [priority, setPriority] = useState<Priority>('medium');
  const [date, setDate] = useState(todayStr);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeValue, setTimeValue] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formattedTime = timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), time: formattedTime, categoryId, priority, date });
    setTitle('');
    setTimeValue(new Date());
    setPriority('medium');
    setDate(todayStr);
    setShowDatePicker(false);
    setShowTimePicker(false);
    onClose();
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
          <Text style={styles.heading}>New Task ♥</Text>

          <Text style={styles.label}>Task name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Revise past papers"
            placeholderTextColor={DiaryColors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

                   <Text style={styles.label}>Time</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.dateButtonText}>{formattedTime}</Text>
          </TouchableOpacity>

                    {showTimePicker && (
            <DateTimePicker
              value={timeValue}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              textColor={DiaryColors.textPrimary}
              themeVariant="light"
              onChange={(event, selected) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selected) setTimeValue(selected);
              }}
            />
          )}

          
                    <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(!showDatePicker)}>
            <Text style={styles.dateButtonText}>{date}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.calendarWrapper}>
              <Calendar
                current={date}
                onDayPress={(day: DateData) => {
                  setDate(day.dateString);
                  setShowDatePicker(false);
                }}
                markedDates={{
                  [date]: { selected: true, selectedColor: DiaryColors.primaryBlue },
                }}
                theme={{
                  backgroundColor: DiaryColors.cardBackground,
                  calendarBackground: DiaryColors.cardBackground,
                  textSectionTitleColor: DiaryColors.textSecondary,
                  selectedDayBackgroundColor: DiaryColors.primaryBlue,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: DiaryColors.primaryBlue,
                  dayTextColor: DiaryColors.textPrimary,
                  arrowColor: DiaryColors.primaryBlue,
                  monthTextColor: DiaryColors.textPrimary,
                  textDayFontWeight: '600',
                  textMonthFontWeight: '700',
                }}
              />
            </View>
          )}

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  categoryId === cat.id && styles.chipSelected,
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    categoryId === cat.id && styles.chipTextSelected,
                  ]}
                >
                  {cat.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Priority</Text>
          <View style={styles.rowScroll}>
            {priorityOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  { borderColor: opt.color },
                  priority === opt.value && { backgroundColor: opt.color, borderColor: opt.color },
                ]}
                onPress={() => setPriority(opt.value)}
              >
                <Text style={[styles.chipText, priority === opt.value && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
             ))}
          </View>

                    <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Add Task</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '85%',
    marginTop: 'auto',
  },
  sheet: {
    backgroundColor: DiaryColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: DiaryColors.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: DiaryColors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
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
    dateButton: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  dateButtonText: {
    fontSize: 15,
    color: DiaryColors.textPrimary,
    fontWeight: '600',
  },
  calendarWrapper: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  rowScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: DiaryColors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  chipSelected: {
    backgroundColor: DiaryColors.primaryBlue,
    borderColor: DiaryColors.primaryBlue,
  },
  chipText: {
    color: DiaryColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: DiaryColors.darkBlue,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: DiaryColors.cardBackground,
    borderWidth: 1,
    borderColor: DiaryColors.border,
  },
  cancelText: {
    color: DiaryColors.textPrimary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: DiaryColors.primaryBlue,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});



