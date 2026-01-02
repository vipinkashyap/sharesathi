'use client';

import { useState } from 'react';
import { X, Check, Plus, Lock } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';

interface WatchlistPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockSymbol: string;
  stockName: string;
}

export default function WatchlistPickerModal({
  isOpen,
  onClose,
  stockSymbol,
  stockName,
}: WatchlistPickerModalProps) {
  const {
    watchlists,
    addStock,
    removeStock,
    createWatchlist,
    setActiveWatchlist,
    canCreateWatchlist,
  } = useWatchlistStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const sortedWatchlists = [...watchlists].sort((a, b) => a.order - b.order);

  const handleToggle = (watchlistId: string, isInList: boolean) => {
    if (isInList) {
      removeStock(stockSymbol, watchlistId);
    } else {
      addStock(stockSymbol, watchlistId);
    }
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const id = createWatchlist(newName.trim());
    if (id) {
      addStock(stockSymbol, id);
      setActiveWatchlist(id);
      setNewName('');
      setShowCreate(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Add to Watchlist</h2>
            <p className="text-sm text-gray-500">{stockName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {sortedWatchlists.map((watchlist) => {
              const isInList = watchlist.symbols.includes(stockSymbol);
              const canAdd = !watchlist.isDefault;

              return (
                <button
                  key={watchlist.id}
                  onClick={() => canAdd && handleToggle(watchlist.id, isInList)}
                  disabled={!canAdd}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                    ${canAdd ? 'hover:bg-gray-100' : 'opacity-60 cursor-not-allowed'}
                    ${isInList && canAdd ? 'bg-blue-50' : 'bg-gray-50'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                      ${isInList ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}
                      ${!canAdd ? 'border-gray-200' : ''}
                    `}
                  >
                    {isInList && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {watchlist.isDefault && (
                        <Lock className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="font-medium">{watchlist.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {watchlist.symbols.length} stocks
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {showCreate ? (
            <form onSubmit={handleCreateAndAdd} className="mt-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New watchlist name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
                maxLength={30}
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setNewName('');
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  Create & Add
                </button>
              </div>
            </form>
          ) : (
            canCreateWatchlist() && (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Watchlist</span>
              </button>
            )
          )}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
