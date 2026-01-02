'use client';

import { useState, useEffect, useCallback } from 'react';
import { Stock } from '@/types';
import { getStockBySymbol } from '@/services/stockApi';

interface LiveStockData extends Stock {
  priceHistory?: { date: string; close: number }[];
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  isLive?: boolean;
}

export function useLiveStock(symbol: string) {
  const [stock, setStock] = useState<LiveStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchStock = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/stock/${symbol}`);

      if (response.ok) {
        const data = await response.json();
        setStock(data);
        setIsLive(true);
        setError(null);
      } else {
        // API failed (404 or other) - use static data
        const staticStock = getStockBySymbol(symbol);
        if (staticStock) {
          setStock({ ...staticStock, isLive: false });
          setIsLive(false);
          setError(null);
        } else {
          setError('Stock not found');
        }
      }
    } catch (err) {
      console.error('Error fetching live stock:', err);
      // Network error - use static data
      const staticStock = getStockBySymbol(symbol);
      if (staticStock) {
        setStock({ ...staticStock, isLive: false });
        setIsLive(false);
        setError(null);
      } else {
        setError('Stock not found');
      }
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  return { stock, loading, error, isLive, refetch: fetchStock };
}
