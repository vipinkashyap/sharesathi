'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowUpDown, Star, Loader2 } from 'lucide-react';
import { formatPrice, formatPercent, formatMarketCap, formatVolume } from '@/lib/formatters';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useBatchStocks } from '@/hooks/useBatchStocks';

interface StockRow {
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

type SortKey = 'shortName' | 'price' | 'changePercent' | 'volume' | 'marketCap';
type SortOrder = 'asc' | 'desc';

interface MarketTableProps {
  stocks: StockRow[];
  isLoading?: boolean;
}

const VISIBLE_ROWS = 30;
const ROW_HEIGHT = 52;

// Calculate 52W position as percentage (0 = at low, 100 = at high)
function calc52WPosition(price: number, high: number, low: number): number | null {
  if (!high || !low || high <= low || price <= 0) return null;
  const position = ((price - low) / (high - low)) * 100;
  return Math.max(0, Math.min(100, position));
}

// Get color based on 52W position
function get52WColor(position: number): string {
  if (position >= 80) return 'var(--accent-green)';
  if (position <= 20) return 'var(--accent-red)';
  return 'var(--accent-yellow)';
}

export function MarketTable({ stocks, isLoading }: MarketTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { watchlists, addStock, removeStock } = useWatchlistStore();

  // Get all symbols in user watchlists (excluding default)
  const watchlistSymbols = useMemo(() => {
    const symbols = new Set<string>();
    watchlists.forEach(wl => {
      if (!wl.isDefault) {
        wl.symbols.forEach(s => symbols.add(s));
      }
    });
    return symbols;
  }, [watchlists]);

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      let aVal: number | string = a[sortKey] ?? 0;
      let bVal: number | string = b[sortKey] ?? 0;

      if (sortKey === 'shortName') {
        aVal = a.shortName.toLowerCase();
        bVal = b.shortName.toLowerCase();
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      if (sortOrder === 'asc') {
        return (aVal as number) - (bVal as number);
      }
      return (bVal as number) - (aVal as number);
    });
  }, [stocks, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'shortName' ? 'asc' : 'desc');
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Virtual scrolling calculations
  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
  const endIndex = Math.min(startIndex + VISIBLE_ROWS, sortedStocks.length);
  const visibleStocks = sortedStocks.slice(startIndex, endIndex);
  const totalHeight = sortedStocks.length * ROW_HEIGHT;
  const offsetY = startIndex * ROW_HEIGHT;

  // Fetch live data for visible stocks
  const visibleSymbols = useMemo(() => visibleStocks.map(s => s.symbol), [visibleStocks]);
  const { liveData, isLoading: isLiveLoading } = useBatchStocks(visibleSymbols);

  const toggleWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const userWatchlist = watchlists.find(wl => wl.id === 'my-watchlist');
    if (!userWatchlist) return;

    if (watchlistSymbols.has(symbol)) {
      removeStock(symbol, 'my-watchlist');
    } else {
      addStock(symbol, 'my-watchlist');
    }
  };

  const SortHeader = ({ label, sortKeyName, className = '' }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide hover:opacity-80 transition-opacity ${className}`}
      style={{ color: 'var(--text-muted)' }}
    >
      {label}
      {sortKey === sortKeyName ? (
        sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
      ) : (
        <ArrowUpDown size={14} className="opacity-40" />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-blue)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Mobile: 4 cols, Desktop: 7 cols */}
      <div
        className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 sm:gap-3 px-2 sm:px-4 py-3 border-b sticky top-0 z-10"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="w-8 flex items-center justify-center">
          {isLiveLoading && (
            <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
          )}
        </div>
        <SortHeader label="Stock" sortKeyName="shortName" className="justify-start" />
        <SortHeader label="Price" sortKeyName="price" className="justify-end" />
        <SortHeader label="Chg" sortKeyName="changePercent" className="justify-end" />
        <div
          className="text-xs font-semibold uppercase tracking-wide text-right hidden sm:flex items-center justify-end cursor-help"
          style={{ color: 'var(--text-muted)' }}
          title="52-Week Range: Shows where the current price sits between its 52-week low and high. Green = near high, Yellow = mid-range, Red = near low"
        >
          52W
        </div>
        <SortHeader label="Vol" sortKeyName="volume" className="justify-end hidden sm:flex" />
        <SortHeader label="MCap" sortKeyName="marketCap" className="justify-end hidden sm:flex" />
      </div>

      {/* Virtual scrolling container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleStocks.map((stock) => {
              // Use live data if available, fallback to static
              const live = liveData[stock.symbol];
              const price = live?.price || stock.price;
              const changePercent = live?.changePercent ?? stock.changePercent;
              const volume = live?.volume || stock.volume;
              const isPositive = changePercent >= 0;
              const isInWatchlist = watchlistSymbols.has(stock.symbol);

              // Calculate 52W position
              const position52W = live
                ? calc52WPosition(price, live.fiftyTwoWeekHigh, live.fiftyTwoWeekLow)
                : null;

              return (
                <Link
                  key={stock.symbol}
                  href={`/stock/${stock.symbol}`}
                  className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 sm:gap-3 px-2 sm:px-4 items-center border-b hover:bg-opacity-50 transition-colors"
                  style={{
                    height: ROW_HEIGHT,
                    borderColor: 'var(--border)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Watchlist star */}
                  <div className="w-8 flex justify-center">
                    <button
                      onClick={(e) => toggleWatchlist(stock.symbol, e)}
                      className="p-1 rounded-full hover:bg-opacity-20 transition-colors"
                      style={{
                        color: isInWatchlist ? 'var(--accent-yellow)' : 'var(--text-muted)'
                      }}
                    >
                      <Star size={14} fill={isInWatchlist ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Stock name */}
                  <div className="min-w-0">
                    <div className="font-semibold text-xs sm:text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {stock.shortName}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right whitespace-nowrap">
                    <span
                      className="font-semibold text-xs sm:text-sm"
                      style={{ color: live ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {formatPrice(price)}
                    </span>
                  </div>

                  {/* Change */}
                  <div className="text-right whitespace-nowrap">
                    <span
                      className="font-semibold text-xs sm:text-sm"
                      style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
                    >
                      {formatPercent(changePercent)}
                    </span>
                  </div>

                  {/* 52W Position - always show bar for consistent alignment, hidden on mobile */}
                  <div className="hidden sm:flex items-center justify-end">
                    <div
                      className="w-10 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                      title={position52W !== null
                        ? `${Math.round(position52W)}% between 52W low and high`
                        : 'Loading...'
                      }
                    >
                      {position52W !== null && (
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${position52W}%`,
                            backgroundColor: get52WColor(position52W),
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Volume - hidden on mobile */}
                  <div className="text-right whitespace-nowrap hidden sm:block">
                    <span className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {volume ? formatVolume(volume) : '-'}
                    </span>
                  </div>

                  {/* Market Cap - hidden on mobile */}
                  <div className="text-right whitespace-nowrap hidden sm:block">
                    <span className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {stock.marketCap > 0 ? formatMarketCap(stock.marketCap) : '-'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 border-t text-center"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-muted)'
        }}
      >
        <span className="text-xs">
          Showing {sortedStocks.length.toLocaleString()} stocks
        </span>
      </div>
    </div>
  );
}
