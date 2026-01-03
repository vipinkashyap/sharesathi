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
  changePercentYear: number;
  changePercent5Year: number;
  changePercent10Year: number;
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

        // Determine the Yahoo symbol to use
        const yahooSymbol = nseSymbol ? `${nseSymbol}.NS` : `${symbol}.BO`;

        // Fetch both daily (for accurate 1D/1W) and weekly (for 1M/1Y/5Y/10Y) data in parallel
        // Next.js caches these requests for 60 seconds to reduce load
        const [dailyResponse, weeklyResponse] = await Promise.all([
          fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1mo`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              signal: AbortSignal.timeout(4000),
              next: { revalidate: 60 }, // Cache for 60 seconds
            }
          ).catch(() => null),
          fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1wk&range=10y`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              signal: AbortSignal.timeout(4000),
              next: { revalidate: 300 }, // Cache for 5 minutes (historical data doesn't change often)
            }
          ).catch(() => null),
        ]);

        // Try BSE fallback if NSE failed
        let dailyResult = null;
        let weeklyResult = null;

        if (dailyResponse?.ok) {
          const data = await dailyResponse.json();
          dailyResult = data.chart?.result?.[0];
        }
        if (weeklyResponse?.ok) {
          const data = await weeklyResponse.json();
          weeklyResult = data.chart?.result?.[0];
        }

        // Fallback to BSE if NSE failed
        if (!dailyResult && nseSymbol) {
          try {
            const resp = await fetch(
              `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1d&range=1mo`,
              {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                signal: AbortSignal.timeout(3000),
                next: { revalidate: 60 },
              }
            );
            if (resp.ok) {
              const data = await resp.json();
              dailyResult = data.chart?.result?.[0];
            }
          } catch {
            // BSE also failed
          }
        }
        if (!weeklyResult && nseSymbol) {
          try {
            const resp = await fetch(
              `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1wk&range=10y`,
              {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                signal: AbortSignal.timeout(3000),
                next: { revalidate: 300 },
              }
            );
            if (resp.ok) {
              const data = await resp.json();
              weeklyResult = data.chart?.result?.[0];
            }
          } catch {
            // BSE also failed
          }
        }

        // Need at least daily data for basic info
        if (!dailyResult) {
          return { symbol, error: 'not_found' };
        }

        const meta = dailyResult.meta;
        const price = meta.regularMarketPrice || 0;
        // Use daily data's chartPreviousClose for accurate daily change
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        // Get historical data for period calculations
        // Use daily data for week calculation, weekly data for longer periods
        const dailyTimestamps = dailyResult.timestamp || [];
        const dailyCloses = dailyResult.indicators?.quote?.[0]?.close || [];

        // Weekly data for longer periods (may not exist for newer stocks)
        const weeklyTimestamps = weeklyResult?.timestamp || [];
        const weeklyCloses = weeklyResult?.indicators?.quote?.[0]?.close || [];

        // Calculate target dates (in seconds, Yahoo returns UNIX timestamps)
        const now = Math.floor(Date.now() / 1000);
        const oneWeekAgo = now - (7 * 24 * 60 * 60);
        const oneYearAgo = now - (365 * 24 * 60 * 60);
        const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60);
        const tenYearsAgo = now - (10 * 365 * 24 * 60 * 60);

        // Helper function to find price at or before a target timestamp
        function findPriceAtDate(timestamps: number[], closes: (number | null)[], targetTimestamp: number): number {
          let foundPrice = 0;
          for (let i = 0; i < timestamps.length; i++) {
            if (timestamps[i] <= targetTimestamp && closes[i] !== null && closes[i]! > 0) {
              foundPrice = closes[i]!;
            }
          }
          return foundPrice;
        }

        // Calculate change percentage helper
        function calcChange(oldPrice: number, currentPrice: number): number {
          if (oldPrice > 0 && currentPrice > 0) {
            return ((currentPrice - oldPrice) / oldPrice) * 100;
          }
          return 0;
        }

        // Weekly change - use daily data for accuracy
        let weekAgoPrice = findPriceAtDate(dailyTimestamps, dailyCloses, oneWeekAgo);
        if (weekAgoPrice === 0 && dailyCloses.length >= 5) {
          // Fallback: ~5 trading days back
          for (let i = dailyCloses.length - 6; i >= 0; i--) {
            if (dailyCloses[i] !== null && dailyCloses[i]! > 0) {
              weekAgoPrice = dailyCloses[i]!;
              break;
            }
          }
        }
        const changePercentWeek = calcChange(weekAgoPrice, price);

        // Monthly change - use daily data (we have 1 month)
        let monthAgoPrice = 0;
        if (dailyCloses.length > 0) {
          // First valid close in daily data (~1 month ago)
          for (let i = 0; i < dailyCloses.length; i++) {
            if (dailyCloses[i] !== null && dailyCloses[i]! > 0) {
              monthAgoPrice = dailyCloses[i]!;
              break;
            }
          }
        }
        const changePercentMonth = calcChange(monthAgoPrice, price);

        // Yearly change - use weekly data
        const yearAgoPrice = findPriceAtDate(weeklyTimestamps, weeklyCloses, oneYearAgo);
        const changePercentYear = calcChange(yearAgoPrice, price);

        // 5-year change - use weekly data
        const fiveYearAgoPrice = findPriceAtDate(weeklyTimestamps, weeklyCloses, fiveYearsAgo);
        const changePercent5Year = calcChange(fiveYearAgoPrice, price);

        // 10-year change - use weekly data (use first available data if stock is newer)
        let tenYearAgoPrice = findPriceAtDate(weeklyTimestamps, weeklyCloses, tenYearsAgo);
        if (tenYearAgoPrice === 0 && weeklyCloses.length > 0) {
          // Use earliest available data
          for (let i = 0; i < weeklyCloses.length; i++) {
            if (weeklyCloses[i] !== null && weeklyCloses[i]! > 0) {
              tenYearAgoPrice = weeklyCloses[i]!;
              break;
            }
          }
        }
        const changePercent10Year = calcChange(tenYearAgoPrice, price);

        return {
          symbol,
          price,
          change,
          changePercent,
          changePercentWeek,
          changePercentMonth,
          changePercentYear,
          changePercent5Year,
          changePercent10Year,
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
