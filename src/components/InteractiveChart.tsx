'use client';

import { useState, useMemo, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y' | '10Y';

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

const TIME_RANGES: { key: TimeRange; label: string; interval: string; range: string; tooltip: string; description: string }[] = [
  {
    key: '1D',
    label: '1D',
    interval: '5m',
    range: '1d',
    tooltip: 'Today\'s price movement',
    description: 'Intraday data at 5-minute intervals. Change compared to yesterday\'s close.',
  },
  {
    key: '1W',
    label: '1W',
    interval: '1h',
    range: '5d',
    tooltip: 'Last 5 trading days',
    description: 'Hourly data for the past week. Change from week\'s opening price.',
  },
  {
    key: '1M',
    label: '1M',
    interval: '1d',
    range: '1mo',
    tooltip: 'Last 30 days',
    description: 'Daily closing prices for past month. Change from month\'s first price.',
  },
  {
    key: '3M',
    label: '3M',
    interval: '1d',
    range: '3mo',
    tooltip: 'Last 3 months',
    description: 'Daily closing prices for past 3 months. Change from period\'s first price.',
  },
  {
    key: '1Y',
    label: '1Y',
    interval: '1wk',
    range: '1y',
    tooltip: 'Last 1 year',
    description: 'Weekly closing prices for past year. Change from year\'s first price.',
  },
  {
    key: '5Y',
    label: '5Y',
    interval: '1mo',
    range: '5y',
    tooltip: 'Last 5 years',
    description: 'Monthly closing prices for past 5 years. Change from 5 years ago.',
  },
  {
    key: '10Y',
    label: '10Y',
    interval: '1mo',
    range: '10y',
    tooltip: 'Last 10 years or since listing',
    description: 'Monthly closing prices. For newer stocks, shows data since IPO/listing.',
  },
];

export function InteractiveChart({ symbol, initialData, currentPrice, previousClose }: InteractiveChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1W');
  const [chartData, setChartData] = useState<PricePoint[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ price: number; date: string; x: number; y: number } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  // chartPreviousClose from Yahoo API - the price at the START of the range
  const [rangeRefPrice, setRangeRefPrice] = useState<number | null>(null);

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
          // Use Yahoo's chartPreviousClose for accurate reference price
          if (data.chartPreviousClose) {
            setRangeRefPrice(data.chartPreviousClose);
          } else {
            setRangeRefPrice(null);
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

    // Use Yahoo's chartPreviousClose if available - this is the industry standard reference
    // For 1D, we still use previousClose from stock data (same as header)
    // For other periods, use rangeRefPrice from chart API (Yahoo's chartPreviousClose)
    const refPrice = selectedRange === '1D'
      ? previousClose
      : (rangeRefPrice || prices[0]); // Fallback to first price if API didn't provide it
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
  }, [chartData, selectedRange, previousClose, rangeRefPrice]);

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
      <div className="flex items-center justify-center gap-1 mb-4">
        <div className="flex rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              onClick={() => setSelectedRange(range.key)}
              className="px-2.5 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: selectedRange === range.key ? 'var(--accent-blue)' : 'transparent',
                color: selectedRange === range.key ? 'white' : 'var(--text-secondary)',
              }}
              title={range.tooltip}
            >
              {range.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowHelpModal(true)}
          className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] transition-colors ml-1"
          title="How is chart data calculated?"
          aria-label="Help"
        >
          <HelpCircle size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
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
            // Use Yahoo's chartPreviousClose for consistent calculations
            // For 1D, use previousClose (matches header). For others, use rangeRefPrice from API
            const refPrice = selectedRange === '1D'
              ? previousClose
              : (rangeRefPrice || chartData[0]?.close || previousClose);
            const lastPrice = chartData[chartData.length - 1]?.close || currentPrice;
            const change = lastPrice - refPrice;
            const changePct = refPrice > 0 ? (change / refPrice) * 100 : 0;
            const isUp = change >= 0;

            // Format period text
            const periodText = selectedRange === '1D' ? 'today' :
              selectedRange === '1W' ? 'past 1 week' :
              selectedRange === '1M' ? 'past 1 month' :
              selectedRange === '3M' ? 'past 3 months' :
              selectedRange === '1Y' ? 'past 1 year' :
              selectedRange === '5Y' ? 'past 5 years' :
              'past 10 years';

            return (
              <span
                className="text-sm font-medium"
                style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}
              >
                {isUp ? '+' : ''}{formatPrice(change)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                  {periodText}
                </span>
              </span>
            );
          })()}
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl p-5 max-h-[80vh] overflow-auto"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Chart Time Ranges
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full hover:bg-[var(--bg-secondary)]"
              >
                <X size={20} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="space-y-4">
              {TIME_RANGES.map((range) => (
                <div key={range.key} className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
                    >
                      {range.label}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {range.tooltip}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {range.description}
                  </p>
                </div>
              ))}

              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  How Change % is Calculated
                </h3>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                  For <strong>1D</strong>: Compares current price to yesterday&apos;s closing price.
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  For <strong>other periods</strong>: Compares current price to the first price point in the selected range.
                </p>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Data Source
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Chart data from Yahoo Finance (NSE preferred, BSE fallback). Prices delayed ~15-20 min during market hours.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-5 py-2.5 rounded-lg font-medium text-sm"
              style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
