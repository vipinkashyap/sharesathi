# ShareSathi - Your Stock Companion

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sharesathi.vercel.app/)

**[Try it live: sharesathi.vercel.app](https://sharesathi.vercel.app/)**

A modern, mobile-first Progressive Web App (PWA) for tracking BSE (Bombay Stock Exchange) stocks. Built with Next.js 15 and designed for the Indian retail investor.

## Features

### Real-Time Stock Tracking
- Live price updates via Yahoo Finance API
- Interactive price charts with multiple timeframes (1D, 1W, 1M, 3M, 1Y)
- Key metrics: Market Cap, P/E Ratio, 52-week High/Low, Volume

### Market Monitor
- Full market view with all 6,900+ BSE stocks
- Sortable columns: Price, Change %, Volume, Market Cap
- Filter by index (NIFTY 50, Bank Nifty, IT, Pharma, Auto, etc.)
- Virtual scrolling for smooth performance
- Quick add to watchlist from market view

### Multiple Watchlists
- Create up to 10 custom watchlists
- Add up to 50 stocks per watchlist
- Curated "Top Picks" watchlist included
- Full management: create, rename, delete watchlists
- Portfolio analytics and metrics

### Market Overview
- Live market pulse with SENSEX, NIFTY & USD/INR
- Top gainers and losers at a glance
- Market status indicator (Open/Closed/Pre-market)

### Time Machine
- Interactive "What If" investment calculator
- Pick any stock and see returns over 1, 3, 5, or 10 years
- Visual chart showing your investment journey
- Calculate CAGR and total returns with real historical data

### Learn Section
- Built-in financial glossary powered by Grokipedia
- Search any stock market term
- Quick access to common concepts (P/E ratio, Market Cap, IPO, etc.)

### AI Chat Assistant
- Ask questions about your portfolio
- Get insights about market trends
- Powered by Groq's LLM API

### Latest News
- Curated financial news from Google News RSS
- Stock-specific news on detail pages

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS Variables for theming
- **State Management**: Zustand with localStorage persistence
- **Icons**: Lucide React
- **Charts**: Recharts
- **PWA**: Web Manifest + Standalone mode

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/vipinkashyap/sharesathi.git
cd sharesathi

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GROQ_API_KEY for the AI chat feature

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | API key for Groq LLM (AI chat) | Optional |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── chat/         # AI chat endpoint
│   │   ├── forex/        # USD/INR exchange rate
│   │   ├── indices/      # Market indices
│   │   ├── learn/        # Grokipedia proxy
│   │   ├── news/         # News RSS proxy
│   │   └── stock/        # Stock data & history from Yahoo Finance
│   ├── about/            # About ShareSathi page
│   ├── learn/            # Learn/glossary page
│   ├── search/           # Stock search page
│   ├── settings/         # App settings
│   ├── stock/[symbol]/   # Stock detail page
│   ├── market/           # Full market monitor
│   ├── timemachine/      # What-If investment calculator
│   └── watchlist/        # Watchlist management
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── data/                  # Static data files
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── services/              # API service functions
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

## Features in Detail

### PWA Support
Install ShareSathi on your phone for a native app experience:
- Add to Home Screen on iOS/Android
- Works offline with cached data
- Fast, app-like navigation

### Theme Support
- Light and Dark mode
- Adjustable font sizes (Normal, Large, Extra Large)
- Accessible color contrasts

### Data Management
- Export watchlists as JSON
- Clear cache without losing watchlists
- All data stored locally in browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and for personal/family use.

## Acknowledgments

- Stock data from Yahoo Finance
- Financial glossary powered by Grokipedia
- News from Google News RSS
- AI powered by Groq

---

Made with love for family
