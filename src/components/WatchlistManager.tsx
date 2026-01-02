'use client';

import { useState } from 'react';
import { X, Trash2, Lock, Check, Pencil } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';
import { Watchlist } from '@/types';

interface WatchlistManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WatchlistManager({
  isOpen,
  onClose,
}: WatchlistManagerProps) {
  const { watchlists, renameWatchlist, deleteWatchlist } = useWatchlistStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const sortedWatchlists = [...watchlists].sort((a, b) => a.order - b.order);
  const userWatchlists = watchlists.filter((w) => !w.isDefault);
  const canDelete = userWatchlists.length > 1;

  const handleStartEdit = (watchlist: Watchlist) => {
    if (watchlist.isDefault) return;
    setEditingId(watchlist.id);
    setEditName(watchlist.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      renameWatchlist(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id: string) => {
    deleteWatchlist(id);
    setDeleteConfirmId(null);
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
          <h2 className="text-lg font-semibold">Manage Watchlists</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {sortedWatchlists.map((watchlist) => (
              <div
                key={watchlist.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {watchlist.isDefault ? (
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <div className="w-4" />
                )}

                <div className="flex-1 min-w-0">
                  {editingId === watchlist.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      maxLength={30}
                    />
                  ) : (
                    <div>
                      <span className="font-medium">{watchlist.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({watchlist.symbols.length} stocks)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {editingId === watchlist.id ? (
                    <button
                      onClick={handleSaveEdit}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      {!watchlist.isDefault && (
                        <button
                          onClick={() => handleStartEdit(watchlist)}
                          className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}

                      {!watchlist.isDefault && canDelete && (
                        <>
                          {deleteConfirmId === watchlist.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(watchlist.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(watchlist.id)}
                              className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!canDelete && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              You need at least one personal watchlist.
            </p>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
