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

        // Try NSE first, then BSE
        let data = null;
        let result = null;

        // Fetch 10 years of weekly data to calculate all period changes
        if (nseSymbol) {
          try {
            const response = await fetch(
              `https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}.NS?interval=1wk&range=10y`,
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
              `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1wk&range=10y`,
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

        // Get historical data for period calculations
        const timestamps = result.timestamp || [];
        const closes = result.indicators?.quote?.[0]?.close || [];

        // Calculate target dates (in seconds, Yahoo returns UNIX timestamps)
        const now = Math.floor(Date.now() / 1000);
        const oneWeekAgo = now - (7 * 24 * 60 * 60);
        const oneMonthAgo = now - (30 * 24 * 60 * 60);
        const oneYearAgo = now - (365 * 24 * 60 * 60);
        const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60);
        const tenYearsAgo = now - (10 * 365 * 24 * 60 * 60);

        // Helper function to find price at or before a target timestamp
        function findPriceAtDate(targetTimestamp: number): number {
          let foundPrice = 0;
          for (let i = 0; i < timestamps.length; i++) {
            if (timestamps[i] <= targetTimestamp && closes[i] !== null && closes[i] > 0) {
              foundPrice = closes[i];
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

        // Weekly change (use last data point if no exact match - weekly data may not have last week)
        let weekAgoPrice = findPriceAtDate(oneWeekAgo);
        if (weekAgoPrice === 0 && closes.length >= 2) {
          // Use second-to-last data point for weekly (since data is weekly interval)
          for (let i = closes.length - 2; i >= 0; i--) {
            if (closes[i] !== null && closes[i] > 0) {
              weekAgoPrice = closes[i];
              break;
            }
          }
        }
        const changePercentWeek = calcChange(weekAgoPrice, price);

        // Monthly change
        let monthAgoPrice = findPriceAtDate(oneMonthAgo);
        if (monthAgoPrice === 0 && closes.length >= 5) {
          // Fallback: ~4 weeks back
          const targetIndex = Math.max(0, closes.length - 5);
          for (let i = targetIndex; i >= 0; i--) {
            if (closes[i] !== null && closes[i] > 0) {
              monthAgoPrice = closes[i];
              break;
            }
          }
        }
        const changePercentMonth = calcChange(monthAgoPrice, price);

        // Yearly change
        const yearAgoPrice = findPriceAtDate(oneYearAgo);
        const changePercentYear = calcChange(yearAgoPrice, price);

        // 5-year change
        const fiveYearAgoPrice = findPriceAtDate(fiveYearsAgo);
        const changePercent5Year = calcChange(fiveYearAgoPrice, price);

        // 10-year change (use first available data if stock is newer)
        let tenYearAgoPrice = findPriceAtDate(tenYearsAgo);
        if (tenYearAgoPrice === 0 && closes.length > 0) {
          // Use earliest available data
          for (let i = 0; i < closes.length; i++) {
            if (closes[i] !== null && closes[i] > 0) {
              tenYearAgoPrice = closes[i];
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
