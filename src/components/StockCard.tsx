'use client';

import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Stock } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatPrice, formatPercent } from '@/lib/formatters';
import { useWatchlistStore } from '@/store/watchlistStore';

interface StockCardProps {
  stock: Stock;
  showWatchlistButton?: boolean;
  compact?: boolean;
}

export function StockCard({ stock, showWatchlistButton = false, compact = false }: StockCardProps) {
  const router = useRouter();
  const { isInWatchlist, addStock, removeStock } = useWatchlistStore();
  const inWatchlist = isInWatchlist(stock.symbol);

  const isPositive = stock.changePercent >= 0;
  const colorClass = isPositive ? 'text-gain' : 'text-loss';
  const bgClass = isPositive ? 'bg-gain' : 'bg-loss';

  const handleClick = () => {
    router.push(`/stock/${stock.symbol}`);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeStock(stock.symbol);
    } else {
      addStock(stock.symbol);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="flex items-center justify-between py-3 px-4 border-b border-[var(--border)] last:border-b-0 cursor-pointer active:bg-[var(--bg-secondary)] transition-colors touch-target"
      >
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
            {stock.shortName}
          </div>
          <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
            {stock.name}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              {formatPrice(stock.price)}
            </div>
            <div className={`text-sm font-medium ${colorClass}`}>
              {formatPercent(stock.changePercent)}
            </div>
          </div>
          {showWatchlistButton && (
            <button
              onClick={handleWatchlistClick}
              className="touch-target flex items-center justify-center p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <Star
                size={22}
                className={inWatchlist ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-muted)]'}
              />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card onClick={handleClick} className="touch-target">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {stock.shortName}
            </span>
            {showWatchlistButton && (
              <button
                onClick={handleWatchlistClick}
                className="touch-target flex items-center justify-center p-1"
                aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <Star
                  size={18}
                  className={inWatchlist ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-muted)]'}
                />
              </button>
            )}
          </div>
          <div className="text-sm truncate mt-1" style={{ color: 'var(--text-secondary)' }}>
            {stock.name}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            {formatPrice(stock.price)}
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={`text-sm font-medium ${colorClass}`}>
              {isPositive ? '+' : ''}₹{Math.abs(stock.change).toFixed(2)}
            </span>
            <span
              className={`text-sm px-2 py-0.5 rounded-full font-medium ${bgClass}`}
              style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
            >
              {formatPercent(stock.changePercent)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
