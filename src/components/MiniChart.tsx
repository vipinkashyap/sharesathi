'use client';

import { useMemo } from 'react';

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

export function MiniChart({ data, width = 300, height = 120, positive = true }: MiniChartProps) {
  const pathD = useMemo(() => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create smooth path
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    let path = `M ${points[0].x} ${height}`;
    path += ` L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    path += ` L ${points[points.length - 1].x} ${height}`;
    path += ' Z';

    return path;
  }, [data, width, height]);

  const strokeColor = positive ? 'var(--accent-green)' : 'var(--accent-red)';
  const fillColor = positive ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)';

  if (data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center"
      >
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No data available
        </span>
      </div>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`gradient-${positive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.6" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#gradient-${positive ? 'up' : 'down'})`}
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={width - 4}
          cy={(() => {
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min || 1;
            const chartHeight = height - 8;
            return 4 + chartHeight - ((data[data.length - 1] - min) / range) * chartHeight;
          })()}
          r="4"
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
