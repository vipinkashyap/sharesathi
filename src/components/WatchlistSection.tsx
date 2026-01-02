'use client';

import { Star, Plus, Lock } from 'lucide-react';
import Link from 'next/link';
import { Stock, Watchlist } from '@/types';
import { StockCard } from '@/components/StockCard';
import { Card } from '@/components/ui/Card';

interface WatchlistSectionProps {
  stocks: Stock[];
  watchlist?: Watchlist;
  loading?: boolean;
}

export function WatchlistSection({ stocks, watchlist, loading = false }: WatchlistSectionProps) {
  const watchlistName = watchlist?.name || 'My Watchlist';
  const isReadOnly = watchlist?.isDefault || false;

  if (loading) {
    return (
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Star size={20} style={{ color: 'var(--accent-blue)' }} />
          {watchlistName}
        </h2>
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
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Star size={20} style={{ color: 'var(--accent-blue)' }} />
          {watchlistName}
          {isReadOnly && <Lock size={14} className="text-gray-400" />}
        </h2>
        <Card className="py-10 text-center">
          <Star size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {watchlistName} is empty
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
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Star size={20} style={{ color: 'var(--accent-blue)' }} />
          {watchlistName} ({stocks.length})
          {isReadOnly && <Lock size={14} className="text-gray-400" />}
        </h2>
        <Link
          href="/watchlist"
          className="text-sm font-medium"
          style={{ color: 'var(--accent-blue)' }}
        >
          See all
        </Link>
      </div>
      <div className="space-y-3">
        {stocks.slice(0, 5).map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
      {stocks.length > 5 && (
        <Link
          href="/watchlist"
          className="block text-center py-3 mt-3 font-medium"
          style={{ color: 'var(--accent-blue)' }}
        >
          View {stocks.length - 5} more stocks
        </Link>
      )}
    </div>
  );
}
