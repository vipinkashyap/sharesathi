'use client';

import { useState } from 'react';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Stock } from '@/types';
import { formatPrice, formatPercent } from '@/lib/formatters';

interface TopMoversProps {
  gainers: Stock[];
  losers: Stock[];
}

export function TopMovers({ gainers, losers }: TopMoversProps) {
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');

  const stocks = activeTab === 'gainers' ? gainers : losers;

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Flame size={20} style={{ color: 'var(--accent-blue)' }} />
          Top Movers Today
        </h2>
        <Link
          href="/market"
          className="text-sm font-medium"
          style={{ color: 'var(--accent-blue)' }}
        >
          See all
        </Link>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-lg p-1 mb-3"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <button
          onClick={() => setActiveTab('gainers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors touch-target ${
            activeTab === 'gainers' ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: activeTab === 'gainers' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'gainers' ? 'var(--accent-green)' : 'var(--text-muted)',
          }}
        >
          <TrendingUp size={16} />
          Gainers
        </button>
        <button
          onClick={() => setActiveTab('losers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors touch-target ${
            activeTab === 'losers' ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: activeTab === 'losers' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'losers' ? 'var(--accent-red)' : 'var(--text-muted)',
          }}
        >
          <TrendingDown size={16} />
          Losers
        </button>
      </div>

      {/* Stock list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {stocks.slice(0, 5).map((stock, index) => {
          const isPositive = stock.changePercent >= 0;
          const colorClass = isPositive ? 'text-gain' : 'text-loss';

          return (
            <Link
              key={stock.symbol}
              href={`/stock/${stock.symbol}`}
              className="flex items-center justify-between py-3 px-4 border-b last:border-b-0 transition-colors active:bg-[var(--bg-secondary)] touch-target"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: isPositive ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)',
                    color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}
                >
                  {index + 1}
                </span>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {stock.shortName}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatPrice(stock.price)}
                </div>
                <div className={`text-sm font-medium ${colorClass}`}>
                  {formatPercent(stock.changePercent)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
