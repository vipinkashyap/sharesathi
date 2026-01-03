'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type FontSize = 'normal' | 'large' | 'extra-large';

interface SettingsState {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      fontSize: 'large', // Default to large for older users

      setTheme: (theme: Theme) => set({ theme }),
      setFontSize: (size: FontSize) => set({ fontSize: size }),
    }),
    {
      name: 'sharesathi-settings',
    }
  )
);
