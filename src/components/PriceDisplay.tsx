'use client';

import { formatPrice, formatPercent } from '@/lib/formatters';

interface PriceDisplayProps {
  price: number;
  change: number;
  changePercent: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
}

export function PriceDisplay({
  price,
  change,
  changePercent,
  size = 'md',
  showChange = true,
}: PriceDisplayProps) {
  const isPositive = change >= 0;
  const colorClass = isPositive ? 'text-gain' : 'text-loss';
  const bgClass = isPositive ? 'bg-gain' : 'bg-loss';

  const sizeClasses = {
    sm: {
      price: 'text-base font-semibold',
      change: 'text-sm',
      badge: 'text-xs px-1.5 py-0.5',
    },
    md: {
      price: 'text-xl font-bold',
      change: 'text-base',
      badge: 'text-sm px-2 py-1',
    },
    lg: {
      price: 'text-3xl font-bold',
      change: 'text-lg',
      badge: 'text-base px-3 py-1.5',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col">
      <span className={classes.price} style={{ color: 'var(--text-primary)' }}>
        {formatPrice(price)}
      </span>
      {showChange && (
        <div className="flex items-center gap-2 mt-1">
          <span className={`${classes.change} ${colorClass}`}>
            {isPositive ? '+' : ''}₹{Math.abs(change).toFixed(2)}
          </span>
          <span
            className={`${classes.badge} ${bgClass} rounded-full font-medium`}
            style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
          >
            {formatPercent(changePercent)}
          </span>
        </div>
      )}
    </div>
  );
}
