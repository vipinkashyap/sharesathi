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

        if (nseSymbol) {
          try {
            const response = await fetch(
              `https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}.NS?interval=1d&range=1d`,
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
              `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO?interval=1d&range=1d`,
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

        return {
          symbol,
          price,
          change,
          changePercent,
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
