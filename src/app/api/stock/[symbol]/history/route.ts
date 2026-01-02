import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '5y'; // Default 5 years

  try {
    // Try BSE first, then NSE
    let response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1mo&range=${period}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    let data = await response.json();
    let result = data.chart?.result?.[0];

    // Try NSE if BSE fails
    if (!result || !result.timestamp || result.timestamp.length === 0) {
      response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1mo&range=${period}`,
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
