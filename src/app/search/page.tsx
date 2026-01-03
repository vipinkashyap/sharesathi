'use client';

import { useState, useEffect } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { StockCard } from '@/components/StockCard';

interface SearchResult {
  symbol: string;
  name: string;
  shortName: string;
  exchange: string;
}

// Popular Indian stocks to show by default
const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', shortName: 'RELIANCE' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', shortName: 'TCS' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', shortName: 'HDFC BANK' },
  { symbol: 'INFY', name: 'Infosys Ltd', shortName: 'INFOSYS' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', shortName: 'ICICI BANK' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', shortName: 'BHARTI ARTL' },
  { symbol: 'SBIN', name: 'State Bank of India', shortName: 'SBIN' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', shortName: 'L&T' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', shortName: 'WIPRO' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', shortName: 'AXIS BANK' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search using Yahoo Finance API
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const showResults = query.trim().length > 0;

  return (
    <div className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Search Stocks
        </h1>

        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or BSE code..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: 'var(--text-primary)' }}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="touch-target p-1 rounded-full hover:bg-[var(--bg-secondary)]"
            >
              <X size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {showResults ? (
          <div>
            {isSearching ? (
              <div className="py-8 text-center">
                <p style={{ color: 'var(--text-muted)' }}>Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {results.length} result{results.length > 1 ? 's' : ''} found
                </p>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {results.map((stock) => (
                    <StockCard
                      key={stock.symbol}
                      stock={{
                        symbol: stock.symbol,
                        name: stock.name,
                        shortName: stock.shortName,
                        price: 0,
                        change: 0,
                        changePercent: 0,
                        marketCap: 0,
                        timestamp: new Date(),
                      }}
                      compact
                      showWatchlistButton
                    />
                  ))}
                </div>
              </div>
            ) : query.length >= 2 ? (
              <div className="py-8 text-center">
                <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  No stocks found
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Try searching with a different name or symbol
                </p>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Type at least 2 characters to search
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2
              className="text-lg font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <TrendingUp size={20} style={{ color: 'var(--accent-blue)' }} />
              Popular Stocks
            </h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              {POPULAR_STOCKS.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={{
                    symbol: stock.symbol,
                    name: stock.name,
                    shortName: stock.shortName,
                    price: 0,
                    change: 0,
                    changePercent: 0,
                    marketCap: 0,
                    timestamp: new Date(),
                  }}
                  compact
                  showWatchlistButton
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
