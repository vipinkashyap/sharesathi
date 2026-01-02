'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, Quote } from 'lucide-react';
import { Card } from '@/components/ui/Card';

// Fallback investment quotes if API fails
const FALLBACK_QUOTES = [
  { quote: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { quote: "In investing, what is comfortable is rarely profitable.", author: "Robert Arnott" },
  { quote: "Know what you own, and know why you own it.", author: "Peter Lynch" },
  { quote: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Compound interest is the eighth wonder of the world.", author: "Albert Einstein" },
  { quote: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
  { quote: "Time in the market beats timing the market.", author: "Ken Fisher" },
];

interface WhatIfCardProps {
  stockName: string;
  stockSymbol: string;
  currentPrice: number;
}

interface QuoteData {
  quote: string;
  author: string;
}

// Investment Quote component - fetches from free API
function InvestmentQuote() {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      // Using ZenQuotes API - free, no auth required
      const response = await fetch('https://zenquotes.io/api/random');
      if (response.ok) {
        const data = await response.json();
        if (data && data[0]) {
          setQuoteData({
            quote: data[0].q,
            author: data[0].a,
          });
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('ZenQuotes API error:', error);
    }

    // Fallback to local quotes
    const randomQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    setQuoteData(randomQuote);
    setLoading(false);
  };

  useEffect(() => {
    // Start with a fallback quote immediately, then try API
    const randomQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    setQuoteData(randomQuote);
  }, []);

  const { quote, author } = quoteData || FALLBACK_QUOTES[0];

  return (
    <Card className="p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-start gap-2">
        <Quote size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
        <div className="flex-1">
          <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
            {quote}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              - {author}
            </p>
            <button
              onClick={fetchQuote}
              disabled={loading}
              className="p-1 rounded-full hover:bg-[var(--bg-card)] transition-colors"
              title="Get new quote"
            >
              <RefreshCw
                size={12}
                className={loading ? 'animate-spin' : ''}
                style={{ color: 'var(--text-muted)' }}
              />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function WhatIfCard({ stockName, stockSymbol, currentPrice }: WhatIfCardProps) {
  const [aiStory, setAiStory] = useState<string | null>(null);
  const [loadingStory, setLoadingStory] = useState(false);

  const generateStory = async () => {
    setLoadingStory(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a short "What If" investment story about ${stockName} (${stockSymbol}) at current price Rs ${currentPrice.toFixed(2)}. Keep it 2-3 sentences, inspiring, use Indian context.`
          }],
          customPrompt: `You are a friendly Indian stock market storyteller. Generate brief, engaging "What If" investment stories. Make them relatable for Indian investors, use simple language. Include an emoji at the start. Be factual but inspiring.`
        }),
      });

      const data = await response.json();
      setAiStory(data.response || getDefaultStory());
    } catch (error) {
      console.error('AI story error:', error);
      setAiStory(getDefaultStory());
    }
    setLoadingStory(false);
  };

  const getDefaultStory = () => {
    const stories = [
      `Imagine if you had invested Rs 10,000 in ${stockName} when it was trading lower. With patience and discipline, your investment could have grown significantly. The best time to start investing is now!`,
      `${stockName} has been part of India's growth story. Early investors who believed in the company have seen their wealth multiply. It's never too late to start your investment journey!`,
      `Small, consistent investments in quality companies like ${stockName} can lead to significant wealth over time. The power of compounding works best for patient investors.`,
    ];
    return stories[Math.floor(Math.random() * stories.length)];
  };

  return (
    <div className="space-y-4">
      {/* AI-Generated Investment Story - Only loads on button click */}
      <Card className="p-4 border-2" style={{ borderColor: 'var(--accent-blue-bg)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              AI Investment Story
            </span>
          </div>
          {aiStory && (
            <button
              onClick={generateStory}
              disabled={loadingStory}
              className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
              title="Generate new story"
            >
              <RefreshCw
                size={14}
                className={loadingStory ? 'animate-spin' : ''}
                style={{ color: 'var(--text-muted)' }}
              />
            </button>
          )}
        </div>

        {loadingStory ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Creating your personalized story...
            </span>
          </div>
        ) : aiStory ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {aiStory}
          </p>
        ) : (
          <button
            onClick={generateStory}
            className="w-full py-3 text-sm rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            Tap to generate an AI investment story
          </button>
        )}
      </Card>

      {/* Investment Wisdom - From API */}
      <InvestmentQuote />
    </div>
  );
}

// Compact version for dashboard - no AI calls, just static stories
export function WhatIfMini() {
  const stories = [
    'Rs 10,000 invested in Infosys IPO (1993) would be worth over Rs 7 Crore today!',
    'Early Reliance investors have seen 500x+ returns over decades.',
    'Rs 1 Lakh in TCS IPO (2004) would be worth Rs 35+ Lakh today.',
    'HDFC Bank has created immense wealth for patient investors since 1995.',
    'Consistent SIP of Rs 5,000/month for 20 years can grow to Rs 50+ Lakh.',
  ];

  const [storyIndex, setStoryIndex] = useState(() => Math.floor(Math.random() * stories.length));

  const nextStory = () => {
    setStoryIndex((prev) => (prev + 1) % stories.length);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--accent-blue)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Investment Story
          </h3>
        </div>
        <button
          onClick={nextStory}
          className="p-1 rounded-full hover:bg-[var(--bg-secondary)]"
        >
          <RefreshCw size={12} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {stories[storyIndex]}
      </p>
    </Card>
  );
}
