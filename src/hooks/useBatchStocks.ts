import { useState, useEffect, useRef, useCallback } from 'react';

interface LiveStockData {
  price: number;
  change: number;
  changePercent: number;
  changePercentWeek: number;
  changePercentMonth: number;
  changePercentYear: number;
  changePercent5Year: number;
  changePercent10Year: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  isLive: boolean;
}

interface UseBatchStocksResult {
  liveData: Record<string, LiveStockData>;
  isLoading: boolean;
  error: string | null;
}

// Cache for live data (5 minute TTL)
const cache = new Map<string, { data: LiveStockData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get cached data for symbols immediately (sync)
function getCachedData(symbols: string[]): Record<string, LiveStockData> {
  const now = Date.now();
  const result: Record<string, LiveStockData> = {};
  for (const symbol of symbols) {
    const cached = cache.get(symbol);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      result[symbol] = cached.data;
    }
  }
  return result;
}

export function useBatchStocks(symbols: string[]): UseBatchStocksResult {
  // Initialize with cached data immediately
  const [liveData, setLiveData] = useState<Record<string, LiveStockData>>(() =>
    getCachedData(symbols.slice(0, 30))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevSymbolsRef = useRef<string>('');

  const fetchBatch = useCallback(async (symbolsToFetch: string[]) => {
    if (symbolsToFetch.length === 0) return;

    // Cancel any in-flight request when new symbols come in
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check which symbols need fetching (not in cache or expired)
    const now = Date.now();
    const uncachedSymbols: string[] = [];
    const cachedData: Record<string, LiveStockData> = {};

    for (const symbol of symbolsToFetch) {
      const cached = cache.get(symbol);
      if (cached && now - cached.timestamp < CACHE_TTL) {
        cachedData[symbol] = cached.data;
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // Always update with cached data first
    if (Object.keys(cachedData).length > 0) {
      setLiveData(prev => ({ ...prev, ...cachedData }));
    }

    // If all data is cached, we're done
    if (uncachedSymbols.length === 0) {
      return;
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: uncachedSymbols }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stocks');
      }

      const result = await response.json();
      const newData: Record<string, LiveStockData> = {};

      // Update cache and result
      for (const [symbol, data] of Object.entries(result.stocks)) {
        const stockData = data as LiveStockData;
        cache.set(symbol, { data: stockData, timestamp: now });
        newData[symbol] = stockData;
      }

      setLiveData(prev => ({ ...prev, ...newData }));
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const limitedSymbols = symbols.slice(0, 30);
    const symbolsKey = limitedSymbols.sort().join(',');

    // If symbols changed, immediately show any cached data
    if (symbolsKey !== prevSymbolsRef.current) {
      const cached = getCachedData(limitedSymbols);
      if (Object.keys(cached).length > 0) {
        setLiveData(prev => ({ ...prev, ...cached }));
      }
    }

    if (symbolsKey === prevSymbolsRef.current) return;
    prevSymbolsRef.current = symbolsKey;

    // Reduced debounce - 150ms feels more responsive
    const timer = setTimeout(() => {
      fetchBatch(limitedSymbols);
    }, 150);

    return () => clearTimeout(timer);
  }, [symbols, fetchBatch]);

  return { liveData, isLoading, error };
}
