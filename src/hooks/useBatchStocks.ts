import { useState, useEffect, useRef, useCallback } from 'react';

interface LiveStockData {
  price: number;
  change: number;
  changePercent: number;
  changePercentWeek: number;
  changePercentMonth: number;
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

export function useBatchStocks(symbols: string[]): UseBatchStocksResult {
  const [liveData, setLiveData] = useState<Record<string, LiveStockData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const prevSymbolsRef = useRef<string>('');

  const fetchBatch = useCallback(async (symbolsToFetch: string[]) => {
    if (symbolsToFetch.length === 0 || fetchingRef.current) return;

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

    // If all data is cached, just use cache
    if (uncachedSymbols.length === 0) {
      setLiveData(prev => ({ ...prev, ...cachedData }));
      return;
    }

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: uncachedSymbols }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stocks');
      }

      const result = await response.json();
      const newData: Record<string, LiveStockData> = { ...cachedData };

      // Update cache and result
      for (const [symbol, data] of Object.entries(result.stocks)) {
        const stockData = data as LiveStockData;
        cache.set(symbol, { data: stockData, timestamp: now });
        newData[symbol] = stockData;
      }

      setLiveData(prev => ({ ...prev, ...newData }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Only fetch if symbols changed
    const symbolsKey = symbols.slice(0, 30).sort().join(',');
    if (symbolsKey === prevSymbolsRef.current) return;
    prevSymbolsRef.current = symbolsKey;

    // Small delay to debounce rapid changes (scrolling)
    const timer = setTimeout(() => {
      fetchBatch(symbols.slice(0, 30));
    }, 300);

    return () => clearTimeout(timer);
  }, [symbols, fetchBatch]);

  return { liveData, isLoading, error };
}
