'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Search, TrendingUp, TrendingDown, Sparkles, Calendar, IndianRupee, ArrowRight, HelpCircle, X } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatPrice, formatIndianNumber } from '@/lib/formatters';

interface StockOption {
  symbol: string;
  name: string;
  shortName: string;
}

interface HistoryPoint {
  date: string;
  price: number;
}

interface CalculationResult {
  investmentDate: string;
  investmentPrice: number;
  currentPrice: number;
  shares: number;
  investedAmount: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  years: number;
  cagr: number;
}

// Popular stocks for quick selection
const POPULAR_STOCKS: StockOption[] = [
  { symbol: '500325', name: 'Reliance Industries', shortName: 'RELIANCE' },
  { symbol: '532540', name: 'TCS', shortName: 'TCS' },
  { symbol: '500180', name: 'HDFC Bank', shortName: 'HDFCBANK' },
  { symbol: '532174', name: 'ICICI Bank', shortName: 'ICICIBANK' },
  { symbol: '500209', name: 'Infosys', shortName: 'INFY' },
  { symbol: '500312', name: 'ONGC', shortName: 'ONGC' },
  { symbol: '532454', name: 'Bharti Airtel', shortName: 'BHARTIARTL' },
  { symbol: '500010', name: 'HDFC', shortName: 'HDFC' },
];

// Preset time periods
const TIME_PERIODS = [
  { label: '1 Year', years: 1 },
  { label: '3 Years', years: 3 },
  { label: '5 Years', years: 5 },
  { label: '10 Years', years: 10 },
];

export default function TimeMachinePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockOption | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState(10000);
  const [selectedYears, setSelectedYears] = useState(5);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Search stocks using Yahoo Finance API
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setSearchResults(
            (data.results || []).map((r: { symbol: string; name: string; shortName: string }) => ({
              symbol: r.symbol,
              name: r.name,
              shortName: r.shortName,
            }))
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Track fetched periods to avoid duplicate calls
  const [fetchedPeriod, setFetchedPeriod] = useState<string | null>(null);

  // Fetch historical data when stock is selected
  useEffect(() => {
    if (!selectedStock) return;

    // Determine which period we need
    const neededPeriod = selectedYears <= 5 ? '5y' : '10y';

    // If we already have data for this period or a longer one, don't refetch
    if (fetchedPeriod === '10y' || (fetchedPeriod === '5y' && neededPeriod === '5y')) {
      // Just hide results when period changes
      setShowResults(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      setShowResults(false);
      try {
        // Always fetch 10y to cover all periods
        const response = await fetch(`/api/stock/${selectedStock.symbol}/history?period=10y`);
        if (response.ok) {
          const data = await response.json();
          const historyData = data.history || [];
          setHistory(historyData);
          setCurrentPrice(data.currentPrice || 0);
          setFetchedPeriod('10y');

          if (historyData.length === 0) {
            setError('Historical data not available for this stock');
          }
        } else {
          setError('Failed to fetch historical data');
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Failed to fetch historical data');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedStock, selectedYears, fetchedPeriod]);

  // Calculate investment results
  const result: CalculationResult | null = useMemo(() => {
    if (!history.length || !currentPrice || currentPrice === 0) return null;

    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() - selectedYears);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Find the closest date in history
    let closestPoint = history[0];
    let closestDiff = Math.abs(new Date(history[0].date).getTime() - targetDate.getTime());

    for (const point of history) {
      const diff = Math.abs(new Date(point.date).getTime() - targetDate.getTime());
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPoint = point;
      }
    }

    if (!closestPoint || closestPoint.price <= 0) return null;

    const shares = investmentAmount / closestPoint.price;
    const currentValue = shares * currentPrice;
    const profit = currentValue - investmentAmount;
    const profitPercent = (profit / investmentAmount) * 100;

    // Calculate CAGR
    const actualYears = (Date.now() - new Date(closestPoint.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const cagr = actualYears > 0 ? (Math.pow(currentValue / investmentAmount, 1 / actualYears) - 1) * 100 : 0;

    return {
      investmentDate: closestPoint.date,
      investmentPrice: closestPoint.price,
      currentPrice,
      shares,
      investedAmount: investmentAmount,
      currentValue,
      profit,
      profitPercent,
      years: actualYears,
      cagr,
    };
  }, [history, currentPrice, investmentAmount, selectedYears]);

  // Mini chart points
  const chartPoints = useMemo(() => {
    if (!history.length || !result) return [];

    const targetDate = new Date(result.investmentDate);
    const relevantHistory = history.filter(h => new Date(h.date) >= targetDate);

    if (relevantHistory.length < 2) return [];

    const prices = relevantHistory.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const width = 280;
    const height = 100;

    return relevantHistory.map((point, i) => ({
      x: (i / (relevantHistory.length - 1)) * width,
      y: height - ((point.price - min) / range) * height,
      price: point.price,
      date: point.date,
    }));
  }, [history, result]);

  const handleSelectStock = (stock: StockOption) => {
    setSelectedStock(stock);
    setSearchQuery('');
    setShowSearch(false);
    setShowResults(false);
    setError(null);
    setHistory([]);
    setFetchedPeriod(null); // Reset so new stock fetches data
  };

  const handleCalculate = () => {
    if (selectedStock && history.length > 0) {
      setShowResults(true);
    }
  };

  const isPositive = result ? result.profit >= 0 : true;

  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <Clock size={24} style={{ color: 'var(--accent-blue)' }} />
          Time Machine
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          What if you had invested in the past?
        </p>
      </header>

      {/* Content */}
      <div className="px-4 py-4 space-y-6">
        {/* Stock Selection */}
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            1. Choose a Stock
          </h2>

          {selectedStock ? (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedStock.shortName}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {selectedStock.name}
                  </div>
                </div>
                <button
                  onClick={() => setShowSearch(true)}
                  className="text-sm px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-blue)' }}
                >
                  Change
                </button>
              </div>
            </Card>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-3">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stocks..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-base"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card className="mb-3 divide-y" style={{ borderColor: 'var(--border)' }}>
                  {searchResults.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock)}
                      className="w-full px-4 py-3 text-left hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {stock.shortName}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {stock.name}
                      </div>
                    </button>
                  ))}
                </Card>
              )}

              {/* Popular Stocks */}
              <div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  Popular Picks
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_STOCKS.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock)}
                      className="px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {stock.shortName}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Investment Amount */}
        {selectedStock && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              2. Investment Amount
            </h2>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee size={20} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value) || 0)}
                  className="text-2xl font-bold bg-transparent outline-none w-full"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-2">
                {[10000, 50000, 100000, 500000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setInvestmentAmount(amount)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      investmentAmount === amount ? 'ring-2 ring-[var(--accent-blue)]' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    ₹{formatIndianNumber(amount)}
                  </button>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Time Period */}
        {selectedStock && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              3. How Far Back?
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period.years}
                  onClick={() => {
                    setSelectedYears(period.years);
                    setShowResults(false);
                  }}
                  className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                    selectedYears === period.years ? 'ring-2 ring-[var(--accent-blue)]' : ''
                  }`}
                  style={{
                    backgroundColor: selectedYears === period.years ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                    color: selectedYears === period.years ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Calculate Button or Error */}
        {selectedStock && !showResults && (
          <>
            {error ? (
              <Card className="p-4 text-center" style={{ backgroundColor: 'var(--accent-red-bg)' }}>
                <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
                  {error}
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Try selecting a different stock
                </p>
              </Card>
            ) : (
              <button
                onClick={handleCalculate}
                disabled={loading || !history.length}
                className="w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: loading || !history.length ? 'var(--bg-secondary)' : 'var(--accent-blue)',
                  color: loading || !history.length ? 'var(--text-muted)' : 'white',
                }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                    Loading historical data...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    See What Would Have Happened
                  </>
                )}
              </button>
            )}
          </>
        )}

        {/* Results */}
        {showResults && result && (
          <section className="space-y-4">
            <Card
              className="p-5 border-2"
              style={{ borderColor: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
            >
              <div className="text-center mb-4">
                <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                  Your ₹{formatIndianNumber(result.investedAmount)} would be worth
                </div>
                <div
                  className="text-4xl font-bold"
                  style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
                >
                  {formatPrice(result.currentValue)}
                </div>
                <div
                  className="flex items-center justify-center gap-1 mt-2"
                  style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
                >
                  {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  <span className="text-lg font-semibold">
                    {isPositive ? '+' : ''}{formatPrice(result.profit)} ({isPositive ? '+' : ''}{result.profitPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Mini Chart */}
              {chartPoints.length > 1 && (
                <div className="flex justify-center my-4">
                  <svg width={280} height={100} className="overflow-visible">
                    <defs>
                      <linearGradient id="time-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    {/* Area */}
                    <path
                      d={`M 0 100 L ${chartPoints.map(p => `${p.x} ${p.y}`).join(' L ')} L 280 100 Z`}
                      fill="url(#time-gradient)"
                    />
                    {/* Line */}
                    <path
                      d={`M ${chartPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                      fill="none"
                      stroke={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'}
                      strokeWidth="2"
                    />
                    {/* End dot */}
                    <circle
                      cx={chartPoints[chartPoints.length - 1]?.x}
                      cy={chartPoints[chartPoints.length - 1]?.y}
                      r="4"
                      fill={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'}
                    />
                  </svg>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Investment Date</div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {new Date(result.investmentDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Price Then</div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatPrice(result.investmentPrice)}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Shares Bought</div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {result.shares.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    CAGR
                    <button
                      onClick={() => setShowHelp(true)}
                      className="p-0.5 rounded-full"
                      aria-label="What is CAGR?"
                    >
                      <HelpCircle size={12} />
                    </button>
                  </div>
                  <div
                    className="font-semibold"
                    style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}
                  >
                    {result.cagr.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>

            {/* View Stock */}
            <Link
              href={`/stock/${selectedStock?.symbol}`}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-blue)' }}
            >
              View {selectedStock?.shortName} Details
              <ArrowRight size={16} />
            </Link>

            {/* Try Another */}
            <button
              onClick={() => {
                setSelectedStock(null);
                setShowResults(false);
                setHistory([]);
              }}
              className="w-full py-3 text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Try Another Stock
            </button>
          </section>
        )}

        {/* Fun Fact */}
        {!selectedStock && (
          <Card className="p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-start gap-3">
              <Sparkles size={20} style={{ color: 'var(--accent-blue)' }} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Did you know?
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  ₹10,000 invested in Infosys during its 1993 IPO would be worth over ₹7 Crore today.
                  The best time to invest was yesterday. The second best time is today.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowSearch(false)}
        >
          <div
            className="w-full max-h-[80vh] overflow-auto rounded-t-2xl p-4"
            style={{ backgroundColor: 'var(--bg-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mb-4">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl text-base"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              />
            </div>

            {searchResults.length > 0 ? (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectStock(stock)}
                    className="w-full px-2 py-3 text-left"
                  >
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {stock.shortName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {stock.name}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {POPULAR_STOCKS.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectStock(stock)}
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {stock.shortName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-xl p-5"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Time Machine Terms
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-full hover:bg-[var(--bg-secondary)]"
              >
                <X size={20} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  CAGR (Compound Annual Growth Rate)
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  The average yearly return on your investment, accounting for compounding. It shows what consistent annual return would be needed to grow from your initial investment to the final value.
                </p>
                <div
                  className="p-2 rounded text-xs font-mono"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  CAGR = (Final Value / Initial Value)^(1/Years) - 1
                </div>
              </div>

              <div className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Total Return %
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  The overall percentage gain or loss on your investment from start to finish, without considering time.
                </p>
              </div>

              <div className="pb-3" style={{ borderColor: 'var(--border)' }}>
                <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Shares Bought
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  The number of shares you could have purchased with your investment amount at the historical price. This is a fractional number for illustration purposes.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 py-2.5 rounded-lg font-medium text-sm"
              style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
