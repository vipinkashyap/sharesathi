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

  // Get NSE symbol for better Yahoo Finance compatibility
  const nseSymbol = getNseSymbol(symbol);

  try {
    let data;
    let result;

    // Try NSE first (more reliable with Yahoo Finance)
    if (nseSymbol) {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}.NS?interval=1d&range=5d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 60 },
        }
      );
      if (response.ok) {
        data = await response.json();
        result = data.chart?.result?.[0];
      }
    }

    // Fallback to BSE if NSE fails
    if (!result || !result.timestamp || result.timestamp.length === 0) {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1d&range=5d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 60 },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Stock not available on Yahoo Finance', symbol },
          { status: 404 }
        );
      }

      data = await response.json();
      result = data.chart?.result?.[0];
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Stock not found', symbol },
        { status: 404 }
      );
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    const timestamps = result.timestamp || [];
    const closes = quote?.close || [];

    // Build price history
    const priceHistory = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString(),
      close: closes[i],
      open: quote?.open?.[i],
      high: quote?.high?.[i],
      low: quote?.low?.[i],
      volume: quote?.volume?.[i],
    })).filter((p: { close: number | null }) => p.close !== null);

    const price = meta.regularMarketPrice || 0;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    const stock = {
      symbol,
      name: meta.longName || meta.shortName || symbol,
      shortName: meta.symbol?.replace('.BO', '') || symbol,
      price,
      previousClose: prevClose,
      change,
      changePercent,
      open: meta.regularMarketOpen || 0,
      high: meta.regularMarketDayHigh || 0,
      low: meta.regularMarketDayLow || 0,
      volume: meta.regularMarketVolume || 0,
      marketCap: (meta.marketCap || 0) / 10000000, // Convert to crores
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
      priceHistory,
      timestamp: new Date().toISOString(),
      isLive: true,
    };

    return NextResponse.json(stock);
  } catch (error) {
    console.error(`Error fetching stock ${symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data', symbol },
      { status: 500 }
    );
  }
}
