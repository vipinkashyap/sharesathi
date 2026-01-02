'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Plus, X } from 'lucide-react';
import { Stock } from '@/types';
import { getStocksBySymbols } from '@/services/stockApi';
import { useWatchlistStore } from '@/store/watchlistStore';
import { formatPrice, formatPercent } from '@/lib/formatters';
import { Card } from '@/components/ui/Card';
import { WatchlistMetrics } from '@/components/WatchlistMetrics';
import { useRouter } from 'next/navigation';

export default function WatchlistPage() {
  const router = useRouter();
  const { symbols, removeStock } = useWatchlistStore();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stockData = getStocksBySymbols(symbols);
    setStocks(stockData);
    setLoading(false);
  }, [symbols]);

  return (
    <div className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Watchlist
          </h1>
          <Link
            href="/search"
            className="touch-target flex items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add</span>
          </Link>
        </div>
        {stocks.length > 0 && (
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {stocks.length} stock{stocks.length > 1 ? 's' : ''} in your watchlist
          </p>
        )}
      </header>

      {/* Metrics */}
      {stocks.length > 0 && !loading && (
        <div className="px-4 py-4">
          <WatchlistMetrics stocks={stocks} />
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-[var(--bg-secondary)] rounded" />
                    <div className="h-4 w-36 bg-[var(--bg-secondary)] rounded" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-5 w-20 bg-[var(--bg-secondary)] rounded" />
                    <div className="h-4 w-16 bg-[var(--bg-secondary)] rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : stocks.length === 0 ? (
          <Card className="py-10 text-center">
            <Star size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Your watchlist is empty
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Add your favorite stocks to track them here
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium touch-target"
              style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
            >
              <Plus size={18} />
              Add First Stock
            </Link>
          </Card>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            {stocks.map((stock) => {
              const isPositive = stock.changePercent >= 0;
              const colorClass = isPositive ? 'text-gain' : 'text-loss';

              return (
                <div
                  key={stock.symbol}
                  className="flex items-center border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {/* Stock info - clickable */}
                  <div
                    onClick={() => router.push(`/stock/${stock.symbol}`)}
                    className="flex-1 flex items-center justify-between py-3 px-4 cursor-pointer active:bg-[var(--bg-secondary)] transition-colors touch-target"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                        {stock.shortName}
                      </div>
                      <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                        {stock.name}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice(stock.price)}
                      </div>
                      <div className={`text-sm font-medium ${colorClass}`}>
                        {formatPercent(stock.changePercent)}
                      </div>
                    </div>
                  </div>

                  {/* Remove button - separate from clickable area */}
                  <button
                    onClick={() => removeStock(stock.symbol)}
                    className="touch-target flex items-center justify-center px-3 py-4 border-l hover:bg-[var(--accent-red-bg)] transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    aria-label={`Remove ${stock.shortName} from watchlist`}
                  >
                    <X size={18} style={{ color: 'var(--accent-red)' }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
