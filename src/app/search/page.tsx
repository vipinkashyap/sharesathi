'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { Stock } from '@/types';
import { searchStocks, getTopGainers } from '@/services/stockApi';
import { StockCard } from '@/components/StockCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [popularStocks, setPopularStocks] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load popular stocks on mount
  useEffect(() => {
    setPopularStocks(getTopGainers(10));
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const searchResults = searchStocks(query);
      setResults(searchResults);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
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
                      stock={stock}
                      compact
                      showWatchlistButton
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  No stocks found
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Try searching with a different name or BSE code
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
              {popularStocks.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
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
