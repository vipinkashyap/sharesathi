import { NextRequest, NextResponse } from 'next/server';

interface BSEStock {
  FinInstrmId: string;      // BSE code (e.g., "500002")
  TckrSymb: string;         // Symbol (e.g., "ABB")
  FinInstrmNm: string;      // Full name
  ISIN: string;
  SctySrs: string;          // Series (A, B, X, Z, etc.)
  ClsPric: number;
  PrvsClsgPric: number;
  TtlTradgVol: number;
}

interface NSEStock {
  SYMBOL: string;
  NAME_OF_COMPANY: string;
  SERIES: string;
  ISIN_NUMBER: string;
}

// Parse BSE bhavcopy CSV
function parseBSECsv(csv: string): BSEStock[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',');
  const indices: Record<string, number> = {};
  header.forEach((h, i) => indices[h.trim()] = i);

  return lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      FinInstrmId: cols[indices['FinInstrmId']] || '',
      TckrSymb: cols[indices['TckrSymb']] || '',
      FinInstrmNm: cols[indices['FinInstrmNm']] || '',
      ISIN: cols[indices['ISIN']] || '',
      SctySrs: cols[indices['SctySrs']] || '',
      ClsPric: parseFloat(cols[indices['ClsPric']]) || 0,
      PrvsClsgPric: parseFloat(cols[indices['PrvsClsgPric']]) || 0,
      TtlTradgVol: parseFloat(cols[indices['TtlTradgVol']]) || 0,
    };
  }).filter(s => s.TckrSymb && s.ClsPric > 0);
}

// Parse NSE equity list CSV
function parseNSECsv(csv: string): NSEStock[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  return lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      SYMBOL: cols[0]?.trim() || '',
      NAME_OF_COMPANY: cols[1]?.trim() || '',
      SERIES: cols[2]?.trim() || '',
      ISIN_NUMBER: cols[6]?.trim() || '',
    };
  }).filter(s => s.SYMBOL && s.SERIES === 'EQ');
}

// Get today's date in BSE format (YYYYMMDD)
function getBSEDateString(): string {
  const now = new Date();
  // If before 5PM IST, use yesterday's date (bhavcopy available after 4:45PM)
  const istHour = now.getUTCHours() + 5.5;
  if (istHour < 17) {
    now.setDate(now.getDate() - 1);
  }
  // Skip weekends
  while (now.getDay() === 0 || now.getDay() === 6) {
    now.setDate(now.getDate() - 1);
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function GET(request: NextRequest) {
  const exchange = request.nextUrl.searchParams.get('exchange') || 'all';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '500');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
  const sortBy = request.nextUrl.searchParams.get('sort') || 'volume'; // volume, change, name

  try {
    const stocks: Array<{
      symbol: string;
      bseCode?: string;
      name: string;
      shortName: string;
      price: number;
      previousClose: number;
      change: number;
      changePercent: number;
      volume: number;
      exchange: string;
      isin: string;
    }> = [];

    // Fetch BSE stocks
    if (exchange === 'all' || exchange === 'bse') {
      const dateStr = getBSEDateString();
      const bseUrl = `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${dateStr}_F_0000.CSV`;

      try {
        const bseResponse = await fetch(bseUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(15000),
          cache: 'no-store',
        });

        if (bseResponse.ok) {
          const bseCsv = await bseResponse.text();
          const bseStocks = parseBSECsv(bseCsv);

          for (const s of bseStocks) {
            const change = s.ClsPric - s.PrvsClsgPric;
            const changePercent = s.PrvsClsgPric > 0 ? (change / s.PrvsClsgPric) * 100 : 0;

            stocks.push({
              symbol: s.TckrSymb,
              bseCode: s.FinInstrmId,
              name: s.FinInstrmNm,
              shortName: s.TckrSymb,
              price: s.ClsPric,
              previousClose: s.PrvsClsgPric,
              change,
              changePercent,
              volume: s.TtlTradgVol,
              exchange: 'BSE',
              isin: s.ISIN,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch BSE stocks:', err);
      }
    }

    // For NSE, we'd need to merge with live prices (NSE CSV only has metadata)
    // The BSE bhavcopy already has prices, so it's more useful for "all stocks" view

    // Sort stocks
    if (sortBy === 'volume') {
      stocks.sort((a, b) => b.volume - a.volume);
    } else if (sortBy === 'change') {
      stocks.sort((a, b) => b.changePercent - a.changePercent);
    } else if (sortBy === 'name') {
      stocks.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Paginate
    const paginatedStocks = stocks.slice(offset, offset + limit);

    return NextResponse.json({
      stocks: paginatedStocks,
      total: stocks.length,
      offset,
      limit,
      hasMore: offset + limit < stocks.length,
    });
  } catch (error) {
    console.error('Error fetching all stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
  }
}
