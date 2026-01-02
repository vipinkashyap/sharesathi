'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import defaultWatchlistSymbols from '@/data/defaultWatchlist.json';
import {
  Watchlist,
  MAX_WATCHLISTS,
  MAX_STOCKS_PER_WATCHLIST,
  DEFAULT_WATCHLIST_ID,
  USER_WATCHLIST_ID,
} from '@/types';

interface WatchlistState {
  watchlists: Watchlist[];
  activeWatchlistId: string;

  // Watchlist CRUD
  createWatchlist: (name: string) => string | null;
  renameWatchlist: (id: string, name: string) => void;
  deleteWatchlist: (id: string) => void;
  setActiveWatchlist: (id: string) => void;

  // Stock operations
  addStock: (symbol: string, watchlistId?: string) => void;
  removeStock: (symbol: string, watchlistId?: string) => void;

  // Query helpers
  isInWatchlist: (symbol: string, watchlistId?: string) => boolean;
  isInAnyWatchlist: (symbol: string) => boolean;
  getWatchlistsContaining: (symbol: string) => Watchlist[];

  // Utility
  canCreateWatchlist: () => boolean;
  canAddToWatchlist: (watchlistId: string) => boolean;
}

// Default watchlists
const defaultWatchlists: Watchlist[] = [
  {
    id: DEFAULT_WATCHLIST_ID,
    name: 'FIL Picks',
    symbols: defaultWatchlistSymbols as string[],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 0,
  },
  {
    id: USER_WATCHLIST_ID,
    name: 'My Watchlist',
    symbols: [],
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 1,
  },
];

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlists: defaultWatchlists,
      activeWatchlistId: USER_WATCHLIST_ID,

      createWatchlist: (name: string) => {
        const { watchlists } = get();
        if (watchlists.length >= MAX_WATCHLISTS) return null;

        const id = `watchlist-${Date.now()}`;
        const newWatchlist: Watchlist = {
          id,
          name: name.trim() || 'Untitled Watchlist',
          symbols: [],
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          order: watchlists.length,
        };

        set({ watchlists: [...watchlists, newWatchlist] });
        return id;
      },

      renameWatchlist: (id: string, name: string) => {
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === id && !w.isDefault
              ? { ...w, name: name.trim() || w.name, updatedAt: new Date() }
              : w
          ),
        }));
      },

      deleteWatchlist: (id: string) => {
        const { watchlists, activeWatchlistId } = get();
        const watchlist = watchlists.find((w) => w.id === id);

        if (!watchlist || watchlist.isDefault) return;

        const userWatchlists = watchlists.filter((w) => !w.isDefault);
        if (userWatchlists.length <= 1) return;

        const newWatchlists = watchlists.filter((w) => w.id !== id);

        let newActiveId = activeWatchlistId;
        if (activeWatchlistId === id) {
          newActiveId = newWatchlists.find((w) => !w.isDefault)?.id || USER_WATCHLIST_ID;
        }

        set({ watchlists: newWatchlists, activeWatchlistId: newActiveId });
      },

      setActiveWatchlist: (id: string) => {
        set({ activeWatchlistId: id });
      },

      addStock: (symbol: string, watchlistId?: string) => {
        const id = watchlistId || get().activeWatchlistId;
        set((state) => ({
          watchlists: state.watchlists.map((w) => {
            if (w.id !== id || w.isDefault) return w;
            if (w.symbols.includes(symbol) || w.symbols.length >= MAX_STOCKS_PER_WATCHLIST) return w;
            return {
              ...w,
              symbols: [...w.symbols, symbol],
              updatedAt: new Date(),
            };
          }),
        }));
      },

      removeStock: (symbol: string, watchlistId?: string) => {
        const id = watchlistId || get().activeWatchlistId;
        set((state) => ({
          watchlists: state.watchlists.map((w) => {
            if (w.id !== id || w.isDefault) return w;
            return {
              ...w,
              symbols: w.symbols.filter((s) => s !== symbol),
              updatedAt: new Date(),
            };
          }),
        }));
      },

      isInWatchlist: (symbol: string, watchlistId?: string) => {
        const id = watchlistId || get().activeWatchlistId;
        const watchlist = get().watchlists.find((w) => w.id === id);
        return watchlist?.symbols.includes(symbol) || false;
      },

      isInAnyWatchlist: (symbol: string) => {
        return get().watchlists.some((w) => w.symbols.includes(symbol));
      },

      getWatchlistsContaining: (symbol: string) => {
        return get().watchlists.filter((w) => w.symbols.includes(symbol));
      },

      canCreateWatchlist: () => {
        return get().watchlists.length < MAX_WATCHLISTS;
      },

      canAddToWatchlist: (watchlistId: string) => {
        const watchlist = get().watchlists.find((w) => w.id === watchlistId);
        return watchlist
          ? !watchlist.isDefault && watchlist.symbols.length < MAX_STOCKS_PER_WATCHLIST
          : false;
      },
    }),
    {
      name: 'sharesathi-watchlist-v2',
    }
  )
);
