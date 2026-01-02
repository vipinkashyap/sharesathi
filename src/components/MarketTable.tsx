'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowUpDown, Star } from 'lucide-react';
import { formatPrice, formatPercent, formatMarketCap, formatVolume } from '@/lib/formatters';
import { useWatchlistStore } from '@/store/watchlistStore';

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
      {/* Header - Mobile: 4 cols, Desktop: 6 cols */}
      <div
        className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-4 px-3 sm:px-4 py-3 border-b sticky top-0 z-10"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="w-8"></div>
        <SortHeader label="Stock" sortKeyName="shortName" className="justify-start" />
        <SortHeader label="Price" sortKeyName="price" className="justify-end" />
        <SortHeader label="Chg" sortKeyName="changePercent" className="justify-end" />
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
              const isPositive = stock.changePercent >= 0;
              const isInWatchlist = watchlistSymbols.has(stock.symbol);

              return (
                <Link
                  key={stock.symbol}
                  href={`/stock/${stock.symbol}`}
                  className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-4 px-3 sm:px-4 items-center border-b hover:bg-opacity-50 transition-colors"
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
                      <Star size={16} fill={isInWatchlist ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Stock name */}
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {stock.shortName}
                    </div>
                    <div className="text-xs truncate hidden xs:block" style={{ color: 'var(--text-muted)' }}>
                      {stock.name}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right whitespace-nowrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatPrice(stock.price)}
                    </span>
                  </div>

                  {/* Change */}
                  <div className="text-right whitespace-nowrap">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
                    >
                      {formatPercent(stock.changePercent)}
                    </span>
                  </div>

                  {/* Volume - hidden on mobile */}
                  <div className="text-right whitespace-nowrap hidden sm:block">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {stock.volume ? formatVolume(stock.volume) : '-'}
                    </span>
                  </div>

                  {/* Market Cap - hidden on mobile */}
                  <div className="text-right whitespace-nowrap hidden sm:block">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
