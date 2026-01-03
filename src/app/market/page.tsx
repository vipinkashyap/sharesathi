'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, TrendingUp, TrendingDown } from 'lucide-react';
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
  volume?: number;
  yearHigh?: number;
  yearLow?: number;
  changePercentYear?: number;
  changePercentMonth?: number;
  industry?: string;
}

interface IndexData {
  advances: number;
  declines: number;
  unchanged: number;
}

// Available indices - organized by category
const INDICES = [
  // All stocks from BSE (4000+)
  { id: 'all-bse', name: 'All BSE (4000+)' },
  // Broad market from NSE
  { id: 'nifty500', name: 'Nifty 500' },
  { id: 'nifty50', name: 'Nifty 50' },
  { id: 'nifty100', name: 'Nifty 100' },
  { id: 'niftynext50', name: 'Next 50' },
  // Sectors
  { id: 'niftybank', name: 'Bank' },
  { id: 'niftyit', name: 'IT' },
  { id: 'niftypharma', name: 'Pharma' },
  { id: 'niftyauto', name: 'Auto' },
  { id: 'niftyfmcg', name: 'FMCG' },
  { id: 'niftymetal', name: 'Metal' },
  { id: 'niftyrealty', name: 'Realty' },
  { id: 'niftyenergy', name: 'Energy' },
  // Size-based
  { id: 'niftymidcap50', name: 'Midcap' },
  { id: 'niftysmallcap50', name: 'Smallcap' },
];

type ViewMode = 'watchlist' | 'index';

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('index');
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState('all-bse');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);

  const { watchlists } = useWatchlistStore();

  // Set initial watchlist
  useEffect(() => {
    if (!activeWatchlistId && watchlists.length > 0) {
      setActiveWatchlistId(watchlists[0].id);
    }
  }, [watchlists, activeWatchlistId]);

  // Fetch index constituents or all BSE stocks
  const fetchIndexData = useCallback(async (indexId: string) => {
    setLoading(true);
    try {
      if (indexId === 'all-bse') {
        // Fetch all BSE stocks from bhavcopy
        const response = await fetch('/api/stocks/all?limit=5000&sort=volume');
        if (response.ok) {
          const data = await response.json();
          setStocks(data.stocks || []);
          setIndexData(null);
        }
      } else {
        // Fetch NSE index constituents
        const response = await fetch(`/api/indices/constituents?index=${indexId}`);
        if (response.ok) {
          const data = await response.json();
          setStocks(data.stocks || []);
          setIndexData(data.advance || null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch index data:', err);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch watchlist stocks
  const fetchWatchlistData = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) {
      setStocks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/stocks/batch?symbols=${symbols.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        const stockList: StockData[] = [];
        for (const [, stock] of Object.entries(data.stocks || {})) {
          if (stock && typeof stock === 'object' && 'price' in stock) {
            stockList.push(stock as StockData);
          }
        }
        setStocks(stockList);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist data:', err);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data based on view mode
  useEffect(() => {
    if (viewMode === 'index') {
      setIndexData(null);
      fetchIndexData(activeIndex);
    } else {
      setIndexData(null);
      const watchlist = watchlists.find(w => w.id === activeWatchlistId);
      fetchWatchlistData(watchlist?.symbols || []);
    }
  }, [viewMode, activeIndex, activeWatchlistId, watchlists, fetchIndexData, fetchWatchlistData]);

  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks;

    const query = searchQuery.toLowerCase();
    return stocks.filter(
      stock =>
        stock.shortName?.toLowerCase().includes(query) ||
        stock.name?.toLowerCase().includes(query) ||
        stock.symbol?.toLowerCase().includes(query)
    );
  }, [searchQuery, stocks]);

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
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {loading ? 'Loading...' : `${filteredStocks.length} stocks`}
              </p>
              {indexData && viewMode === 'index' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1" style={{ color: 'var(--accent-green)' }}>
                    <TrendingUp size={12} />
                    {indexData.advances}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--accent-red)' }}>
                    <TrendingDown size={12} />
                    {indexData.declines}
                  </span>
                </div>
              )}
            </div>
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

      {/* View Mode Toggle */}
      <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('index')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'index' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
              color: viewMode === 'index' ? 'white' : 'var(--text-secondary)',
            }}
          >
            Indices
          </button>
          <button
            onClick={() => setViewMode('watchlist')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'watchlist' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
              color: viewMode === 'watchlist' ? 'white' : 'var(--text-secondary)',
            }}
          >
            Watchlists
          </button>
        </div>
      </div>

      {/* Index/Watchlist Selector & Search */}
      <div className="px-4 py-3 space-y-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {viewMode === 'index' ? (
            INDICES.map(index => (
              <button
                key={index.id}
                onClick={() => setActiveIndex(index.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: activeIndex === index.id
                    ? 'var(--accent-blue)'
                    : 'var(--bg-secondary)',
                  color: activeIndex === index.id
                    ? 'white'
                    : 'var(--text-secondary)',
                }}
              >
                {index.name}
              </button>
            ))
          ) : (
            watchlists.map(watchlist => (
              <button
                key={watchlist.id}
                onClick={() => setActiveWatchlistId(watchlist.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
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
            ))
          )}
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
        {viewMode === 'watchlist' && (!activeWatchlist || activeWatchlist.symbols.length === 0) ? (
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
