/**
 * Script to update the BSE/NSE stock list from official sources
 *
 * Run with: npx tsx scripts/updateStockList.ts
 *
 * Sources:
 * - NSE: https://archives.nseindia.com/content/equities/EQUITY_L.csv (reliable)
 * - Existing data: Preserves price/market cap from existing stock data
 */

import * as fs from 'fs';
import * as path from 'path';

interface Stock {
  symbol: string;
  name: string;
  shortName: string;
  price: number;
  previousClose?: number;
  change: number;
  changePercent: number;
  marketCap: number;
  isin?: string;
  nseSymbol?: string;
}

async function fetchNSEStockList(): Promise<Stock[]> {
  console.log('Fetching NSE official equity list...');

  try {
    const response = await fetch(
      'https://archives.nseindia.com/content/equities/EQUITY_L.csv',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csv = await response.text();
    const lines = csv.split('\n').slice(1); // Skip header
    const stocks: Stock[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse CSV - format: SYMBOL, NAME, SERIES, DATE, PAID_UP, LOT, ISIN, FACE_VALUE
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

      if (parts.length >= 7) {
        const nseSymbol = parts[0];
        const name = parts[1];
        const series = parts[2];
        const isin = parts[6];

        // Only include equity series (EQ, BE, BZ, etc.)
        if (nseSymbol && name && series) {
          stocks.push({
            symbol: nseSymbol,
            nseSymbol: nseSymbol,
            name: name,
            shortName: nseSymbol.slice(0, 15),
            price: 0,
            previousClose: 0,
            change: 0,
            changePercent: 0,
            marketCap: 0,
            isin: isin,
          });
        }
      }
    }

    console.log(`✓ Fetched ${stocks.length} stocks from NSE official list`);
    return stocks;
  } catch (error) {
    console.error('✗ NSE fetch failed:', error);
    return [];
  }
}

async function main() {
  const dataDir = path.join(process.cwd(), 'src', 'data');
  const allStocksPath = path.join(dataDir, 'allStocks.json');
  const backupDir = path.join(process.cwd(), 'backups');

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Read existing stocks (has price data)
  let existingStocks: Stock[] = [];
  try {
    const content = fs.readFileSync(allStocksPath, 'utf-8');
    existingStocks = JSON.parse(content);
    console.log(`Existing stocks: ${existingStocks.length}`);
    console.log(`  - With prices: ${existingStocks.filter(s => s.price > 0).length}`);
  } catch {
    console.log('No existing stocks file found');
  }

  // Create lookup maps
  const existingBySymbol = new Map(existingStocks.map(s => [s.symbol, s]));
  const existingByName = new Map(existingStocks.map(s => [s.name.toLowerCase().trim(), s]));

  // Fetch official NSE list
  const nseStocks = await fetchNSEStockList();

  if (nseStocks.length === 0) {
    console.error('\n✗ Failed to fetch any stocks. Keeping existing data.');
    process.exit(1);
  }

  // Merge: Keep ALL existing stocks (with price data) + add new from NSE
  const mergedMap = new Map<string, Stock>();

  // First, add all existing stocks (they have price data)
  for (const stock of existingStocks) {
    mergedMap.set(stock.symbol, stock);
  }

  // Add NSE stocks if not already present (try matching by name too)
  let newFromNSE = 0;
  for (const nseStock of nseStocks) {
    // Skip if we already have this symbol
    if (mergedMap.has(nseStock.symbol)) continue;

    // Try to find by name match (NSE might use different symbol than BSE)
    const nameMatch = existingByName.get(nseStock.name.toLowerCase().trim());
    if (nameMatch) {
      // We have price data for this stock under a different symbol
      // Add the NSE symbol as an alias
      mergedMap.set(nseStock.symbol, {
        ...nseStock,
        price: nameMatch.price,
        change: nameMatch.change,
        changePercent: nameMatch.changePercent,
        marketCap: nameMatch.marketCap,
      });
    } else {
      // Genuinely new stock
      mergedMap.set(nseStock.symbol, nseStock);
      newFromNSE++;
    }
  }

  const mergedStocks = Array.from(mergedMap.values());

  // Sort by market cap (largest first), then by name
  mergedStocks.sort((a, b) => {
    if (b.marketCap !== a.marketCap) return b.marketCap - a.marketCap;
    return a.name.localeCompare(b.name);
  });

  // Backup existing file
  if (existingStocks.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `allStocks.${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(existingStocks, null, 2));
    console.log(`\n✓ Backed up to ${backupPath}`);
  }

  // Write merged file
  fs.writeFileSync(allStocksPath, JSON.stringify(mergedStocks, null, 2));

  console.log('\n=== Update Summary ===');
  console.log(`Total stocks before: ${existingStocks.length}`);
  console.log(`Fetched from NSE:    ${nseStocks.length}`);
  console.log(`New stocks added:    ${newFromNSE}`);
  console.log(`Total stocks after:  ${mergedStocks.length}`);
  console.log(`With price data:     ${mergedStocks.filter(s => s.price > 0).length}`);

  console.log('\n✓ Stock list updated successfully!');
  console.log('\nNote: Run this script periodically to keep the list up-to-date.');
  console.log('      Price data comes from Yahoo Finance API at runtime.');
}

main().catch(console.error);
