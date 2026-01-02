'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Star, X, Settings2 } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';
import indexData from '@/data/indexConstituents.json';

export type FilterType = 'all' | 'index' | 'watchlist';

interface MarketFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterType;
  activeFilterId: string | null;
  onFilterChange: (type: FilterType, id: string | null) => void;
}

export function MarketFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  activeFilterId,
  onFilterChange,
}: MarketFiltersProps) {
  const [showIndexDropdown, setShowIndexDropdown] = useState(false);
  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false);
  const indexDropdownRef = useRef<HTMLDivElement>(null);
  const watchlistDropdownRef = useRef<HTMLDivElement>(null);

  const { watchlists } = useWatchlistStore();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (indexDropdownRef.current && !indexDropdownRef.current.contains(event.target as Node)) {
        setShowIndexDropdown(false);
      }
      if (watchlistDropdownRef.current && !watchlistDropdownRef.current.contains(event.target as Node)) {
        setShowWatchlistDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActiveIndexName = () => {
    if (activeFilter !== 'index' || !activeFilterId) return 'Indices';
    const index = indexData.indices.find(i => i.id === activeFilterId);
    return index?.name || 'Indices';
  };

  const getActiveWatchlistName = () => {
    if (activeFilter !== 'watchlist' || !activeFilterId) return 'Watchlists';
    const watchlist = watchlists.find(w => w.id === activeFilterId);
    return watchlist?.name || 'Watchlists';
  };

  const clearFilter = () => {
    onFilterChange('all', null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      {/* All Stocks Button */}
      <button
        onClick={() => onFilterChange('all', null)}
        className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        style={{
          backgroundColor: activeFilter === 'all' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
          color: activeFilter === 'all' ? 'white' : 'var(--text-secondary)',
        }}
      >
        All
      </button>

      {/* Index Dropdown */}
      <div className="relative" ref={indexDropdownRef}>
        <button
          onClick={() => {
            setShowIndexDropdown(!showIndexDropdown);
            setShowWatchlistDropdown(false);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={{
            backgroundColor: activeFilter === 'index' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
            color: activeFilter === 'index' ? 'white' : 'var(--text-secondary)',
          }}
        >
          {getActiveIndexName()}
          <ChevronDown size={14} />
        </button>

        {showIndexDropdown && (
          <div
            className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg z-20 py-1 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            {indexData.indices.map((index) => (
              <button
                key={index.id}
                onClick={() => {
                  onFilterChange('index', index.id);
                  setShowIndexDropdown(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-opacity-50 transition-colors"
                style={{
                  color: activeFilterId === index.id ? 'var(--accent-blue)' : 'var(--text-primary)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="font-medium">{index.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {index.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist Dropdown */}
      <div className="relative" ref={watchlistDropdownRef}>
        <button
          onClick={() => {
            setShowWatchlistDropdown(!showWatchlistDropdown);
            setShowIndexDropdown(false);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={{
            backgroundColor: activeFilter === 'watchlist' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
            color: activeFilter === 'watchlist' ? 'white' : 'var(--text-secondary)',
          }}
        >
          <Star size={14} />
          {getActiveWatchlistName()}
          <ChevronDown size={14} />
        </button>

        {showWatchlistDropdown && (
          <div
            className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg z-20 py-1 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            {watchlists.length === 0 ? (
              <div className="px-4 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                No watchlists yet
              </div>
            ) : (
              watchlists.map((watchlist) => (
                <button
                  key={watchlist.id}
                  onClick={() => {
                    onFilterChange('watchlist', watchlist.id);
                    setShowWatchlistDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-opacity-50 transition-colors"
                  style={{
                    color: activeFilterId === watchlist.id ? 'var(--accent-blue)' : 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="font-medium">{watchlist.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {watchlist.symbols.length} stocks
                  </div>
                </button>
              ))
            )}
            {/* Manage Watchlists Link */}
            <Link
              href="/watchlist"
              onClick={() => setShowWatchlistDropdown(false)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm border-t transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--accent-blue)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Settings2 size={14} />
              Manage Watchlists
            </Link>
          </div>
        )}
      </div>

      {/* Clear filter button (when filter is active) */}
      {activeFilter !== 'all' && (
        <button
          onClick={clearFilter}
          className="p-1.5 rounded-full transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={16} />
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-transparent outline-none text-sm w-32 sm:w-48"
          style={{ color: 'var(--text-primary)' }}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')}>
            <X size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>
    </div>
  );
}
