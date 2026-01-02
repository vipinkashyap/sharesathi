'use client';

import { useEffect, useState } from 'react';
import { Settings, Sun, Moon, Type, Trash2, Download, Heart, Database } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { Card } from '@/components/ui/Card';

export default function SettingsPage() {
  const { theme, fontSize, symbolFormat, setTheme, setFontSize, setSymbolFormat } = useSettingsStore();
  const { symbols } = useWatchlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply font size
    document.documentElement.classList.remove('font-large', 'font-extra-large');
    if (fontSize === 'large') {
      document.documentElement.classList.add('font-large');
    } else if (fontSize === 'extra-large') {
      document.documentElement.classList.add('font-extra-large');
    }
  }, [theme, fontSize, mounted]);

  const handleClearCache = () => {
    if (confirm('This will clear all cached data. Your watchlist will be preserved. Continue?')) {
      // Clear localStorage except watchlist and settings
      const watchlist = localStorage.getItem('sharesathi-watchlist');
      const settings = localStorage.getItem('sharesathi-settings');
      localStorage.clear();
      if (watchlist) localStorage.setItem('sharesathi-watchlist', watchlist);
      if (settings) localStorage.setItem('sharesathi-settings', settings);
      alert('Cache cleared successfully!');
    }
  };

  const handleExportWatchlist = () => {
    const data = JSON.stringify(symbols, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sharesathi-watchlist.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <Settings size={24} style={{ color: 'var(--accent-blue)' }} />
          Settings
        </h1>
      </header>

      {/* Content */}
      <div className="px-4 py-4 space-y-6">
        {/* Display Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Display
          </h2>
          <Card>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {/* Theme */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon size={20} style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <Sun size={20} style={{ color: 'var(--text-secondary)' }} />
                  )}
                  <span style={{ color: 'var(--text-primary)' }}>Theme</span>
                </div>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                  className="px-3 py-2 rounded-lg text-sm font-medium touch-target"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Type size={20} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>Font Size</span>
                </div>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as 'normal' | 'large' | 'extra-large')}
                  className="px-3 py-2 rounded-lg text-sm font-medium touch-target"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
            </div>
          </Card>
        </section>

        {/* Stock Symbol Format */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Stock Symbols
          </h2>
          <Card>
            <div className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database size={20} style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <span style={{ color: 'var(--text-primary)' }}>Symbol Format</span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      How stock codes are displayed
                    </p>
                  </div>
                </div>
                <select
                  value={symbolFormat}
                  onChange={(e) => setSymbolFormat(e.target.value as 'bse' | 'nse')}
                  className="px-3 py-2 rounded-lg text-sm font-medium touch-target"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <option value="bse">BSE (500325)</option>
                  <option value="nse">NSE (RELIANCE)</option>
                </select>
              </div>
            </div>
          </Card>
          <p className="text-xs mt-2 px-1" style={{ color: 'var(--text-muted)' }}>
            BSE uses numeric codes. NSE uses company ticker symbols.
          </p>
        </section>

        {/* Data Management Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Data Management
          </h2>
          <Card>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={handleClearCache}
                className="flex items-center gap-3 w-full py-3 text-left touch-target"
              >
                <Trash2 size={20} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Clear Cache</span>
              </button>

              <button
                onClick={handleExportWatchlist}
                className="flex items-center gap-3 w-full py-3 text-left touch-target"
              >
                <Download size={20} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Export Watchlist</span>
              </button>
            </div>
          </Card>
        </section>

        {/* About Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            About
          </h2>
          <Card className="text-center py-6">
            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              ShareSathi
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Version 1.0.0
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Stock data powered by Yahoo Finance
            </p>
            <p className="text-sm flex items-center justify-center gap-1 mt-2" style={{ color: 'var(--text-muted)' }}>
              Made with <Heart size={14} className="text-red-500 fill-red-500" /> for family
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
