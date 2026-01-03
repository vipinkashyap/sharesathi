'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Star, Plus, X, Settings2, Lock } from 'lucide-react';
import { Stock } from '@/types';
import { useWatchlistStore } from '@/store/watchlistStore';
import { formatPrice, formatPercent } from '@/lib/formatters';
import { Card } from '@/components/ui/Card';
import { WatchlistMetrics } from '@/components/WatchlistMetrics';
import { useRouter } from 'next/navigation';
import WatchlistSelector from '@/components/WatchlistSelector';
import CreateWatchlistModal from '@/components/CreateWatchlistModal';
import WatchlistManager from '@/components/WatchlistManager';

export default function WatchlistPage() {
  const router = useRouter();
  const watchlists = useWatchlistStore((state) => state.watchlists);
  const activeWatchlistId = useWatchlistStore((state) => state.activeWatchlistId);
  const setActiveWatchlist = useWatchlistStore((state) => state.setActiveWatchlist);
  const removeStock = useWatchlistStore((state) => state.removeStock);

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId);
  const isReadOnly = activeWatchlist?.isDefault || false;

  // Fetch live stock data from batch API
  const fetchStocks = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return [];
    try {
      const response = await fetch(`/api/stocks/batch?symbols=${symbols.join(',')}`);
      if (!response.ok) return [];
      const data = await response.json();
      return symbols
        .map((symbol) => data.stocks?.[symbol])
        .filter((s): s is Stock => s !== undefined);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const loadStocks = async () => {
      setLoading(true);
      if (activeWatchlist && activeWatchlist.symbols.length > 0) {
        const stockData = await fetchStocks(activeWatchlist.symbols);
        setStocks(stockData);
      } else {
        setStocks([]);
      }
      setLoading(false);
    };
    loadStocks();
  }, [activeWatchlist, fetchStocks]);

  const handleWatchlistCreated = (id: string) => {
    setActiveWatchlist(id);
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Watchlists
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManagerModal(true)}
              className="touch-target flex items-center justify-center p-2 rounded-lg"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
              aria-label="Manage watchlists"
            >
              <Settings2 size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <Link
              href="/search"
              className="touch-target flex items-center gap-1.5 px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Add</span>
            </Link>
          </div>
        </div>

        {/* Watchlist Tabs */}
        <div className="mt-3">
          <WatchlistSelector
            watchlists={watchlists}
            activeWatchlistId={activeWatchlistId}
            onSelect={setActiveWatchlist}
            onCreate={() => setShowCreateModal(true)}
          />
        </div>

        {activeWatchlist && stocks.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                <Lock size={10} />
                Read-only
              </span>
            )}
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {stocks.length} stock{stocks.length > 1 ? 's' : ''}
            </p>
          </div>
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
              {activeWatchlist?.name || 'Watchlist'} is empty
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {isReadOnly
                ? 'This is a read-only watchlist'
                : 'Add your favorite stocks to track them here'}
            </p>
            {!isReadOnly && (
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium touch-target"
                style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
              >
                <Plus size={18} />
                Add First Stock
              </Link>
            )}
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

                  {/* Remove button - only for editable watchlists */}
                  {!isReadOnly && (
                    <button
                      onClick={() => removeStock(stock.symbol, activeWatchlistId)}
                      className="touch-target flex items-center justify-center px-3 py-4 border-l hover:bg-[var(--accent-red-bg)] transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                      aria-label={`Remove ${stock.shortName} from watchlist`}
                    >
                      <X size={18} style={{ color: 'var(--accent-red)' }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWatchlistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleWatchlistCreated}
      />
      <WatchlistManager
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
      />
    </div>
  );
}
