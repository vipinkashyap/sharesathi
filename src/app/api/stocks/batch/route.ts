import { NextRequest, NextResponse } from 'next/server';
import allStocks from '@/data/allStocks.json';

interface StockData {
  symbol: string;
  name?: string;
  nseSymbol?: string;
  shortName?: string;
}

// Create lookup map for stock metadata
const stockMetadata = new Map<string, StockData>();
(allStocks as StockData[]).forEach(s => stockMetadata.set(s.symbol, s));

// Get NSE symbol from BSE code
function getNseSymbol(bseCode: string): string | null {
  const stock = stockMetadata.get(bseCode);
  return stock?.nseSymbol || stock?.shortName || null;
}

// Get stock metadata (name, shortName)
function getStockMetadata(bseCode: string): { name: string; shortName: string } {
  const stock = stockMetadata.get(bseCode);
  return {
    name: stock?.name || bseCode,
    shortName: stock?.shortName || bseCode,
  };
}

interface BatchStockResult {
  symbol: string;
  name: string;
  shortName: string;
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
        const bseSymbol = `${symbol}.BO`;

        // Helper to fetch with timeout and caching
        async function fetchYahoo(sym: string, range: string, revalidate: number) {
          try {
            const resp = await fetch(
              `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=${range}`,
              {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                signal: AbortSignal.timeout(8000),
                next: { revalidate },
              }
            );
            if (resp.ok) {
              const data = await resp.json();
              return data.chart?.result?.[0];
            }
          } catch {
            // Timeout or network error
          }
          return null;
        }

        // Fetch periods in two batches to avoid overwhelming the connection
        // First batch: daily + short-term (most important for quick display)
        const [day, week, month] = await Promise.all([
          fetchYahoo(yahooSymbol, '1d', 60),    // 1D: chartPreviousClose = yesterday's close
          fetchYahoo(yahooSymbol, '5d', 60),    // 1W: chartPreviousClose = 5 days ago
          fetchYahoo(yahooSymbol, '1mo', 60),   // 1M: chartPreviousClose = ~1 month ago
        ]);

        // Second batch: longer-term data
        const [year, fiveYear, tenYear] = await Promise.all([
          fetchYahoo(yahooSymbol, '1y', 300),   // 1Y: chartPreviousClose = ~1 year ago
          fetchYahoo(yahooSymbol, '5y', 300),   // 5Y: chartPreviousClose = ~5 years ago
          fetchYahoo(yahooSymbol, '10y', 300),  // 10Y: chartPreviousClose = ~10 years ago
        ]);

        // Try BSE fallback if NSE failed for daily data
        let dailyResult = day;
        if (!dailyResult && nseSymbol) {
          dailyResult = await fetchYahoo(bseSymbol, '1d', 60);
        }

        // Need at least daily data for basic info
        if (!dailyResult) {
          return { symbol, error: 'not_found' };
        }

        const meta = dailyResult.meta;
        const price = meta.regularMarketPrice || 0;

        // Helper to calculate change % using Yahoo's chartPreviousClose
        function calcChangeFromResult(result: { meta?: { chartPreviousClose?: number } } | null): number {
          if (!result?.meta?.chartPreviousClose || result.meta.chartPreviousClose <= 0) return 0;
          const prevClose = result.meta.chartPreviousClose;
          return ((price - prevClose) / prevClose) * 100;
        }

        // Use Yahoo's chartPreviousClose for each period - this is industry standard
        const changePercent = calcChangeFromResult(dailyResult);
        const changePercentWeek = calcChangeFromResult(week || (nseSymbol ? await fetchYahoo(bseSymbol, '5d', 60) : null));
        const changePercentMonth = calcChangeFromResult(month || (nseSymbol ? await fetchYahoo(bseSymbol, '1mo', 60) : null));
        const changePercentYear = calcChangeFromResult(year || (nseSymbol ? await fetchYahoo(bseSymbol, '1y', 300) : null));
        const changePercent5Year = calcChangeFromResult(fiveYear || (nseSymbol ? await fetchYahoo(bseSymbol, '5y', 300) : null));
        const changePercent10Year = calcChangeFromResult(tenYear || (nseSymbol ? await fetchYahoo(bseSymbol, '10y', 300) : null));

        const prevClose = dailyResult.meta.chartPreviousClose || meta.previousClose || price;
        const change = price - prevClose;

        const metadata = getStockMetadata(symbol);
        return {
          symbol,
          name: metadata.name,
          shortName: metadata.shortName,
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

// GET handler for query param style: /api/stocks/batch?symbols=500325,532540
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'symbols query param required' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').filter(s => s.trim());

  if (symbols.length === 0) {
    return NextResponse.json({ error: 'symbols array required' }, { status: 400 });
  }

  // Reuse POST logic by creating a mock request
  const mockRequest = {
    json: async () => ({ symbols }),
  } as NextRequest;

  return POST(mockRequest);
}
