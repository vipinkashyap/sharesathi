'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Stock } from '@/types';
import { formatPrice, formatMarketCap } from '@/lib/formatters';

interface WatchlistMetricsProps {
  stocks: Stock[];
}

export function WatchlistMetrics({ stocks }: WatchlistMetricsProps) {
  const metrics = useMemo(() => {
    if (stocks.length === 0) {
      return {
        totalValue: 0,
        totalMarketCap: 0,
        gainers: 0,
        losers: 0,
        unchanged: 0,
        avgChange: 0,
        topGainer: null as Stock | null,
        topLoser: null as Stock | null,
        totalChange: 0,
      };
    }

    const stocksWithPrice = stocks.filter(s => s.price > 0);

    const gainers = stocksWithPrice.filter(s => s.changePercent > 0);
    const losers = stocksWithPrice.filter(s => s.changePercent < 0);
    const unchanged = stocksWithPrice.filter(s => s.changePercent === 0);

    const avgChange = stocksWithPrice.length > 0
      ? stocksWithPrice.reduce((sum, s) => sum + s.changePercent, 0) / stocksWithPrice.length
      : 0;

    const topGainer = gainers.length > 0
      ? gainers.reduce((max, s) => s.changePercent > max.changePercent ? s : max)
      : null;

    const topLoser = losers.length > 0
      ? losers.reduce((min, s) => s.changePercent < min.changePercent ? s : min)
      : null;

    const totalMarketCap = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
    const totalChange = stocks.reduce((sum, s) => sum + s.change, 0);

    return {
      totalValue: stocks.reduce((sum, s) => sum + s.price, 0),
      totalMarketCap,
      gainers: gainers.length,
      losers: losers.length,
      unchanged: unchanged.length,
      avgChange,
      topGainer,
      topLoser,
      totalChange,
    };
  }, [stocks]);

  const isPositive = metrics.avgChange >= 0;

  return (
    <div className="space-y-3">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Watchlist Performance
            </span>
          </div>
          <div
            className="text-xl font-bold"
            style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
          >
            {isPositive ? '+' : ''}{metrics.avgChange.toFixed(2)}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            avg change today
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <PieChart size={16} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Market Cap
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatMarketCap(metrics.totalMarketCap)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            total watchlist
          </div>
        </Card>
      </div>

      {/* Gainers vs Losers Bar */}
      <Card className="p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Today&apos;s Movement
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {stocks.length} stocks
          </span>
        </div>

        {/* Visual bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-[var(--bg-secondary)] mb-2">
          {metrics.gainers > 0 && (
            <div
              className="h-full"
              style={{
                width: `${(metrics.gainers / stocks.length) * 100}%`,
                backgroundColor: 'var(--accent-green)',
              }}
            />
          )}
          {metrics.unchanged > 0 && (
            <div
              className="h-full"
              style={{
                width: `${(metrics.unchanged / stocks.length) * 100}%`,
                backgroundColor: 'var(--text-muted)',
              }}
            />
          )}
          {metrics.losers > 0 && (
            <div
              className="h-full"
              style={{
                width: `${(metrics.losers / stocks.length) * 100}%`,
                backgroundColor: 'var(--accent-red)',
              }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} style={{ color: 'var(--accent-green)' }} />
            <span style={{ color: 'var(--accent-green)' }}>{metrics.gainers} up</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>{metrics.unchanged} unchanged</span>
          <div className="flex items-center gap-1">
            <TrendingDown size={12} style={{ color: 'var(--accent-red)' }} />
            <span style={{ color: 'var(--accent-red)' }}>{metrics.losers} down</span>
          </div>
        </div>
      </Card>

      {/* Top Movers */}
      {(metrics.topGainer || metrics.topLoser) && (
        <div className="grid grid-cols-2 gap-3">
          {metrics.topGainer && (
            <Card className="p-3">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Top Gainer
              </div>
              <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {metrics.topGainer.shortName}
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp size={14} style={{ color: 'var(--accent-green)' }} />
                <span className="font-bold" style={{ color: 'var(--accent-green)' }}>
                  +{metrics.topGainer.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatPrice(metrics.topGainer.price)}
              </div>
            </Card>
          )}

          {metrics.topLoser && (
            <Card className="p-3">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Top Loser
              </div>
              <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {metrics.topLoser.shortName}
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown size={14} style={{ color: 'var(--accent-red)' }} />
                <span className="font-bold" style={{ color: 'var(--accent-red)' }}>
                  {metrics.topLoser.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatPrice(metrics.topLoser.price)}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
