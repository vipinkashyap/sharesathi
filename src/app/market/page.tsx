'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { MarketTable } from '@/components/MarketTable';
import { useWatchlistStore } from '@/store/watchlistStore';

interface StockData {
  symbol: string;
  name: string;
  shortName: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume?: number;
  nseSymbol?: string;
}

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [liveStocks, setLiveStocks] = useState<Map<string, StockData>>(new Map());
  const [loading, setLoading] = useState(true);

  const { watchlists } = useWatchlistStore();

  // Set initial watchlist
  useEffect(() => {
    if (!activeWatchlistId && watchlists.length > 0) {
      setActiveWatchlistId(watchlists[0].id);
    }
  }, [watchlists, activeWatchlistId]);

  // Get symbols to fetch based on active watchlist
  const symbolsToFetch = useMemo(() => {
    if (activeWatchlistId) {
      const watchlist = watchlists.find(w => w.id === activeWatchlistId);
      return watchlist?.symbols || [];
    }
    return [];
  }, [activeWatchlistId, watchlists]);

  // Fetch live stock data
  const fetchLiveData = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) {
      setLiveStocks(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/stocks/batch?symbols=${symbols.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        const stockMap = new Map<string, StockData>();
        for (const [symbol, stock] of Object.entries(data.stocks || {})) {
          if (stock && typeof stock === 'object' && 'price' in stock) {
            stockMap.set(symbol, stock as StockData);
          }
        }
        setLiveStocks(stockMap);
      }
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData(symbolsToFetch);
  }, [symbolsToFetch, fetchLiveData]);

  const filteredStocks = useMemo(() => {
    let stocks = Array.from(liveStocks.values());

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      stocks = stocks.filter(
        stock =>
          stock.shortName.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query) ||
          stock.symbol.includes(query)
      );
    }

    return stocks;
  }, [searchQuery, liveStocks]);

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Market Monitor
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {loading ? 'Loading...' : `${filteredStocks.length} stocks`}
            </p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Stock</span>
          </Link>
        </div>
      </div>

      {/* Watchlist Selector & Search */}
      <div className="px-4 py-3 space-y-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Watchlist tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {watchlists.map(watchlist => (
            <button
              key={watchlist.id}
              onClick={() => setActiveWatchlistId(watchlist.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeWatchlistId === watchlist.id
                  ? 'text-white'
                  : ''
              }`}
              style={{
                backgroundColor: activeWatchlistId === watchlist.id
                  ? 'var(--accent-blue)'
                  : 'var(--bg-secondary)',
                color: activeWatchlistId === watchlist.id
                  ? 'white'
                  : 'var(--text-secondary)',
              }}
            >
              {watchlist.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter stocks..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Table or Empty State */}
      <div className="flex-1 overflow-hidden">
        {symbolsToFetch.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {activeWatchlist ? 'No stocks in this watchlist' : 'No watchlist selected'}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Add stocks to your watchlist to see them here
            </p>
            <Link
              href="/search"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
            >
              Search & Add Stocks
            </Link>
          </div>
        ) : (
          <MarketTable stocks={filteredStocks} />
        )}
      </div>
    </div>
  );
}
