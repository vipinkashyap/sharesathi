'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import defaultWatchlistSymbols from '@/data/defaultWatchlist.json';

interface WatchlistState {
  symbols: string[];
  addStock: (symbol: string) => void;
  removeStock: (symbol: string) => void;
  reorderStocks: (symbols: string[]) => void;
  isInWatchlist: (symbol: string) => boolean;
}

// Default watchlist from FIL's top stocks
const DEFAULT_WATCHLIST = defaultWatchlistSymbols as string[];

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: DEFAULT_WATCHLIST,

      addStock: (symbol: string) => {
        const { symbols } = get();
        if (!symbols.includes(symbol) && symbols.length < 50) {
          set({ symbols: [...symbols, symbol] });
        }
      },

      removeStock: (symbol: string) => {
        set((state) => ({
          symbols: state.symbols.filter((s) => s !== symbol),
        }));
      },

      reorderStocks: (symbols: string[]) => {
        set({ symbols });
      },

      isInWatchlist: (symbol: string) => {
        return get().symbols.includes(symbol);
      },
    }),
    {
      name: 'sharesathi-watchlist',
    }
  )
);
