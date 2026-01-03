'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { MarketStatus } from '@/components/MarketStatus';
import { MarketPulse } from '@/components/MarketPulse';
import { WatchlistSection } from '@/components/WatchlistSection';
import { TopMovers } from '@/components/TopMovers';
import { NewsCard } from '@/components/NewsCard';
import { ChatAssistant } from '@/components/ChatAssistant';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useNews } from '@/hooks/useNews';
import { Stock } from '@/types';

export default function Dashboard() {
  const watchlists = useWatchlistStore((state) => state.watchlists);
  const activeWatchlistId = useWatchlistStore((state) => state.activeWatchlistId);
  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId);

  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [gainers, setGainers] = useState<Stock[]>([]);
  const [losers, setLosers] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const { news, loading: newsLoading } = useNews();

  // Fetch live stock data from batch API
  const fetchStocks = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return [];
    try {
      const response = await fetch(`/api/stocks/batch?symbols=${symbols.join(',')}`);
      if (!response.ok) return [];
      const data = await response.json();
      return symbols
        .map((symbol) => data.stocks?.[symbol])
        .filter((s): s is Stock => s !== undefined && s.price > 0);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Fetch watchlist stocks
      if (activeWatchlist && activeWatchlist.symbols.length > 0) {
        const stocks = await fetchStocks(activeWatchlist.symbols);
        setWatchlistStocks(stocks);

        // Calculate gainers/losers from watchlist
        const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
        setGainers(sorted.filter((s) => s.changePercent > 0).slice(0, 5));
        setLosers(sorted.filter((s) => s.changePercent < 0).slice(-5).reverse());
      } else {
        setWatchlistStocks([]);
        setGainers([]);
        setLosers([]);
      }

      setLoading(false);
    };

    loadData();
  }, [activeWatchlist, fetchStocks]);

  return (
    <div className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ShareSathi
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/timemachine"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm"
              style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
            >
              <Clock size={14} />
              Time Machine
            </Link>
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm"
              style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
            >
              About
            </Link>
          </div>
        </div>
        <MarketStatus />
      </header>

      {/* Content */}
      <div className="space-y-6 pb-6">
        <MarketPulse />
        <WatchlistSection stocks={watchlistStocks} watchlist={activeWatchlist} loading={loading} />
        <TopMovers gainers={gainers} losers={losers} />

        {/* News Section */}
        <div className="px-4">
          <NewsCard news={news.slice(0, 15)} loading={newsLoading} />
        </div>
      </div>

      {/* AI Chat FAB */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: 'var(--accent-blue)' }}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={24} color="white" />
      </button>

      {/* Chat Modal */}
      {showChat && (
        <ChatAssistant
          stocks={watchlistStocks.map(s => ({
            symbol: s.symbol,
            name: s.name,
            price: s.price,
            changePercent: s.changePercent,
          }))}
          onClose={() => setShowChat(false)}
          isModal
        />
      )}
    </div>
  );
}
