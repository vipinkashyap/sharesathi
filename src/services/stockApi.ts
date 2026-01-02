import { Stock } from '@/types';
import allStocksData from '@/data/allStocks.json';
import defaultWatchlistSymbols from '@/data/defaultWatchlist.json';

// Type for the raw stock data
interface RawStockData {
  symbol: string;
  nseSymbol?: string;
  name: string;
  shortName: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  exchange?: string;
}

// Cache for stock data
const stockCache = new Map<string, { data: Stock; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute

// Convert raw data to Stock type
const stocksData: Stock[] = (allStocksData as RawStockData[]).map((s) => ({
  symbol: s.symbol,
  name: s.name,
  shortName: s.shortName || s.symbol,
  price: s.price || 0,
  change: s.change || 0,
  changePercent: s.changePercent || 0,
  marketCap: s.marketCap || 0,
  timestamp: new Date(),
}));

// Get default watchlist symbols (from FIL's data)
export function getDefaultWatchlistSymbols(): string[] {
  return defaultWatchlistSymbols as string[];
}

/**
 * Get all stocks from local data
 */
export function getAllStocks(): Stock[] {
  return stocksData;
}

/**
 * Get stocks with price data (from FIL's original list)
 */
export function getStocksWithPrices(): Stock[] {
  return stocksData.filter((s) => s.price > 0);
}

/**
 * Get stock by symbol
 */
export function getStockBySymbol(symbol: string): Stock | undefined {
  // Try exact match first
  let stock = stocksData.find((s) => s.symbol === symbol);

  // Try with NSE_ prefix removed
  if (!stock && symbol.startsWith('NSE_')) {
    stock = stocksData.find((s) => s.symbol === symbol.replace('NSE_', ''));
  }

  return stock;
}

/**
 * Search stocks by name or symbol
 */
export function searchStocks(query: string): Stock[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  return stocksData
    .filter(
      (stock) =>
        stock.name.toLowerCase().includes(lowerQuery) ||
        stock.shortName.toLowerCase().includes(lowerQuery) ||
        stock.symbol.toLowerCase().includes(lowerQuery)
    )
    .sort((a, b) => {
      // Prioritize stocks with price data
      if (a.price > 0 && b.price === 0) return -1;
      if (a.price === 0 && b.price > 0) return 1;
      // Then by market cap
      return b.marketCap - a.marketCap;
    })
    .slice(0, 30); // Limit results
}

/**
 * Get stocks by symbols
 */
export function getStocksBySymbols(symbols: string[]): Stock[] {
  return symbols
    .map((symbol) => getStockBySymbol(symbol))
    .filter((stock): stock is Stock => stock !== undefined);
}

/**
 * Get top gainers (only from stocks with price data)
 */
export function getTopGainers(limit: number = 10): Stock[] {
  return stocksData
    .filter((s) => s.price > 0 && s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, limit);
}

/**
 * Get top losers (only from stocks with price data)
 */
export function getTopLosers(limit: number = 10): Stock[] {
  return stocksData
    .filter((s) => s.price > 0 && s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, limit);
}

/**
 * Fetch live stock data from Yahoo Finance API
 * Falls back to cached/local data on error
 */
export async function fetchLiveStockData(symbol: string): Promise<Stock | null> {
  // Check cache first
  const cached = stockCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Yahoo Finance uses .BO suffix for BSE stocks
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch stock data');
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error('No data returned');
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    const stock: Stock = {
      symbol,
      name: meta.longName || meta.shortName || symbol,
      shortName: meta.symbol?.replace('.BO', '') || symbol,
      price: meta.regularMarketPrice || 0,
      previousClose: meta.previousClose || 0,
      change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
      changePercent:
        (((meta.regularMarketPrice || 0) - (meta.previousClose || 0)) /
          (meta.previousClose || 1)) *
        100,
      open: quote?.open?.[0] || 0,
      high: meta.regularMarketDayHigh || 0,
      low: meta.regularMarketDayLow || 0,
      volume: meta.regularMarketVolume || 0,
      marketCap: (meta.marketCap || 0) / 10000000, // Convert to crores
      timestamp: new Date(),
    };

    // Update cache
    stockCache.set(symbol, { data: stock, timestamp: Date.now() });

    return stock;
  } catch (error) {
    console.error(`Error fetching live data for ${symbol}:`, error);
    // Fallback to local data
    return getStockBySymbol(symbol) || null;
  }
}

/**
 * Fetch multiple stocks in parallel
 */
export async function fetchMultipleStocks(symbols: string[]): Promise<Stock[]> {
  const results = await Promise.all(
    symbols.map((symbol) => fetchLiveStockData(symbol))
  );
  return results.filter((stock): stock is Stock => stock !== null);
}

// Market indices
export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

/**
 * Get market indices (SENSEX, NIFTY)
 */
export async function getMarketIndices(): Promise<MarketIndex[]> {
  // For now, return static data. In production, fetch from API
  return [
    {
      name: 'SENSEX',
      symbol: '^BSESN',
      value: 78234.56,
      change: 352.15,
      changePercent: 0.45,
    },
    {
      name: 'NIFTY 50',
      symbol: '^NSEI',
      value: 23567.89,
      change: 122.45,
      changePercent: 0.52,
    },
  ];
}
