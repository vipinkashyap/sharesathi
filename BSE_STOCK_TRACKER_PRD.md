# BSE Stock Tracker - Product Requirements Document

## Overview

Build a modern, enjoyable stock tracking application for monitoring BSE (Bombay Stock Exchange) stocks. The primary user is a retired/semi-retired individual who currently uses Google Sheets to track stocks. The goal is to create something that's not just functional, but genuinely delightful to use daily.

**Target User Profile:**
- Age: 55-70 years old
- Tech comfort: Moderate (uses smartphones, WhatsApp, Google Sheets)
- Usage pattern: Checks stocks 2-5 times daily, especially morning and evening
- Needs: Simple interface, clear visual feedback, no complex trading features
- Device: Primarily mobile phone, occasionally laptop

---

## Core Philosophy

1. **Clarity over density** - Unlike trading terminals, prioritize readability
2. **Glanceable insights** - Key info visible in 2 seconds
3. **Delightful feedback** - Satisfying animations for gains, gentle treatment of losses
4. **Zero learning curve** - If it needs explanation, redesign it
5. **Works offline** - Cached data for spotty connections
6. **Accessible** - Large touch targets, high contrast, readable fonts

---

## Tech Stack (Recommended)

```
Frontend: Next.js 14+ (App Router) with TypeScript
Styling: Tailwind CSS
State: Zustand (simple, lightweight)
Data: 
  - Primary: BSE/NSE official APIs or reliable free alternatives
  - Fallback: Google Finance API, Yahoo Finance
Storage: localStorage for watchlist, IndexedDB for historical data
Deployment: Vercel (free tier sufficient)
PWA: Yes - installable on phone home screen
```

### Alternative Simpler Stack
```
If Claude Code prefers simpler setup:
- Vite + React + TypeScript
- Tailwind CSS
- Deploy to Netlify/Vercel
```

---

## Data Sources

### Option 1: BSE India Official (Recommended)
```
Base URL: https://api.bseindia.com/
Endpoints:
- /BseIndiaAPI/api/StockReachGraph/w?scripcode={code}&flag=0
- /BseIndiaAPI/api/getScripHeaderData?Ession=&scripcode={code}
```

### Option 2: Google Finance (Scraping with caution)
```
URL Pattern: https://www.google.com/finance/quote/{SYMBOL}:BOM
```

### Option 3: Yahoo Finance API
```
URL: https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}.BO
Free, reliable, has historical data
```

### Option 4: Upstox/Angel One APIs (if user has demat)
```
Free tier available with demat account
More reliable, includes live data
```

### Recommendation
Start with Yahoo Finance API - it's free, doesn't require auth, and has good historical data. Add BSE official as enhancement later.

---

## Features Specification

### 1. Dashboard (Home Screen)

**Layout:**
```
┌─────────────────────────────────────┐
│  🕐 Last updated: 3:45 PM          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  📊 Market Pulse                    │
│  ┌─────────┐ ┌─────────┐           │
│  │ SENSEX  │ │ NIFTY   │           │
│  │ 78,234  │ │ 23,567  │           │
│  │ +0.45%  │ │ +0.52%  │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  ⭐ My Watchlist (5)               │
│  ┌─────────────────────────────┐   │
│  │ RELIANCE    ₹1,574   +5.5% │   │
│  │ TCS         ₹3,226  +21.0% │   │
│  │ HDFC BANK   ₹990     -1.0% │   │
│  │ INFOSYS     ₹1,629  +13.0% │   │
│  │ ICICI BANK  ₹1,337   -5.6% │   │
│  └─────────────────────────────┘   │
│                                     │
│  🔥 Top Movers Today               │
│  ┌─────────────────────────────┐   │
│  │ Gainers │ Losers            │   │
│  │ BAJAJ AUTO  +217 (+2.3%)    │   │
│  │ ULTRATECH   +111 (+0.9%)    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [────────────────────────────]    │
│   🏠    🔍    ⭐    📈    ⚙️       │
└─────────────────────────────────────┘
```

**Requirements:**
- Auto-refresh every 1 minute during market hours (9:15 AM - 3:30 PM IST)
- Manual pull-to-refresh
- Show "Market Closed" badge outside trading hours
- Smooth number animations when prices update
- Green/red color coding with sufficient contrast (not just hue)

### 2. Watchlist Management

**Features:**
- Add stocks via search (by name or BSE code)
- Remove with swipe or long-press
- Reorder via drag-and-drop
- Maximum 50 stocks (prevents performance issues)
- Sync across devices via simple shareable code (optional v2)

**Empty State:**
```
┌─────────────────────────────────────┐
│                                     │
│         ⭐                          │
│                                     │
│   Your watchlist is empty           │
│                                     │
│   Add your favorite stocks to       │
│   track them here                   │
│                                     │
│   [ + Add First Stock ]             │
│                                     │
└─────────────────────────────────────┘
```

### 3. Stock Search

**Requirements:**
- Fuzzy search (typing "rel" finds "Reliance")
- Search by company name OR BSE code
- Recent searches (last 10)
- Popular stocks section for new users
- Instant results as you type (debounced 300ms)

**Search Result Card:**
```
┌─────────────────────────────────────┐
│ 🔍 rel                              │
├─────────────────────────────────────┤
│ Reliance Industries Ltd             │
│ BSE: 500325 • ₹1,574.90 • +0.35%   │
│                            [ ⭐ Add ]│
├─────────────────────────────────────┤
│ Reliance Capital Ltd                │
│ BSE: 500111 • ₹12.50 • -2.10%      │
│                            [ ⭐ Add ]│
└─────────────────────────────────────┘
```

### 4. Stock Detail View

**When user taps a stock:**
```
┌─────────────────────────────────────┐
│ ← Reliance Industries          ⭐   │
├─────────────────────────────────────┤
│                                     │
│     ₹1,574.90                       │
│     +₹5.50 (+0.35%) today          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📈 Simple price chart      │   │
│  │     (last 30 days)          │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ 1D ] [ 1W ] [ 1M ] [ 3M ] [ 1Y ]│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Day Range     ₹1,560 - ₹1,580     │
│  52W Range     ₹1,200 - ₹1,650     │
│  Market Cap    ₹21.3L Cr           │
│  Volume        12.5L               │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📰 Latest News (optional v2)      │
│                                     │
└─────────────────────────────────────┘
```

### 5. Top Movers Screen

**Two tabs:**
- 🟢 **Top Gainers** - Stocks with highest % gain today
- 🔴 **Top Losers** - Stocks with highest % loss today

**Filters:**
- All Stocks
- Large Cap (>₹50,000 Cr)
- Mid Cap (₹10,000 - ₹50,000 Cr)
- Small Cap (<₹10,000 Cr)

### 6. Settings

```
┌─────────────────────────────────────┐
│ ⚙️ Settings                         │
├─────────────────────────────────────┤
│                                     │
│ Display                             │
│ ┌─────────────────────────────┐    │
│ │ Theme          [ Light ▼ ]  │    │
│ │ Font Size      [ Large ▼ ]  │    │
│ │ Number Format  [ Indian ▼ ] │    │
│ └─────────────────────────────┘    │
│                                     │
│ Notifications (v2)                  │
│ ┌─────────────────────────────┐    │
│ │ Price Alerts      [ OFF ]   │    │
│ │ Market Open       [ OFF ]   │    │
│ │ Market Close      [ OFF ]   │    │
│ └─────────────────────────────┘    │
│                                     │
│ Data                                │
│ ┌─────────────────────────────┐    │
│ │ [ Clear Cache ]             │    │
│ │ [ Export Watchlist ]        │    │
│ │ [ Import Watchlist ]        │    │
│ └─────────────────────────────┘    │
│                                     │
│ About                               │
│ Made with ❤️ by [Your Name]         │
│ v1.0.0                              │
│                                     │
└─────────────────────────────────────┘
```

---

## UI/UX Guidelines

### Color Palette

```css
/* Light Theme */
--bg-primary: #FAFAFA;
--bg-card: #FFFFFF;
--text-primary: #1A1A1A;
--text-secondary: #666666;
--accent-green: #0D9F4F;      /* Gains - not too bright */
--accent-green-bg: #E6F7ED;
--accent-red: #D93025;        /* Losses - clear but not alarming */
--accent-red-bg: #FCE8E6;
--accent-blue: #1A73E8;       /* Interactive elements */
--border: #E5E5E5;

/* Dark Theme */
--bg-primary: #121212;
--bg-card: #1E1E1E;
--text-primary: #FFFFFF;
--text-secondary: #A0A0A0;
--accent-green: #34D399;
--accent-green-bg: #064E3B;
--accent-red: #F87171;
--accent-red-bg: #7F1D1D;
```

### Typography

```css
/* Use system fonts for best performance and familiarity */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Sizes - optimized for older users */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;    /* Minimum for body text */
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;     /* For main price display */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Touch Targets

```css
/* Minimum 44x44px for all interactive elements */
.button, .card-clickable, .icon-button {
  min-height: 44px;
  min-width: 44px;
}
```

### Animations

```css
/* Subtle, purposeful animations */
.price-update {
  animation: pulse 0.3s ease-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Page transitions */
.page-enter {
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Data Models

### Stock

```typescript
interface Stock {
  symbol: string;           // BSE code e.g., "500325"
  name: string;             // "Reliance Industries Ltd"
  shortName: string;        // "RELIANCE" 
  price: number;            // Current price
  change: number;           // Absolute change (₹)
  changePercent: number;    // Percentage change
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;        // In crores
  timestamp: Date;
}
```

### Watchlist Item

```typescript
interface WatchlistItem {
  symbol: string;
  addedAt: Date;
  order: number;            // For custom sorting
  notes?: string;           // Optional user notes (v2)
  alertPrice?: number;      // Price alert (v2)
}
```

### Historical Data Point

```typescript
interface PricePoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

---

## API Integration

### Fetching Stock Data

```typescript
// services/stockApi.ts

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function getStockQuote(symbol: string): Promise<Stock> {
  // Yahoo uses .BO suffix for BSE stocks
  const response = await fetch(
    `${YAHOO_BASE}/${symbol}.BO?interval=1d&range=1d`
  );
  const data = await response.json();
  
  // Transform Yahoo response to our Stock interface
  return transformYahooResponse(data);
}

export async function getHistoricalData(
  symbol: string, 
  range: '1d' | '5d' | '1mo' | '3mo' | '1y'
): Promise<PricePoint[]> {
  const interval = range === '1d' ? '5m' : range === '5d' ? '15m' : '1d';
  
  const response = await fetch(
    `${YAHOO_BASE}/${symbol}.BO?interval=${interval}&range=${range}`
  );
  const data = await response.json();
  
  return transformToHistorical(data);
}

export async function searchStocks(query: string): Promise<Stock[]> {
  // Use Yahoo's search API or maintain local stock list
  // Recommendation: Keep a local JSON of all BSE stocks for instant search
}
```

### Rate Limiting & Caching

```typescript
// services/cache.ts

const CACHE_DURATION = {
  quote: 60 * 1000,        // 1 minute during market hours
  historical: 5 * 60 * 1000, // 5 minutes
  search: 24 * 60 * 60 * 1000, // 24 hours
};

export function getCachedData<T>(key: string): T | null {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  const { data, timestamp, duration } = JSON.parse(cached);
  if (Date.now() - timestamp > duration) {
    localStorage.removeItem(key);
    return null;
  }
  
  return data;
}

export function setCachedData<T>(key: string, data: T, duration: number): void {
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now(),
    duration,
  }));
}
```

---

## PWA Configuration

### manifest.json

```json
{
  "name": "BSE Stock Tracker",
  "short_name": "Stocks",
  "description": "Track your favorite BSE stocks",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAFAFA",
  "theme_color": "#1A73E8",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Strategy

```typescript
// Cache static assets aggressively
// Cache API responses with stale-while-revalidate
// Show offline fallback page when no connection
```

---

## Project Structure

```
bse-stock-tracker/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── stock/
│   │   │   └── [symbol]/
│   │   │       └── page.tsx
│   │   ├── watchlist/
│   │   │   └── page.tsx
│   │   ├── movers/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── StockCard.tsx
│   │   ├── PriceDisplay.tsx
│   │   ├── MiniChart.tsx
│   │   ├── SearchBar.tsx
│   │   ├── WatchlistItem.tsx
│   │   ├── MarketStatus.tsx
│   │   └── BottomNav.tsx
│   │
│   ├── hooks/
│   │   ├── useStockData.ts
│   │   ├── useWatchlist.ts
│   │   ├── useMarketStatus.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── services/
│   │   ├── stockApi.ts
│   │   ├── cache.ts
│   │   └── storage.ts
│   │
│   ├── store/
│   │   ├── watchlistStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── data/
│   │   └── bseStocks.json      # Static list of all BSE stocks
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   └── formatters.ts       # Indian number formatting, etc.
│   │
│   └── types/
│       └── index.ts
│
├── public/
│   ├── icons/
│   └── manifest.json
│
├── tailwind.config.js
├── next.config.js
└── package.json
```

---

## Indian Number Formatting

**Critical for user familiarity:**

```typescript
// lib/formatters.ts

export function formatIndianNumber(num: number): string {
  // Convert 1234567 to "12,34,567"
  const numStr = Math.abs(num).toFixed(0);
  const [whole, decimal] = numStr.split('.');
  
  let result = '';
  let count = 0;
  
  for (let i = whole.length - 1; i >= 0; i--) {
    if (count === 3) {
      result = ',' + result;
      count = 0;
    } else if (count > 3 && (count - 3) % 2 === 0) {
      result = ',' + result;
    }
    result = whole[i] + result;
    count++;
  }
  
  return (num < 0 ? '-' : '') + result + (decimal ? '.' + decimal : '');
}

export function formatPrice(price: number): string {
  return '₹' + formatIndianNumber(price);
}

export function formatMarketCap(crores: number): string {
  if (crores >= 100000) {
    return `₹${(crores / 100000).toFixed(1)}L Cr`;  // Lakh crores
  } else if (crores >= 1000) {
    return `₹${(crores / 1000).toFixed(1)}K Cr`;   // Thousand crores
  }
  return `₹${formatIndianNumber(crores)} Cr`;
}

export function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}₹${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}
```

---

## Market Hours Logic

```typescript
// lib/marketHours.ts

export function isMarketOpen(): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  
  const day = istTime.getUTCDay();
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Market closed on weekends
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:15 AM to 3:30 PM IST
  const marketOpen = 9 * 60 + 15;   // 9:15 AM
  const marketClose = 15 * 60 + 30;  // 3:30 PM
  
  return totalMinutes >= marketOpen && totalMinutes <= marketClose;
}

export function getMarketStatus(): 'open' | 'closed' | 'pre-open' | 'post-close' {
  // Add more nuanced status
}

export function getNextMarketOpen(): Date {
  // Calculate when market opens next
}
```

---

## Error Handling

```typescript
// components/ErrorBoundary.tsx

export function ErrorFallback({ error, resetError }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">📉</div>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">
        Don't worry, your watchlist is safe
      </p>
      <button 
        onClick={resetError}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Try Again
      </button>
    </div>
  );
}
```

---

## Testing Checklist

### Before Launch

- [ ] Works offline (shows cached data)
- [ ] Pull-to-refresh works on mobile
- [ ] Add/remove stocks from watchlist
- [ ] Search finds stocks correctly
- [ ] Prices update during market hours
- [ ] Shows market closed status correctly
- [ ] Indian number formatting throughout
- [ ] Dark/light theme toggle
- [ ] Installable as PWA
- [ ] Touch targets are 44px minimum
- [ ] Text is readable (16px+ body)
- [ ] Colors pass contrast check

### User Testing with FIL

- [ ] Can add his current stocks without help
- [ ] Understands all displayed information
- [ ] Can navigate without asking
- [ ] Enjoys using it more than sheets
- [ ] Works well on his specific phone

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set up custom domain (optional)
vercel domains add stocks.yourdomain.com
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_APP_NAME="BSE Stock Tracker"
# Add any API keys if needed
```

---

## Future Enhancements (v2+)

1. **Price Alerts** - Push notifications when stocks hit target price
2. **Portfolio Tracking** - Add purchase price, track gains/losses
3. **News Integration** - Show relevant news for watchlist stocks
4. **Widgets** - iOS/Android home screen widgets
5. **Export Reports** - PDF summaries for tax filing
6. **Multi-user** - Shareable watchlists between family members
7. **Voice Updates** - "Hey Google, how's my portfolio?"

---

## Quick Start for Claude Code

```bash
# Initialize project
npx create-next-app@latest bse-stock-tracker --typescript --tailwind --app

# Navigate to project
cd bse-stock-tracker

# Install additional dependencies
npm install zustand @tanstack/react-query lucide-react

# Start development
npm run dev
```

**First prompt to Claude Code:**
> "Read the PRD in this file completely. Then create the basic project structure with the Dashboard page showing a static watchlist with 5 sample stocks. Use the color palette and typography specified. Make sure it's mobile-first and the prices use Indian number formatting."

---

## Sample Stock Data for Development

```json
[
  {"symbol": "500325", "name": "Reliance Industries Ltd", "shortName": "RELIANCE", "price": 1574.90, "change": 5.50, "changePercent": 0.35, "marketCap": 2130616},
  {"symbol": "532540", "name": "Tata Consultancy Services Ltd", "shortName": "TCS", "price": 3226.80, "change": 21.05, "changePercent": 0.66, "marketCap": 1167657},
  {"symbol": "500180", "name": "HDFC Bank Ltd", "shortName": "HDFCBANK", "price": 990.75, "change": -1.00, "changePercent": -0.10, "marketCap": 759115},
  {"symbol": "500209", "name": "Infosys Ltd", "shortName": "INFY", "price": 1629.50, "change": 13.05, "changePercent": 0.81, "marketCap": 675312},
  {"symbol": "532174", "name": "ICICI Bank Ltd", "shortName": "ICICIBANK", "price": 1337.25, "change": -5.65, "changePercent": -0.42, "marketCap": 953359}
]
```

---

## Notes for Developer

1. **Don't over-engineer** - This is for personal use, not a startup
2. **Test on actual device** - FIL's phone, not just browser devtools  
3. **Ask FIL for feedback early** - After basic watchlist works
4. **Keep bundle small** - Fast loading on 4G is crucial
5. **No login required** - localStorage is fine for v1
6. **Respect data** - Cache aggressively, fetch sparingly

---

*Good luck! Build something your FIL will love using every day.* 🚀
