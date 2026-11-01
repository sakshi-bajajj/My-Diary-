import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function usePerks() {
  const [tiers, setTiers] = useState(0);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('mydiary_tiers_cleared')
        .then((v) => setTiers(v ? parseInt(v, 10) : 0))
        .catch((e) => console.log('Failed to load perks', e));
    }, [])
  );

  return {
    tulip: tiers >= 3,
    starlight: tiers >= 6,
    queen: tiers >= 9,
    diamond: tiers >= 12,
  };
}