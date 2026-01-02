'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Info, Clock, ArrowRight } from 'lucide-react';
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
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ShareSathi
          </h1>
          <Link
            href="/about"
            className="p-2 rounded-full hover:bg-bg-secondary transition-colors"
            aria-label="About ShareSathi"
          >
            <Info size={22} style={{ color: 'var(--text-muted)' }} />
          </Link>
        </div>
        <MarketStatus />
      </header>

      {/* Content */}
      <div className="space-y-6 pb-6">
        <MarketPulse />
        <WatchlistSection stocks={watchlistStocks} watchlist={activeWatchlist} loading={loading} />
        <TopMovers gainers={gainers} losers={losers} />

        {/* Time Machine Card */}
        <div className="px-4">
          <Link href="/timemachine">
            <Card className="p-4 border-2 hover:border-[var(--accent-blue)] transition-colors" style={{ borderColor: 'var(--accent-blue-bg)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-blue-bg)' }}>
                    <Clock size={20} style={{ color: 'var(--accent-blue)' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Time Machine
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      What if you invested 5 years ago?
                    </div>
                  </div>
                </div>
                <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            </Card>
          </Link>
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
