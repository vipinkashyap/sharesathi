'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type FontSize = 'normal' | 'large' | 'extra-large';
type SymbolFormat = 'bse' | 'nse';

interface SettingsState {
  theme: Theme;
  fontSize: FontSize;
  symbolFormat: SymbolFormat;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setSymbolFormat: (format: SymbolFormat) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      fontSize: 'large', // Default to large for older users
      symbolFormat: 'bse', // Default to BSE codes (your FIL's preference)

      setTheme: (theme: Theme) => set({ theme }),
      setFontSize: (size: FontSize) => set({ fontSize: size }),
      setSymbolFormat: (format: SymbolFormat) => set({ symbolFormat: format }),
    }),
    {
      name: 'sharesathi-settings',
    }
  )
);
