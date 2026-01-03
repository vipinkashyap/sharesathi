'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, RefreshCw, HelpCircle, X } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useLiveStock } from '@/hooks/useLiveStock';
import { useNews } from '@/hooks/useNews';
import { PriceDisplay } from '@/components/PriceDisplay';
import { InteractiveChart } from '@/components/InteractiveChart';
import { NewsCard } from '@/components/NewsCard';
import { WhatIfCard } from '@/components/WhatIfCard';
import { Card } from '@/components/ui/Card';
import { formatPrice, formatMarketCap, formatVolume } from '@/lib/formatters';
import WatchlistPickerModal from '@/components/WatchlistPickerModal';

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;

  const { stock, loading, isLive, refetch } = useLiveStock(symbol);
  const { news, loading: newsLoading } = useNews(stock?.name || symbol);

  const { isInAnyWatchlist } = useWatchlistStore();
  const inAnyWatchlist = isInAnyWatchlist(symbol);
  const [showPicker, setShowPicker] = useState(false);
  const [showTermsHelp, setShowTermsHelp] = useState(false);

  const handleWatchlistClick = () => {
    setShowPicker(true);
  };

  if (loading) {
    return (
      <div className="page-enter">
        <header className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="touch-target p-2 -ml-2">
            <ArrowLeft size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="h-6 w-32 bg-[var(--bg-secondary)] rounded animate-pulse" />
        </header>
        <div className="px-4 space-y-4">
          <div className="h-20 bg-[var(--bg-secondary)] rounded-xl animate-pulse" />
          <div className="h-48 bg-[var(--bg-secondary)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="page-enter">
        <header className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="touch-target p-2 -ml-2">
            <ArrowLeft size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
        </header>
        <div className="px-4 py-10 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>Stock not found</p>
        </div>
      </div>
    );
  }

  const isPositive = stock.changePercent >= 0;

  return (
    <div className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="touch-target p-2 -ml-2 rounded-full hover:bg-[var(--bg-secondary)]"
          >
            <ArrowLeft size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {stock.shortName}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              BSE: {stock.symbol}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="touch-target p-2 rounded-full hover:bg-[var(--bg-secondary)]"
            aria-label="Refresh"
          >
            <RefreshCw size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            onClick={handleWatchlistClick}
            className="touch-target p-2 rounded-full hover:bg-[var(--bg-secondary)]"
            aria-label={inAnyWatchlist ? 'Manage watchlists' : 'Add to watchlist'}
          >
            <Star
              size={24}
              className={inAnyWatchlist ? 'fill-yellow-400 text-yellow-400' : ''}
              style={{ color: inAnyWatchlist ? undefined : 'var(--text-muted)' }}
            />
          </button>
        </div>
      </header>

      {/* Price Section */}
      <div className="px-4 py-4">
        {isLive || stock.price > 0 ? (
          <>
            <PriceDisplay
              price={stock.price}
              change={stock.change}
              changePercent={stock.changePercent}
              size="lg"
            />
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {isLive ? 'Live data from Yahoo Finance' : 'Cached data - tap refresh for latest'}
            </p>
          </>
        ) : (
          <div className="py-4">
            <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
              Price data unavailable
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Tap refresh to try again
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-4 mb-4">
        <Card className="p-4">
          <InteractiveChart
            symbol={symbol}
            initialData={stock.priceHistory}
            currentPrice={stock.price}
            previousClose={stock.previousClose || stock.price}
          />
        </Card>
      </div>

      {/* Stock Details */}
      <div className="px-4 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Details
          </h2>
          <button
            onClick={() => setShowTermsHelp(true)}
            className="p-1 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
            title="What do these terms mean?"
            aria-label="Help"
          >
            <HelpCircle size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <Card>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            <DetailRow label="Company Name" value={stock.name} />
            <DetailRow label="BSE Code" value={stock.symbol} />
            {stock.open !== undefined && stock.open > 0 && (
              <DetailRow label="Open" value={formatPrice(stock.open)} />
            )}
            {stock.high !== undefined && stock.low !== undefined && stock.high > 0 && (
              <DetailRow
                label="Day Range"
                value={`${formatPrice(stock.low)} - ${formatPrice(stock.high)}`}
              />
            )}
            {stock.fiftyTwoWeekLow !== undefined && stock.fiftyTwoWeekHigh !== undefined && stock.fiftyTwoWeekHigh > 0 && (
              <DetailRow
                label="52W Range"
                value={`${formatPrice(stock.fiftyTwoWeekLow)} - ${formatPrice(stock.fiftyTwoWeekHigh)}`}
              />
            )}
            {stock.marketCap > 0 && (
              <DetailRow label="Market Cap" value={formatMarketCap(stock.marketCap)} />
            )}
            {stock.volume !== undefined && stock.volume > 0 && (
              <DetailRow label="Volume" value={formatVolume(stock.volume)} />
            )}
            {stock.previousClose !== undefined && stock.previousClose > 0 && (
              <DetailRow label="Prev Close" value={formatPrice(stock.previousClose)} />
            )}
          </div>
        </Card>
      </div>

      {/* AI Investment Story */}
      <div className="px-4 mt-4">
        <WhatIfCard
          stockName={stock.name}
          stockSymbol={stock.symbol}
          currentPrice={stock.price}
        />
      </div>

      {/* News */}
      <div className="px-4 mt-4">
        <NewsCard
          news={news.slice(0, 5)}
          loading={newsLoading}
          title={`${stock.shortName} News`}
        />
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />

      {/* Watchlist Picker Modal */}
      <WatchlistPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        stockSymbol={symbol}
        stockName={stock.name}
      />

      {/* Terms Help Modal */}
      {showTermsHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowTermsHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-xl p-5 max-h-[80vh] overflow-auto"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Stock Terms Explained
              </h2>
              <button
                onClick={() => setShowTermsHelp(false)}
                className="p-1 rounded-full hover:bg-[var(--bg-secondary)]"
              >
                <X size={20} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="space-y-4">
              <TermDefinition
                term="Open"
                definition="The price at which the stock started trading today when the market opened."
              />
              <TermDefinition
                term="Day Range"
                definition="The lowest and highest prices the stock traded at during today's session."
              />
              <TermDefinition
                term="52W Range"
                definition="The lowest and highest prices over the past 52 weeks (1 year). Helps gauge if the stock is near its yearly high or low."
              />
              <TermDefinition
                term="Market Cap"
                definition="Market Capitalization = Stock Price × Total Shares. Represents the total value of the company. Cr = Crores (10 million), L Cr = Lakh Crores (1 trillion)."
              />
              <TermDefinition
                term="Volume"
                definition="Number of shares traded today. High volume often indicates strong interest in the stock."
              />
              <TermDefinition
                term="Prev Close"
                definition="Yesterday's closing price. Today's change % is calculated from this price."
              />
            </div>

            <button
              onClick={() => setShowTermsHelp(false)}
              className="w-full mt-5 py-2.5 rounded-lg font-medium text-sm"
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-medium text-right flex-1 ml-4" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function TermDefinition({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        {term}
      </div>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {definition}
      </p>
    </div>
  );
}
