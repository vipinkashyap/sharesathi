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
