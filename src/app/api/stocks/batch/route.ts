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

interface BatchStockResult {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  changePercentWeek: number;
  changePercentMonth: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  isLive: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'symbols array required' }, { status: 400 });
    }

    // Limit to 50 stocks per request to avoid overloading
    const limitedSymbols = symbols.slice(0, 50);

    // Fetch stocks in parallel with individual timeouts
    const results = await Promise.allSettled(
      limitedSymbols.map(async (symbol: string) => {
        const nseSymbol = getNseSymbol(symbol);

        // Try NSE first, then BSE
        let data = null;
        let result = null;

        // Fetch 1 month of daily data to calculate weekly/monthly changes
        if (nseSymbol) {
          try {
            const response = await fetch(
              `https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}.NS?interval=1d&range=1mo`,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                signal: AbortSignal.timeout(5000), // 5 second timeout per stock
              }
            );
            if (response.ok) {
              data = await response.json();
              result = data.chart?.result?.[0];
            }
          } catch {
            // NSE failed, try BSE
          }
        }

        // Fallback to BSE
        if (!result) {
          try {
            const response = await fetch(
              `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1d&range=1mo`,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                signal: AbortSignal.timeout(5000),
              }
            );
            if (response.ok) {
              data = await response.json();
              result = data.chart?.result?.[0];
            }
          } catch {
            // BSE also failed
          }
        }

        if (!result) {
          return { symbol, error: 'not_found' };
        }

        const meta = result.meta;
        const price = meta.regularMarketPrice || 0;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        // Get historical data for weekly/monthly calculation
        const timestamps = result.timestamp || [];
        const closes = result.indicators?.quote?.[0]?.close || [];

        // Calculate target dates (in seconds, Yahoo returns UNIX timestamps)
        const now = Math.floor(Date.now() / 1000);
        const oneWeekAgo = now - (7 * 24 * 60 * 60);

        // Weekly change: Find price from ~7 calendar days ago
        let changePercentWeek = 0;
        let weekAgoPrice = 0;

        // Find the last valid close that's at or before 1 week ago
        for (let i = 0; i < timestamps.length; i++) {
          if (timestamps[i] <= oneWeekAgo && closes[i] !== null && closes[i] > 0) {
            weekAgoPrice = closes[i];
          }
        }

        // Fallback: if we couldn't find a price from 1 week ago (e.g., holidays),
        // use approximately 5 trading days back from the most recent data
        if (weekAgoPrice === 0 && closes.length > 5) {
          const targetIndex = closes.length - 6; // ~5 trading days back
          for (let i = targetIndex; i >= 0; i--) {
            if (closes[i] !== null && closes[i] > 0) {
              weekAgoPrice = closes[i];
              break;
            }
          }
        }

        if (weekAgoPrice > 0 && price > 0) {
          changePercentWeek = ((price - weekAgoPrice) / weekAgoPrice) * 100;
        }

        // Monthly change: First valid close in dataset (~1 month ago)
        let changePercentMonth = 0;
        let monthAgoPrice = 0;

        for (let i = 0; i < closes.length; i++) {
          if (closes[i] !== null && closes[i] > 0) {
            monthAgoPrice = closes[i];
            break;
          }
        }

        if (monthAgoPrice > 0 && price > 0) {
          changePercentMonth = ((price - monthAgoPrice) / monthAgoPrice) * 100;
        }

        return {
          symbol,
          price,
          change,
          changePercent,
          changePercentWeek,
          changePercentMonth,
          volume: meta.regularMarketVolume || 0,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
          isLive: true,
        } as BatchStockResult;
      })
    );

    // Process results
    const stocks: Record<string, BatchStockResult> = {};

    results.forEach((result, index) => {
      const symbol = limitedSymbols[index];
      if (result.status === 'fulfilled' && !('error' in result.value)) {
        stocks[symbol] = result.value as BatchStockResult;
      }
    });

    return NextResponse.json({
      stocks,
      fetched: Object.keys(stocks).length,
      requested: limitedSymbols.length,
    });
  } catch (error) {
    console.error('Batch stock fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
  }
}
