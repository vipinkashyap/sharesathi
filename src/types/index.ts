export interface Stock {
  symbol: string;
  name: string;
  shortName: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  previousClose?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  timestamp?: Date;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: Date;
  order: number;
  notes?: string;
  alertPrice?: number;
}

// Multiple watchlists support
export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  isDefault: boolean; // true for read-only "Top Picks"
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export const MAX_WATCHLISTS = 10;
export const MAX_STOCKS_PER_WATCHLIST = 50;
export const DEFAULT_WATCHLIST_ID = 'top-picks';
export const USER_WATCHLIST_ID = 'my-watchlist';

export interface PricePoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}
