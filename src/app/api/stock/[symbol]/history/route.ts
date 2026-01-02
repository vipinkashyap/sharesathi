import { NextRequest, NextResponse } from 'next/server';
import allStocks from '@/data/allStocks.json';

interface StockData {
  symbol: string;
  nseSymbol?: string;
  shortName?: string;
}

// Get NSE symbol from BSE code
function getNseSymbol(bseCode: string): string | null {
  const stock = (allStocks as StockData[]).find(s => s.symbol === bseCode);
  return stock?.nseSymbol || stock?.shortName || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '5y'; // Default 5 years

  // Get NSE symbol for better Yahoo Finance compatibility
  const nseSymbol = getNseSymbol(symbol);

  try {
    let data;
    let result;

    // Try NSE first (more reliable with Yahoo Finance)
    if (nseSymbol) {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}.NS?interval=1mo&range=${period}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 3600 }, // Cache for 1 hour
        }
      );
      data = await response.json();
      result = data.chart?.result?.[0];
    }

    // Fallback to BSE if NSE fails
    if (!result || !result.timestamp || result.timestamp.length === 0) {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1mo&range=${period}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 3600 },
        }
      );
      data = await response.json();
      result = data.chart?.result?.[0];
    }

    if (!result || !result.timestamp || result.timestamp.length === 0) {
      return NextResponse.json({
        symbol,
        history: [],
        currentPrice: 0,
      });
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    const closes = quote?.close || [];
    const meta = result.meta || {};

    const history = timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        price: closes[i],
      }))
      .filter((p: { price: number | null }) => p.price !== null && p.price > 0);

    return NextResponse.json({
      symbol,
      history,
      currentPrice: meta.regularMarketPrice || closes[closes.length - 1] || 0,
      currency: meta.currency || 'INR',
    });
  } catch (error) {
    console.error(`Error fetching history for ${symbol}:`, error);
    return NextResponse.json({
      symbol,
      history: [],
      currentPrice: 0,
    });
  }
}
