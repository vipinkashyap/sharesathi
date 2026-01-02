'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Clock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { MarketStatus } from '@/components/MarketStatus';
import { MarketPulse } from '@/components/MarketPulse';
import { WatchlistSection } from '@/components/WatchlistSection';
import { TopMovers } from '@/components/TopMovers';
import { NewsCard } from '@/components/NewsCard';
import { ChatAssistant } from '@/components/ChatAssistant';
import { Card } from '@/components/ui/Card';
import { useWatchlistStore } from '@/store/watchlistStore';
import { getStocksBySymbols, getTopGainers, getTopLosers } from '@/services/stockApi';
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

  useEffect(() => {
    // Load stock data for active watchlist
    if (activeWatchlist) {
      const stocks = getStocksBySymbols(activeWatchlist.symbols);
      setWatchlistStocks(stocks);
    } else {
      setWatchlistStocks([]);
    }
    setGainers(getTopGainers(5));
    setLosers(getTopLosers(5));
    setLoading(false);
  }, [activeWatchlist]);

  return (
    <div className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ShareSathi
          </h1>
        </div>
        <MarketStatus />
      </header>

      {/* Content */}
      <div className="space-y-6 pb-6">
        <MarketPulse />
        <WatchlistSection stocks={watchlistStocks} watchlist={activeWatchlist} loading={loading} />
        <TopMovers gainers={gainers} losers={losers} />

        {/* Quick Actions */}
        <div className="px-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-blue)' }} />
            Explore
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Time Machine */}
            <Link href="/timemachine">
              <Card className="p-4 h-full hover:ring-2 hover:ring-[var(--accent-blue)] transition-all">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--accent-blue-bg)' }}>
                  <Clock size={20} style={{ color: 'var(--accent-blue)' }} />
                </div>
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Time Machine
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  What if you invested years ago?
                </div>
              </Card>
            </Link>

            {/* Learn */}
            <Link href="/learn">
              <Card className="p-4 h-full hover:ring-2 hover:ring-[var(--accent-blue)] transition-all">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--accent-green-bg)' }}>
                  <BookOpen size={20} style={{ color: 'var(--accent-green)' }} />
                </div>
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Learn
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Understand market terms
                </div>
              </Card>
            </Link>

            {/* About */}
            <Link href="/about" className="col-span-2">
              <Card className="p-4 hover:ring-2 hover:ring-[var(--accent-blue)] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📈</div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        About ShareSathi
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Your companion for BSE stock tracking
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* News Section */}
        <div className="px-4">
          <NewsCard news={news.slice(0, 5)} loading={newsLoading} />
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
