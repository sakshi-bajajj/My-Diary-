import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { DiaryPalette, ThemeKey, themes } from '@/constants/theme';

const THEME_KEY = 'mydiary_theme';

type ThemeCtx = {
  colors: DiaryPalette;
  themeKey: ThemeKey;
  setThemeKey: (key: ThemeKey) => void;
};

const ThemeContext = createContext<ThemeCtx>({
  colors: themes.blue.colors,
  themeKey: 'blue',
  setThemeKey: () => {},
});

export function DiaryThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setKey] = useState<ThemeKey>('pink');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (saved && saved in themes) setKey(saved as ThemeKey);
      })
      .catch((e) => console.log('Failed to load theme', e));
  }, []);

  const setThemeKey = (key: ThemeKey) => {
    setKey(key);
    AsyncStorage.setItem(THEME_KEY, key).catch((e) => console.log('Failed to save theme', e));
  };

  return (
    <ThemeContext.Provider value={{ colors: themes[themeKey].colors, themeKey, setThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useDiaryTheme = () => useContext(ThemeContext);

