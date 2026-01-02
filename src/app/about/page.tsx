'use client';

import {
  TrendingUp,
  Star,
  BarChart3,
  BookOpen,
  MessageCircle,
  Smartphone,
  Moon,
  Shield,
  Heart,
  ChevronRight,
  ArrowLeft,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const features = [
  {
    icon: TrendingUp,
    title: 'Real-Time Tracking',
    description: 'Get live stock prices, interactive charts, and key metrics for any BSE-listed company.',
    color: 'var(--accent-green)',
  },
  {
    icon: BarChart3,
    title: 'Market Monitor',
    description: 'View all 6,900+ stocks in one place. Sort by price, change, or market cap. Filter by index.',
    color: 'var(--accent-blue)',
  },
  {
    icon: Star,
    title: 'Multiple Watchlists',
    description: 'Create up to 10 custom watchlists with 50 stocks each. Track portfolio analytics.',
    color: 'var(--accent-yellow)',
  },
  {
    icon: Clock,
    title: 'Time Machine',
    description: 'See what your investment would be worth today if you had invested years ago.',
    color: 'var(--accent-purple)',
  },
  {
    icon: BookOpen,
    title: 'Learn Finance',
    description: 'Built-in glossary explains market terms like P/E ratio, dividends, and more.',
    color: 'var(--accent-green)',
  },
  {
    icon: MessageCircle,
    title: 'AI Assistant',
    description: 'Ask questions about your portfolio and get intelligent insights powered by AI.',
    color: 'var(--accent-blue)',
  },
];

const benefits = [
  {
    icon: Smartphone,
    title: 'Install as App',
    description: 'Add to your home screen for a native app experience',
  },
  {
    icon: Moon,
    title: 'Dark Mode',
    description: 'Easy on your eyes with light and dark themes',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'All your data stays on your device',
  },
];

export default function AboutPage() {
  return (
    <div className="page-enter">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Link href="/" className="touch-target p-2 -ml-2">
          <ArrowLeft size={24} style={{ color: 'var(--text-primary)' }} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          About ShareSathi
        </h1>
      </header>

      {/* Hero Section */}
      <div className="px-4 py-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
             style={{ backgroundColor: 'var(--accent-blue-bg)' }}>
          <TrendingUp size={40} style={{ color: 'var(--accent-blue)' }} />
        </div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          ShareSathi
        </h2>
        <p className="text-lg mb-1" style={{ color: 'var(--accent-blue)' }}>
          Your Stock Companion
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Track BSE stocks with ease
        </p>
      </div>

      {/* What is ShareSathi */}
      <div className="px-4 mb-8">
        <Card>
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            What is ShareSathi?
          </h3>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            ShareSathi is a modern stock tracking app designed specifically for Indian investors.
            Whether you&apos;re a seasoned trader or just starting your investment journey,
            ShareSathi helps you stay on top of your portfolio with real-time data,
            beautiful charts, and intelligent insights.
          </p>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="px-4 mb-8">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Features
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="flex gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon size={24} style={{ color: feature.color }} />
              </div>
              <div>
                <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {feature.title}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* How to Use */}
      <div className="px-4 mb-8">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          How to Get Started
        </h3>
        <Card>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
              >
                1
              </div>
              <div>
                <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Search for Stocks
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Use the Search tab to find any BSE-listed company by name or symbol.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
              >
                2
              </div>
              <div>
                <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Add to Watchlist
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Tap the star icon to add stocks to your watchlist. Create multiple lists for different strategies.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
              >
                3
              </div>
              <div>
                <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Track & Learn
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Monitor your investments, read the news, and use the Learn section to understand market concepts.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Benefits */}
      <div className="px-4 mb-8">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Why ShareSathi?
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="text-center py-4">
              <benefit.icon
                size={28}
                className="mx-auto mb-2"
                style={{ color: 'var(--accent-blue)' }}
              />
              <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {benefit.title}
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mb-8">
        <Link
          href="/"
          className="flex items-center justify-between w-full px-6 py-4 rounded-xl"
          style={{ backgroundColor: 'var(--accent-blue)' }}
        >
          <span className="text-white font-semibold">Start Tracking Your Stocks</span>
          <ChevronRight size={24} className="text-white" />
        </Link>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 text-center">
        <p className="text-sm flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
          Made with <Heart size={14} className="text-red-500 fill-red-500" /> for family
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}
