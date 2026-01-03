import { NextRequest, NextResponse } from 'next/server';

interface YahooSearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
  score?: number;
}

interface YahooSearchResponse {
  quotes?: YahooSearchResult[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Search Yahoo Finance for Indian stocks (append .NS and .BO to search)
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&enableFuzzyQuery=true&quotesQueryId=tss_match_phrase_query`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.error('Yahoo search failed:', response.status);
      return NextResponse.json({ results: [] });
    }

    const data: YahooSearchResponse = await response.json();
    const quotes = data.quotes || [];

    // Filter for Indian stocks (NSE and BSE)
    const indianStocks = quotes
      .filter((q) => {
        const sym = q.symbol || '';
        return (
          (sym.endsWith('.NS') || sym.endsWith('.BO')) &&
          q.quoteType === 'EQUITY'
        );
      })
      .map((q) => {
        const symbol = q.symbol || '';
        const isNSE = symbol.endsWith('.NS');
        const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');

        return {
          symbol: cleanSymbol,
          name: q.longname || q.shortname || cleanSymbol,
          shortName: q.shortname || cleanSymbol,
          exchange: isNSE ? 'NSE' : 'BSE',
          yahooSymbol: symbol,
        };
      });

    // Deduplicate by symbol (prefer NSE over BSE)
    const uniqueStocks = new Map<string, typeof indianStocks[0]>();
    for (const stock of indianStocks) {
      const existing = uniqueStocks.get(stock.symbol);
      if (!existing || (stock.exchange === 'NSE' && existing.exchange === 'BSE')) {
        uniqueStocks.set(stock.symbol, stock);
      }
    }

    return NextResponse.json({
      results: Array.from(uniqueStocks.values()).slice(0, 15),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
