import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DiaryPalette } from '@/constants/theme';
import { useDiaryTheme } from '@/utils/theme-context';

const FOCUS_XP_KEY = 'mydiary_focus_xp';
const XP_PER_SESSION = 30;
const options = [15, 25, 45,60];

type Props = { visible: boolean; onClose: () => void };

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function FocusTimerModal({ visible, onClose }: Props) {
  const { colors: DiaryColors } = useDiaryTheme();
  const styles = useMemo(() => makeStyles(DiaryColors), [DiaryColors]);

  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  const finish = async () => {
    setRunning(false);
    setRemaining(minutes * 60);
    try {
      const saved = await AsyncStorage.getItem(FOCUS_XP_KEY);
      const total = (saved ? parseInt(saved, 10) : 0) + XP_PER_SESSION;
      await AsyncStorage.setItem(FOCUS_XP_KEY, String(total));
    } catch (e) {
      console.log('Failed to save focus XP', e);
    }
    Alert.alert('Focus session done! 🎉', `+${XP_PER_SESSION} XP. Take a little break ♥`);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        finish();
      }
    }, 500);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    endAt.current = Date.now() + remaining * 1000;
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(minutes * 60);
  };

  const pick = (m: number) => {
    setMinutes(m);
    setRemaining(m * 60);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>Focus Timer ⏱</Text>

          <Text style={styles.time}>{fmt(remaining)}</Text>

          <View style={styles.chips}>
            {options.map((m) => (
              <TouchableOpacity
                key={m}
                disabled={running}
                style={[styles.chip, minutes === m && styles.chipSelected, running && { opacity: 0.5 }]}
                onPress={() => pick(m)}
              >
                <Text style={[styles.chipText, minutes === m && { color: '#fff' }]}>{m} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.secondary} onPress={reset}>
              <Text style={styles.secondaryText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primary}
              onPress={running ? () => setRunning(false) : start}
            >
              <Text style={styles.primaryText}>{running ? 'Pause' : 'Start'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Finish a session to earn +{XP_PER_SESSION} XP</Text>

          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (DiaryColors: DiaryPalette) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: DiaryColors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      alignItems: 'center',
    },
    heading: { fontSize: 20, fontWeight: '700', color: DiaryColors.textPrimary },
    time: { fontSize: 64, fontWeight: '800', color: DiaryColors.primaryBlue, marginVertical: 20 },
    chips: { flexDirection: 'row', gap: 10 },
    chip: {
      backgroundColor: DiaryColors.cardBackground,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: DiaryColors.border,
    },
    chipSelected: { backgroundColor: DiaryColors.primaryBlue, borderColor: DiaryColors.primaryBlue },
    chipText: { fontSize: 13, fontWeight: '600', color: DiaryColors.textPrimary },
    buttons: { flexDirection: 'row', gap: 12, marginTop: 24, alignSelf: 'stretch' },
    primary: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: DiaryColors.primaryBlue,
    },
    primaryText: { color: '#fff', fontWeight: '700' },
    secondary: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: DiaryColors.cardBackground,
      borderWidth: 1,
      borderColor: DiaryColors.border,
    },
    secondaryText: { color: DiaryColors.textPrimary, fontWeight: '600' },
    hint: { fontSize: 12, color: DiaryColors.textSecondary, marginTop: 14 },
    close: { marginTop: 14, padding: 8 },
    closeText: { color: DiaryColors.textSecondary, fontWeight: '600' },
  });