'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getMarketStatus, getMarketStatusText, formatTime } from '@/lib/marketHours';

export function MarketStatus() {
  const [status, setStatus] = useState(getMarketStatus());
  const [statusText, setStatusText] = useState(getMarketStatusText());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Update status every minute
    const interval = setInterval(() => {
      setStatus(getMarketStatus());
      setStatusText(getMarketStatusText());
    }, 60000);

    setLastUpdated(new Date());

    return () => clearInterval(interval);
  }, []);

  const isOpen = status === 'open' || status === 'pre-open';
  const statusColor = isOpen ? 'var(--accent-green)' : 'var(--text-muted)';
  const dotColor = isOpen ? 'bg-green-500' : 'bg-gray-400';

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor} ${isOpen ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium" style={{ color: statusColor }}>
          {statusText}
        </span>
      </div>
      {lastUpdated && (
        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Clock size={14} />
          <span>Updated {formatTime(lastUpdated)}</span>
        </div>
      )}
    </div>
  );
}
