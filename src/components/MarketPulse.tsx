'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatIndianNumber, formatPercent } from '@/lib/formatters';

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface ForexData {
  usdInr: number | null;
  date: string | null;
}

export function MarketPulse() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [forex, setForex] = useState<ForexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const [indicesRes, forexRes] = await Promise.all([
        fetch('/api/indices'),
        fetch('/api/forex'),
      ]);

      if (indicesRes.ok) {
        const data = await indicesRes.json();
        setIndices(data);
      }

      if (forexRes.ok) {
        const data = await forexRes.json();
        setForex(data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 1 minute during market hours
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-blue)' }} />
          Market Pulse
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 animate-pulse">
              <div className="h-4 w-12 bg-[var(--bg-secondary)] rounded mb-2" />
              <div className="h-6 w-16 bg-[var(--bg-secondary)] rounded mb-2" />
              <div className="h-4 w-10 bg-[var(--bg-secondary)] rounded" />
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
            onClick={fetchData}
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
            onClick={fetchData}
            className="text-xs flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={12} />
            {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {indices.map((index) => {
          const isPositive = index.changePercent >= 0;
          const bgClass = isPositive ? 'bg-gain' : 'bg-loss';
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <Card key={index.name} className="p-2.5">
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {index.name}
              </div>
              <div className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {formatIndianNumber(index.value)}
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon size={12} style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                <span
                  className={`text-xs px-1 py-0.5 rounded font-medium ${bgClass}`}
                  style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
                >
                  {formatPercent(index.changePercent)}
                </span>
              </div>
            </Card>
          );
        })}

        {/* USD/INR Card */}
        {forex?.usdInr && (
          <Card className="p-2.5">
            <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <DollarSign size={12} />
              USD/INR
            </div>
            <div className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              ₹{forex.usdInr.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              1 USD
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
