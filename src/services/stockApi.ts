import { Stock } from '@/types';
import allStocksData from '@/data/allStocks.json';

// Type for the raw stock data (metadata only - no prices)
interface RawStockData {
  symbol: string;
  nseSymbol?: string;
  name: string;
  shortName: string;
  marketCap?: number;
  isin?: string;
}

// Stock metadata lookup
const stocksData: RawStockData[] = allStocksData as RawStockData[];

// Create lookup map
const stockBySymbol = new Map<string, RawStockData>();
stocksData.forEach((s) => stockBySymbol.set(s.symbol, s));

/**
 * Get stock metadata by BSE symbol (for useLiveStock fallback)
 */
export function getStockBySymbol(symbol: string): Stock | undefined {
  // Try exact match first
  let stock = stockBySymbol.get(symbol);

  // Try with NSE_ prefix removed
  if (!stock && symbol.startsWith('NSE_')) {
    stock = stockBySymbol.get(symbol.replace('NSE_', ''));
  }

  if (!stock) return undefined;

  // Return metadata only - price data should come from API
  return {
    symbol: stock.symbol,
    name: stock.name,
    shortName: stock.shortName || stock.symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    marketCap: stock.marketCap || 0,
    timestamp: new Date(),
  };
}
