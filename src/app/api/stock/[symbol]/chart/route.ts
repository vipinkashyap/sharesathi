import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const searchParams = request.nextUrl.searchParams;
  const interval = searchParams.get('interval') || '1d';
  const range = searchParams.get('range') || '5d';

  try {
    // Yahoo Finance uses .BO suffix for BSE stocks
    // Try BSE first, then NSE if BSE fails
    let response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=${interval}&range=${range}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 60 },
      }
    );

    let data = await response.json();
    let result = data.chart?.result?.[0];

    // If BSE fails or has no data, try NSE
    if (!result || !result.timestamp || result.timestamp.length === 0) {
      response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=${interval}&range=${range}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 60 },
        }
      );
      data = await response.json();
      result = data.chart?.result?.[0];
    }

    if (!result || !result.timestamp || result.timestamp.length === 0) {
      // Return empty array instead of 404 for graceful handling
      return NextResponse.json({
        symbol,
        interval,
        range,
        priceHistory: [],
      });
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    const closes = quote?.close || [];

    const priceHistory = timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString(),
        close: closes[i],
        open: quote?.open?.[i],
        high: quote?.high?.[i],
        low: quote?.low?.[i],
        volume: quote?.volume?.[i],
      }))
      .filter((p: { close: number | null }) => p.close !== null && p.close > 0);

    return NextResponse.json({
      symbol,
      interval,
      range,
      priceHistory,
    });
  } catch (error) {
    console.error(`Error fetching chart for ${symbol}:`, error);
    // Return empty array for graceful handling
    return NextResponse.json({
      symbol,
      interval,
      range,
      priceHistory: [],
    });
  }
}
