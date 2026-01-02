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

