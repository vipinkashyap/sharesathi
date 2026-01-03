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
type ChangePeriod = 'day' | 'week' | 'month' | 'year' | '5year' | '10year';

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
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>('day');
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

  // Get label for change column based on period
  const changeLabel = changePeriod === 'day' ? '1D' : changePeriod === 'week' ? '1W' : changePeriod === 'month' ? '1M' : changePeriod === 'year' ? '1Y' : changePeriod === '5year' ? '5Y' : '10Y';

  return (
    <div className="flex flex-col h-full">
      {/* Period toggle bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Change period:
        </span>
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {(['day', 'week', 'month', 'year', '5year', '10year'] as ChangePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setChangePeriod(period)}
              className="px-2 sm:px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: changePeriod === period ? 'var(--accent-blue)' : 'transparent',
                color: changePeriod === period ? 'white' : 'var(--text-secondary)',
              }}
            >
              {period === 'day' ? '1D' : period === 'week' ? '1W' : period === 'month' ? '1M' : period === 'year' ? '1Y' : period === '5year' ? '5Y' : '10Y'}
            </button>
          ))}
        </div>
        {isLiveLoading && (
          <div className="flex items-center gap-1.5">
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
              Loading...
            </span>
          </div>
        )}
      </div>

      {/* Header - Mobile: 4 cols, Desktop: 7 cols */}
      {/* Fixed min-widths prevent layout shift during loading */}
      <div
        className="grid grid-cols-[32px_1fr_minmax(70px,auto)_minmax(55px,auto)] sm:grid-cols-[32px_1fr_minmax(80px,auto)_minmax(60px,auto)_48px_minmax(50px,auto)_minmax(70px,auto)] gap-2 sm:gap-3 px-2 sm:px-4 py-3 border-b sticky top-0 z-10"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="w-8" />
        <SortHeader label="Stock" sortKeyName="shortName" className="justify-start" />
        <SortHeader label="Price" sortKeyName="price" className="justify-end" />
        <SortHeader label={changeLabel} sortKeyName="changePercent" className="justify-end" />
        <div
          className="text-xs font-semibold uppercase tracking-wide text-right hidden sm:flex items-center justify-end gap-1 cursor-help"
          style={{ color: 'var(--text-muted)' }}
          title="52-Week Range indicator shows where the stock price is compared to its yearly low and high. Hover over the bar for details.

Green bar = Stock is near its 52-week HIGH (good momentum)
Yellow bar = Stock is in the middle range
Red bar = Stock is near its 52-week LOW"
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
              const volume = live?.volume || stock.volume;

              // Get change percent based on selected period
              let changePercent = live?.changePercent ?? stock.changePercent;
              if (live) {
                if (changePeriod === 'week') {
                  changePercent = live.changePercentWeek ?? changePercent;
                } else if (changePeriod === 'month') {
                  changePercent = live.changePercentMonth ?? changePercent;
                } else if (changePeriod === 'year') {
                  changePercent = live.changePercentYear ?? changePercent;
                } else if (changePeriod === '5year') {
                  changePercent = live.changePercent5Year ?? changePercent;
                } else if (changePeriod === '10year') {
                  changePercent = live.changePercent10Year ?? changePercent;
                }
              }
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
                  className="grid grid-cols-[32px_1fr_minmax(70px,auto)_minmax(55px,auto)] sm:grid-cols-[32px_1fr_minmax(80px,auto)_minmax(60px,auto)_48px_minmax(50px,auto)_minmax(70px,auto)] gap-2 sm:gap-3 px-2 sm:px-4 items-center border-b hover:bg-opacity-50 transition-colors"
                  style={{
                    height: ROW_HEIGHT,
                    borderColor: 'var(--border)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Watchlist star */}
                  <div className="flex justify-center">
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
                    {!live && changePeriod !== 'day' ? (
                      // Show skeleton for non-day periods until live data loads
                      <div
                        className="inline-block w-12 h-4 rounded animate-pulse"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      />
                    ) : (
                      <span
                        className="font-semibold text-xs sm:text-sm"
                        style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
                      >
                        {formatPercent(changePercent)}
                      </span>
                    )}
                  </div>

                  {/* 52W Position - always show bar for consistent alignment, hidden on mobile */}
                  <div className="hidden sm:flex items-center justify-end">
                    <div
                      className="w-10 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                      title={position52W !== null && live
                        ? `52-Week Position: ${Math.round(position52W)}%\n` +
                          `Low: ₹${live.fiftyTwoWeekLow?.toLocaleString('en-IN')}\n` +
                          `High: ₹${live.fiftyTwoWeekHigh?.toLocaleString('en-IN')}\n` +
                          (position52W >= 80 ? '● Near yearly high' : position52W <= 20 ? '● Near yearly low' : '● Mid-range')
                        : 'Loading 52-week data...'
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
