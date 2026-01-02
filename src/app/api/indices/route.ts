import { NextResponse } from 'next/server';

async function fetchIndex(symbol: string, name: string) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch ${name}: ${response.status}`);
      return null;
    }

    const text = await response.text();
    const data = JSON.parse(text);
    const meta = data.chart?.result?.[0]?.meta;

    if (!meta) {
      console.error(`No meta data for ${name}`);
      return null;
    }

    const price = meta.regularMarketPrice || 0;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      name,
      symbol,
      value: price,
      previousClose: prevClose,
      change,
      changePercent,
    };
  } catch (error) {
    console.error(`Error fetching ${name}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const [sensex, nifty] = await Promise.all([
      fetchIndex('^BSESN', 'SENSEX'),
      fetchIndex('^NSEI', 'NIFTY 50'),
    ]);

    const indices = [sensex, nifty].filter(Boolean);

    if (indices.length === 0) {
      // Return fallback if both failed
      return NextResponse.json([
        { name: 'SENSEX', symbol: '^BSESN', value: 0, change: 0, changePercent: 0 },
        { name: 'NIFTY 50', symbol: '^NSEI', value: 0, change: 0, changePercent: 0 },
      ]);
    }

    return NextResponse.json(indices);
  } catch (error) {
    console.error('Error in indices route:', error);
    return NextResponse.json([
      { name: 'SENSEX', symbol: '^BSESN', value: 0, change: 0, changePercent: 0 },
      { name: 'NIFTY 50', symbol: '^NSEI', value: 0, change: 0, changePercent: 0 },
    ]);
  }
}
