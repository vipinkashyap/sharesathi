'use client';

import { useState, useEffect, useCallback } from 'react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export function useNews(symbol?: string) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
      const response = await fetch(`/api/news${params}`);

      if (response.ok) {
        const data = await response.json();
        setNews(data.items || []);
        setError(null);
      } else {
        setError('Failed to fetch news');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, loading, error, refetch: fetchNews };
}
