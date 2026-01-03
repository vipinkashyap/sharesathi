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
    const yahooSymbol = nseSymbol ? `${nseSymbol}.NS` : `${symbol}.BO`;

    // Fetch 1-day range for accurate daily change (chartPreviousClose = yesterday's close)
    // and 5-day range for price history (for chart display)
    const [dailyResponse, historyResponse] = await Promise.all([
      fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          next: { revalidate: 60 },
        }
      ).catch(() => null),
      fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          next: { revalidate: 60 },
        }
      ).catch(() => null),
    ]);

    let dailyResult = null;
    let historyResult = null;

    // Helper to safely parse JSON response
    async function safeJson(response: Response | null) {
      if (!response?.ok) return null;
      try {
        const text = await response.text();
        const data = JSON.parse(text);
        return data.chart?.result?.[0] || null;
      } catch {
        return null;
      }
    }

    dailyResult = await safeJson(dailyResponse);
    historyResult = await safeJson(historyResponse);

    // Fallback to BSE if NSE failed
    if (!dailyResult && nseSymbol) {
      const [bseDailyResp, bseHistoryResp] = await Promise.all([
        fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1d&range=1d`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            next: { revalidate: 60 },
          }
        ).catch(() => null),
        fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1d&range=5d`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            next: { revalidate: 60 },
          }
        ).catch(() => null),
      ]);

      dailyResult = await safeJson(bseDailyResp);
      historyResult = await safeJson(bseHistoryResp);
    }

    if (!dailyResult) {
      return NextResponse.json(
        { error: 'Stock not available on Yahoo Finance', symbol },
        { status: 404 }
      );
    }

    // Use daily result for accurate price and change
    const meta = dailyResult.meta;

    // Use history result for price history (if available), fallback to daily
    const historyData = historyResult || dailyResult;
    const quote = historyData.indicators?.quote?.[0];
    const timestamps = historyData.timestamp || [];
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
    // IMPORTANT: Use chartPreviousClose from 1-day range = yesterday's close
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
