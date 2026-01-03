import { NextRequest, NextResponse } from 'next/server';

// Map index IDs to NSE archive CSV URLs
const INDEX_CSV_MAP: Record<string, string> = {
  'nifty50': 'https://archives.nseindia.com/content/indices/ind_nifty50list.csv',
  'niftynext50': 'https://archives.nseindia.com/content/indices/ind_niftynext50list.csv',
  'nifty100': 'https://archives.nseindia.com/content/indices/ind_nifty100list.csv',
  'nifty200': 'https://archives.nseindia.com/content/indices/ind_nifty200list.csv',
  'nifty500': 'https://archives.nseindia.com/content/indices/ind_nifty500list.csv',
  'niftybank': 'https://archives.nseindia.com/content/indices/ind_niftybanklist.csv',
  'niftyit': 'https://archives.nseindia.com/content/indices/ind_niftyitlist.csv',
  'niftypharma': 'https://archives.nseindia.com/content/indices/ind_niftypharmalist.csv',
  'niftyauto': 'https://archives.nseindia.com/content/indices/ind_niftyautolist.csv',
  'niftyfmcg': 'https://archives.nseindia.com/content/indices/ind_niftyfmcglist.csv',
  'niftymetal': 'https://archives.nseindia.com/content/indices/ind_niftymetallist.csv',
  'niftyrealty': 'https://archives.nseindia.com/content/indices/ind_niftyrealtylist.csv',
  'niftyenergy': 'https://archives.nseindia.com/content/indices/ind_niftyenergylist.csv',
  'niftymidcap50': 'https://archives.nseindia.com/content/indices/ind_niftymidcap50list.csv',
  'niftysmallcap50': 'https://archives.nseindia.com/content/indices/ind_niftysmlcap50list.csv',
};

const INDEX_NAMES: Record<string, string> = {
  'nifty50': 'NIFTY 50',
  'niftynext50': 'NIFTY NEXT 50',
  'nifty100': 'NIFTY 100',
  'nifty200': 'NIFTY 200',
  'nifty500': 'NIFTY 500',
  'niftybank': 'NIFTY BANK',
  'niftyit': 'NIFTY IT',
  'niftypharma': 'NIFTY PHARMA',
  'niftyauto': 'NIFTY AUTO',
  'niftyfmcg': 'NIFTY FMCG',
  'niftymetal': 'NIFTY METAL',
  'niftyrealty': 'NIFTY REALTY',
  'niftyenergy': 'NIFTY ENERGY',
  'niftymidcap50': 'NIFTY MIDCAP 50',
  'niftysmallcap50': 'NIFTY SMALLCAP 50',
};

interface ParsedStock {
  symbol: string;
  name: string;
  industry: string;
  isin: string;
}

// Parse NSE index CSV
function parseNSEIndexCsv(csv: string): ParsedStock[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  // Header: Company Name,Industry,Symbol,Series,ISIN Code
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      name: cols[0]?.trim() || '',
      industry: cols[1]?.trim() || '',
      symbol: cols[2]?.trim() || '',
      isin: cols[4]?.trim() || '',
    };
  }).filter(s => s.symbol);
}

// Get today's date for BSE bhavcopy
function getBSEDateString(): string {
  const now = new Date();
  // If before 5PM IST, use yesterday
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
  const indexParam = request.nextUrl.searchParams.get('index') || 'nifty50';
  const indexId = indexParam.toLowerCase();
  const csvUrl = INDEX_CSV_MAP[indexId];
  const indexName = INDEX_NAMES[indexId] || 'NIFTY 50';

  if (!csvUrl) {
    return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
  }

  try {
    // Step 1: Fetch index constituents from NSE archive CSV
    const csvResponse = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });

    if (!csvResponse.ok) {
      console.error(`Failed to fetch index CSV for ${indexId}: ${csvResponse.status}`);
      return NextResponse.json({ error: 'Failed to fetch index data' }, { status: 500 });
    }

    const csvText = await csvResponse.text();
    const indexStocks = parseNSEIndexCsv(csvText);

    if (indexStocks.length === 0) {
      return NextResponse.json({ error: 'No stocks found in index' }, { status: 404 });
    }

    // Step 2: Fetch live prices from BSE bhavcopy
    const dateStr = getBSEDateString();
    const bseUrl = `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${dateStr}_F_0000.CSV`;

    const bseResponse = await fetch(bseUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });

    // Create a map of symbol -> BSE data
    const bseDataMap = new Map<string, {
      price: number;
      previousClose: number;
      volume: number;
    }>();

    if (bseResponse.ok) {
      const bseCsv = await bseResponse.text();
      const bseLines = bseCsv.trim().split('\n');

      if (bseLines.length > 1) {
        const header = bseLines[0].split(',');
        const indices: Record<string, number> = {};
        header.forEach((h, i) => indices[h.trim()] = i);

        for (let i = 1; i < bseLines.length; i++) {
          const cols = bseLines[i].split(',');
          const symbol = cols[indices['TckrSymb']] || '';
          const price = parseFloat(cols[indices['ClsPric']]) || 0;
          const previousClose = parseFloat(cols[indices['PrvsClsgPric']]) || 0;
          const volume = parseFloat(cols[indices['TtlTradgVol']]) || 0;

          if (symbol && price > 0) {
            bseDataMap.set(symbol, { price, previousClose, volume });
          }
        }
      }
    }

    // Step 3: Merge index stocks with live prices
    const stocks = indexStocks.map(stock => {
      const bseData = bseDataMap.get(stock.symbol);
      const price = bseData?.price || 0;
      const previousClose = bseData?.previousClose || 0;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      return {
        symbol: stock.symbol,
        name: stock.name,
        shortName: stock.symbol,
        price,
        previousClose,
        change,
        changePercent,
        volume: bseData?.volume || 0,
        industry: stock.industry,
      };
    }).filter(s => s.price > 0); // Only include stocks with valid prices

    // Calculate advances/declines
    const advances = stocks.filter(s => s.changePercent > 0).length;
    const declines = stocks.filter(s => s.changePercent < 0).length;
    const unchanged = stocks.filter(s => s.changePercent === 0).length;

    return NextResponse.json({
      index: indexName,
      timestamp: new Date().toISOString(),
      advance: {
        advances,
        declines,
        unchanged,
      },
      stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error('Error fetching index constituents:', error);
    return NextResponse.json({ error: 'Failed to fetch index data' }, { status: 500 });
  }
}
