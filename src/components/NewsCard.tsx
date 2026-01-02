'use client';

import { ExternalLink, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface NewsCardProps {
  news: NewsItem[];
  loading?: boolean;
  title?: string;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function NewsCard({ news, loading, title = 'Market News' }: NewsCardProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-[var(--bg-secondary)] rounded w-full mb-2" />
              <div className="h-3 bg-[var(--bg-secondary)] rounded w-3/4" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (news.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No news available
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <div className="space-y-4">
        {news.map((item, index) => (
          <a
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium line-clamp-2 group-hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: 'var(--accent-blue)' }}>
                    {item.source}
                  </span>
                  {item.pubDate && (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={10} />
                        {formatTimeAgo(item.pubDate)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ExternalLink
                size={16}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
            {index < news.length - 1 && (
              <div className="border-b mt-4" style={{ borderColor: 'var(--border)' }} />
            )}
          </a>
        ))}
      </div>
    </Card>
  );
}
