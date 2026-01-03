import { NextRequest, NextResponse } from 'next/server';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

async function fetchGoogleNews(query: string): Promise<NewsItem[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-IN&gl=IN&ceid=IN:en`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error('Google News fetch failed:', response.status);
      return [];
    }

    const xml = await response.text();

    // Parse XML (simple regex parsing for RSS)
    const items: NewsItem[] = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 25)) {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                   item.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const source = item.match(/<source.*?>(.*?)<\/source>/)?.[1] || 'News';

      if (title && link) {
        items.push({
          title: decodeHtmlEntities(title),
          link,
          pubDate,
          source: decodeHtmlEntities(source),
        });
      }
    }

    // Sort by date (most recent first)
    items.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });

    return items;
  } catch (error) {
    console.error('Error fetching Google News:', error);
    return [];
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const query = searchParams.get('q');

  let searchQuery = 'Indian stock market BSE NSE';

  if (symbol) {
    // Search for specific stock news
    searchQuery = `${symbol} stock BSE India`;
  } else if (query) {
    searchQuery = query;
  }

  const news = await fetchGoogleNews(searchQuery);

  return NextResponse.json({
    query: searchQuery,
    items: news,
    timestamp: new Date().toISOString(),
  });
}
