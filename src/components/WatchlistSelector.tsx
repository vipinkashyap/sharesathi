'use client';

import { Watchlist } from '@/types';
import { Lock, Plus } from 'lucide-react';

interface WatchlistSelectorProps {
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  showCreateButton?: boolean;
}

export default function WatchlistSelector({
  watchlists,
  activeWatchlistId,
  onSelect,
  onCreate,
  showCreateButton = true,
}: WatchlistSelectorProps) {
  const sortedWatchlists = [...watchlists].sort((a, b) => a.order - b.order);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {sortedWatchlists.map((watchlist) => {
        const isActive = watchlist.id === activeWatchlistId;
        return (
          <button
            key={watchlist.id}
            onClick={() => onSelect(watchlist.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              whitespace-nowrap transition-all shrink-0
              ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {watchlist.isDefault && (
              <Lock className="w-3 h-3 opacity-70" />
            )}
            <span>{watchlist.name}</span>
            <span
              className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-blue-500' : 'bg-gray-200'}
              `}
            >
              {watchlist.symbols.length}
            </span>
          </button>
        );
      })}

      {showCreateButton && onCreate && (
        <button
          onClick={onCreate}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
            bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      )}
    </div>
  );
}
