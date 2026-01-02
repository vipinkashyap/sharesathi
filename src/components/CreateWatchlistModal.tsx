'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';
import { MAX_WATCHLISTS } from '@/types';

interface CreateWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export default function CreateWatchlistModal({
  isOpen,
  onClose,
  onCreated,
}: CreateWatchlistModalProps) {
  const [name, setName] = useState('');
  const { createWatchlist, watchlists, canCreateWatchlist } = useWatchlistStore();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = createWatchlist(name.trim());
    if (id) {
      onCreated?.(id);
      setName('');
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const canCreate = canCreateWatchlist();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create Watchlist</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {!canCreate ? (
            <div className="text-center py-4">
              <p className="text-gray-600">
                You&apos;ve reached the maximum of {MAX_WATCHLISTS} watchlists.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Delete an existing watchlist to create a new one.
              </p>
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watchlist Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Tech Stocks, Banking, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">
                {watchlists.length} of {MAX_WATCHLISTS} watchlists used
              </p>
            </>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {canCreate && (
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
