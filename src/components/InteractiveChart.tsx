'use client';

import { useState, useMemo, useEffect } from 'react';

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

interface PricePoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface InteractiveChartProps {
  symbol: string;
  initialData?: PricePoint[];
  currentPrice: number;
  previousClose: number;
}

const TIME_RANGES: { key: TimeRange; label: string; interval: string; range: string }[] = [
  { key: '1D', label: '1D', interval: '5m', range: '1d' },
  { key: '1W', label: '1W', interval: '1h', range: '5d' },
  { key: '1M', label: '1M', interval: '1d', range: '1mo' },
  { key: '3M', label: '3M', interval: '1d', range: '3mo' },
  { key: '1Y', label: '1Y', interval: '1wk', range: '1y' },
];

export function InteractiveChart({ symbol, initialData, currentPrice, previousClose }: InteractiveChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1W');
  const [chartData, setChartData] = useState<PricePoint[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ price: number; date: string; x: number; y: number } | null>(null);

  const width = 320;
  const height = 180;
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const rangeConfig = TIME_RANGES.find(r => r.key === selectedRange);
        if (!rangeConfig) return;

        const response = await fetch(
          `/api/stock/${symbol}/chart?interval=${rangeConfig.interval}&range=${rangeConfig.range}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.priceHistory && data.priceHistory.length > 0) {
            setChartData(data.priceHistory);
          }
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, selectedRange]);

  const { pathD, areaPath, points, minPrice, maxPrice, isPositive, referencePrice } = useMemo(() => {
    const prices = chartData.map(p => p.close).filter(c => c != null && c > 0);
    if (prices.length < 2) {
      return { pathD: '', areaPath: '', points: [], minPrice: 0, maxPrice: 0, isPositive: true, referencePrice: previousClose };
    }

    // For intraday, compare to previous close. For longer periods, compare to first price
    const refPrice = selectedRange === '1D' ? previousClose : prices[0];
    const positive = prices[prices.length - 1] >= refPrice;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const priceRange = max - min || 1;
    const paddingPercent = 0.1;
    const adjustedMin = min - priceRange * paddingPercent;
    const adjustedMax = max + priceRange * paddingPercent;
    const adjustedRange = adjustedMax - adjustedMin;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const pts = chartData
      .filter(p => p.close != null && p.close > 0)
      .map((point, index, arr) => {
        const x = padding.left + (index / (arr.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((point.close - adjustedMin) / adjustedRange) * chartHeight;
        return { x, y, price: point.close, date: point.date };
      });

    // Line path
    let line = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      line += ` L ${pts[i].x} ${pts[i].y}`;
    }

    // Area path
    let area = `M ${pts[0].x} ${height - padding.bottom}`;
    area += ` L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      area += ` L ${pts[i].x} ${pts[i].y}`;
    }
    area += ` L ${pts[pts.length - 1].x} ${height - padding.bottom}`;
    area += ' Z';

    return { pathD: line, areaPath: area, points: pts, minPrice: min, maxPrice: max, isPositive: positive, referencePrice: refPrice };
  }, [chartData, selectedRange, previousClose]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find closest point
    let closestPoint = points[0];
    let closestDist = Math.abs(mouseX - points[0].x);

    for (const pt of points) {
      const dist = Math.abs(mouseX - pt.x);
      if (dist < closestDist) {
        closestDist = dist;
        closestPoint = pt;
      }
    }

    setHoveredPoint({
      price: closestPoint.price,
      date: closestPoint.date,
      x: closestPoint.x,
      y: closestPoint.y,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (selectedRange === '1D') {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const strokeColor = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';
  const fillColor = isPositive ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)';

  return (
    <div className="w-full">
      {/* Time Range Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        {TIME_RANGES.map((range) => (
          <button
            key={range.key}
            onClick={() => setSelectedRange(range.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRange === range.key
                ? 'text-white'
                : 'hover:bg-[var(--bg-secondary)]'
            }`}
            style={{
              backgroundColor: selectedRange === range.key ? 'var(--accent-blue)' : 'transparent',
              color: selectedRange === range.key ? 'white' : 'var(--text-secondary)',
            }}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Hovered Price Display */}
      <div className="h-8 flex items-center justify-center mb-2">
        {hoveredPoint ? (
          <div className="text-center">
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {formatPrice(hoveredPoint.price)}
            </span>
            <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
              {formatDate(hoveredPoint.date)}
            </span>
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Touch chart to see price
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex justify-center relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/50 z-10 rounded-lg">
            <div className="animate-spin h-6 w-6 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full" />
          </div>
        )}
        <svg
          width={width}
          height={height}
          className="overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = touch.clientX - rect.left;

            let closestPoint = points[0];
            let closestDist = Math.abs(mouseX - points[0].x);
            for (const pt of points) {
              const dist = Math.abs(mouseX - pt.x);
              if (dist < closestDist) {
                closestDist = dist;
                closestPoint = pt;
              }
            }
            if (closestPoint) {
              setHoveredPoint({
                price: closestPoint.price,
                date: closestPoint.date,
                x: closestPoint.x,
                y: closestPoint.y,
              });
            }
          }}
          onTouchEnd={handleMouseLeave}
        >
          {/* Gradient */}
          <defs>
            <linearGradient id={`chart-gradient-${isPositive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={padding.left}
              y1={padding.top + (height - padding.top - padding.bottom) * pct}
              x2={width - padding.right}
              y2={padding.top + (height - padding.top - padding.bottom) * pct}
              stroke="var(--border)"
              strokeDasharray="4,4"
              opacity="0.5"
            />
          ))}

          {pathD && areaPath && (
            <>
              {/* Area fill */}
              <path d={areaPath} fill={`url(#chart-gradient-${isPositive ? 'up' : 'down'})`} />

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover line and dot */}
              {hoveredPoint && (
                <>
                  <line
                    x1={hoveredPoint.x}
                    y1={padding.top}
                    x2={hoveredPoint.x}
                    y2={height - padding.bottom}
                    stroke="var(--text-muted)"
                    strokeDasharray="4,4"
                    opacity="0.5"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="6"
                    fill={strokeColor}
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="3"
                    fill="white"
                  />
                </>
              )}

              {/* End dot (when not hovering) */}
              {!hoveredPoint && points.length > 0 && (
                <circle
                  cx={points[points.length - 1].x}
                  cy={points[points.length - 1].y}
                  r="4"
                  fill={strokeColor}
                />
              )}
            </>
          )}

          {/* Price labels */}
          {maxPrice > 0 && (
            <>
              <text
                x={width - padding.right - 5}
                y={padding.top + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {formatPrice(maxPrice)}
              </text>
              <text
                x={width - padding.right - 5}
                y={height - padding.bottom - 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {formatPrice(minPrice)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Range change indicator */}
      {chartData.length > 0 && (
        <div className="text-center mt-3">
          {(() => {
            // For 1D, use previous close as reference (matches header display)
            // For longer periods, use first price in the range
            const refPrice = selectedRange === '1D' ? previousClose : (chartData[0]?.close || previousClose);
            const lastPrice = chartData[chartData.length - 1]?.close || currentPrice;
            const change = lastPrice - refPrice;
            const changePct = refPrice > 0 ? (change / refPrice) * 100 : 0;
            const isUp = change >= 0;

            return (
              <span
                className="text-sm font-medium"
                style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}
              >
                {isUp ? '+' : ''}{formatPrice(change)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                  {selectedRange === '1D' ? 'today' : `past ${selectedRange.replace('1', '1 ').toLowerCase()}`}
                </span>
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}
