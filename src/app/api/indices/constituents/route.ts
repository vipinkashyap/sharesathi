import { NextRequest, NextResponse } from 'next/server';

interface NSEStockData {
  symbol: string;
  identifier: string;
  lastPrice: number;
  previousClose: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  yearHigh: number;
  yearLow: number;
  perChange365d: number;
  perChange30d: number;
  meta?: {
    companyName: string;
    industry: string;
  };
}

interface NSEIndexResponse {
  name: string;
  advance: {
    declines: string;
    advances: string;
    unchanged: string;
  };
  timestamp: string;
  data: NSEStockData[];
}

// Available indices on NSE
const INDEX_MAP: Record<string, string> = {
  'nifty50': 'NIFTY 50',
  'niftynext50': 'NIFTY NEXT 50',
  'nifty100': 'NIFTY 100',
  'nifty200': 'NIFTY 200',
  'nifty500': 'NIFTY 500',
  'niftybank': 'NIFTY BANK',
  'niftyit': 'NIFTY IT',
  'niftypharma': 'NIFTY PHARMA',
  'niftyauto': 'NIFTY AUTO',
  'niftyfmcg': 'NIFTY FMCG',
  'niftymetal': 'NIFTY METAL',
  'niftyrealty': 'NIFTY REALTY',
  'niftyenergy': 'NIFTY ENERGY',
  'niftymidcap50': 'NIFTY MIDCAP 50',
  'niftysmallcap50': 'NIFTY SMLCAP 50',
};

export async function GET(request: NextRequest) {
  const indexParam = request.nextUrl.searchParams.get('index') || 'nifty50';
  const indexName = INDEX_MAP[indexParam.toLowerCase()] || 'NIFTY 50';

  try {
    // NSE requires cookies to be set first - get all set-cookie headers
    const cookieResponse = await fetch('https://www.nseindia.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      cache: 'no-store',
    });

    // Extract cookies from response
    const setCookieHeaders = cookieResponse.headers.getSetCookie?.() || [];
    const cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');

    // Fetch index constituents
    const response = await fetch(
      `https://www.nseindia.com/api/equity-stockIndices?index=${encodeURIComponent(indexName)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cookie': cookies,
          'Referer': 'https://www.nseindia.com/',
        },
        signal: AbortSignal.timeout(15000),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(`NSE API failed for ${indexName}: ${response.status}`);
      return NextResponse.json({ error: 'Failed to fetch index data' }, { status: 500 });
    }

    const data: NSEIndexResponse = await response.json();

    // Transform the data - skip the first item which is the index itself
    const stocks = data.data
      .slice(1)
      .filter((stock) => stock.symbol && stock.lastPrice > 0)
      .map((stock) => ({
        symbol: stock.symbol,
        name: stock.meta?.companyName || stock.symbol,
        shortName: stock.symbol,
        price: stock.lastPrice,
        previousClose: stock.previousClose,
        change: stock.change,
        changePercent: stock.pChange,
        volume: stock.totalTradedVolume,
        yearHigh: stock.yearHigh,
        yearLow: stock.yearLow,
        changePercentYear: stock.perChange365d || 0,
        changePercentMonth: stock.perChange30d || 0,
        industry: stock.meta?.industry || '',
      }));

    return NextResponse.json({
      index: indexName,
      timestamp: data.timestamp,
      advance: {
        advances: parseInt(data.advance.advances),
        declines: parseInt(data.advance.declines),
        unchanged: parseInt(data.advance.unchanged),
      },
      stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error('Error fetching index constituents:', error);
    return NextResponse.json({ error: 'Failed to fetch index data' }, { status: 500 });
  }
}
