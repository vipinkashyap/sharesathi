'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatIndianNumber, formatPercent } from '@/lib/formatters';

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export function MarketPulse() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchIndices = async () => {
    try {
      const response = await fetch('/api/indices');
      if (response.ok) {
        const data = await response.json();
        setIndices(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching indices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();

    // Auto-refresh every 1 minute during market hours
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-blue)' }} />
          Market Pulse
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-3 animate-pulse">
              <div className="h-4 w-16 bg-[var(--bg-secondary)] rounded mb-2" />
              <div className="h-6 w-24 bg-[var(--bg-secondary)] rounded mb-2" />
              <div className="h-4 w-14 bg-[var(--bg-secondary)] rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (indices.length === 0 || indices.every(i => i.value === 0)) {
    return (
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-blue)' }} />
          Market Pulse
        </h2>
        <Card className="p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Market data unavailable
          </p>
          <button
            onClick={fetchIndices}
            className="mt-2 text-sm font-medium flex items-center gap-1 mx-auto"
            style={{ color: 'var(--accent-blue)' }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-blue)' }} />
          Market Pulse
        </h2>
        {lastUpdated && (
          <button
            onClick={fetchIndices}
            className="text-xs flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={12} />
            {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {indices.map((index) => {
          const isPositive = index.changePercent >= 0;
          const colorClass = isPositive ? 'text-gain' : 'text-loss';
          const bgClass = isPositive ? 'bg-gain' : 'bg-loss';
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <Card key={index.name} className="p-3">
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {index.name}
              </div>
              <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {formatIndianNumber(index.value)}
              </div>
              <div className="flex items-center gap-1.5">
                <TrendIcon size={14} className={colorClass} />
                <span
                  className={`text-sm px-1.5 py-0.5 rounded font-medium ${bgClass}`}
                  style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
                >
                  {formatPercent(index.changePercent)}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
