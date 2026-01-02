'use client';

import { useState, useMemo } from 'react';
import { MarketTable } from '@/components/MarketTable';
import { MarketFilters, FilterType } from '@/components/MarketFilters';
import { useWatchlistStore } from '@/store/watchlistStore';
import allStocks from '@/data/allStocks.json';
import indexData from '@/data/indexConstituents.json';

interface StockData {
  symbol: string;
  name: string;
  shortName: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume?: number;
  nseSymbol?: string;
}

// Create a map for quick lookup by NSE symbol
const stocksByNseSymbol = new Map<string, StockData>();
const stocksByShortName = new Map<string, StockData>();

(allStocks as StockData[]).forEach(stock => {
  if (stock.nseSymbol) {
    stocksByNseSymbol.set(stock.nseSymbol.toUpperCase(), stock);
  }
  // Also map by shortName for fallback
  if (!stocksByShortName.has(stock.shortName.toUpperCase())) {
    stocksByShortName.set(stock.shortName.toUpperCase(), stock);
  }
});

// Get stock by NSE symbol (used in index constituents)
function getStockByNseSymbol(nseSymbol: string): StockData | undefined {
  const upperSymbol = nseSymbol.toUpperCase();
  return stocksByNseSymbol.get(upperSymbol) || stocksByShortName.get(upperSymbol);
}

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  const { watchlists } = useWatchlistStore();

  const handleFilterChange = (type: FilterType, id: string | null) => {
    setActiveFilter(type);
    setActiveFilterId(id);
  };

  const filteredStocks = useMemo(() => {
    let stocks: StockData[] = [];

    // Apply filter
    if (activeFilter === 'all') {
      // Only show stocks with price data (filter out zeros)
      stocks = (allStocks as StockData[]).filter(s => s.price > 0);
    } else if (activeFilter === 'index' && activeFilterId) {
      const constituents = indexData.constituents[activeFilterId as keyof typeof indexData.constituents];
      if (constituents) {
        stocks = constituents
          .map(symbol => getStockByNseSymbol(symbol))
          .filter((s): s is StockData => s !== undefined);
      }
    } else if (activeFilter === 'watchlist' && activeFilterId) {
      const watchlist = watchlists.find(w => w.id === activeFilterId);
      if (watchlist) {
        stocks = watchlist.symbols
          .map(symbol => (allStocks as StockData[]).find(s => s.symbol === symbol))
          .filter((s): s is StockData => s !== undefined);
      }
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      stocks = stocks.filter(
        stock =>
          stock.shortName.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query) ||
          stock.symbol.includes(query) ||
          stock.nseSymbol?.toLowerCase().includes(query)
      );
    }

    return stocks;
  }, [activeFilter, activeFilterId, searchQuery, watchlists]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Market Monitor
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {filteredStocks.length.toLocaleString()} stocks
        </p>
      </div>

      {/* Filters */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <MarketFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          activeFilterId={activeFilterId}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <MarketTable stocks={filteredStocks} />
      </div>
    </div>
  );
}
