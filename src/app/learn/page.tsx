'use client';

import { useState } from 'react';
import { BookOpen, Search, Loader2, ExternalLink, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ArticleData {
  title: string;
  slug: string;
  content: string;
  wordCount: number;
  referencesCount: number;
  references: { number: number; url: string }[];
}

// Common finance/stock market terms for quick access
const suggestedTerms = [
  { term: 'Stock_market', label: 'Stock Market' },
  { term: 'Market_capitalization', label: 'Market Cap' },
  { term: 'Price%E2%80%93earnings_ratio', label: 'P/E Ratio' },
  { term: 'Dividend', label: 'Dividend' },
  { term: 'Bull_market', label: 'Bull Market' },
  { term: 'Bear_market', label: 'Bear Market' },
  { term: 'Initial_public_offering', label: 'IPO' },
  { term: 'Mutual_fund', label: 'Mutual Funds' },
  { term: 'Exchange-traded_fund', label: 'ETFs' },
  { term: 'Bombay_Stock_Exchange', label: 'BSE' },
  { term: 'National_Stock_Exchange_of_India', label: 'NSE' },
  { term: 'SENSEX', label: 'SENSEX' },
];

export default function LearnPage() {
  const [query, setQuery] = useState('');
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTerm = async (term: string) => {
    setLoading(true);
    setError(null);
    setArticle(null);

    try {
      const response = await fetch(`/api/learn/${encodeURIComponent(term)}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Article not found. Try a different term.');
        } else {
          setError('Failed to fetch article. Please try again.');
        }
        return;
      }

      const data = await response.json();
      setArticle(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Convert query to slug format (replace spaces with underscores)
    const slug = query.trim().replace(/\s+/g, '_');
    searchTerm(slug);
  };

  const handleSuggestedClick = (term: string) => {
    searchTerm(term);
  };

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
          <BookOpen size={24} style={{ color: 'var(--accent-blue)' }} />
          Learn
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Understand financial terms and concepts
        </p>
      </header>

      {/* Content */}
      <div className="px-4 py-4 space-y-6">
        {/* Search Box */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a term..."
              className="w-full pl-12 pr-4 py-3 rounded-xl text-base"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
        </form>

        {/* Suggested Terms */}
        {!article && !loading && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Popular Terms
            </h2>
            <div className="flex flex-wrap gap-2">
              {suggestedTerms.map(({ term, label }) => (
                <button
                  key={term}
                  onClick={() => handleSuggestedClick(term)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="py-12 text-center">
            <Loader2
              size={40}
              className="mx-auto animate-spin"
              style={{ color: 'var(--accent-blue)' }}
            />
            <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
              Fetching article...
            </p>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="py-8 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </Card>
        )}

        {/* Article Display */}
        {article && !loading && (
          <Card>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {article.title}
            </h2>

            <div className="flex gap-4 mb-4">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {article.wordCount.toLocaleString()} words
              </span>
              {article.referencesCount > 0 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {article.referencesCount} references
                </span>
              )}
            </div>

            <div
              className="text-sm leading-relaxed space-y-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              {article.content
                .split(/\n\n+/)
                .filter(p => p.trim())
                .slice(0, 20)
                .map((paragraph, idx) => (
                  <p key={idx} className="whitespace-pre-wrap">
                    {paragraph.trim().replace(/\n/g, ' ')}
                  </p>
                ))}
              {article.content.split(/\n\n+/).length > 20 && (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  Article truncated for readability...
                </p>
              )}
            </div>

            {/* References */}
            {article.references.length > 0 && (
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  References
                </h3>
                <div className="space-y-1">
                  {article.references.map((ref, idx) => (
                    <a
                      key={idx}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs truncate"
                      style={{ color: 'var(--accent-blue)' }}
                    >
                      <ExternalLink size={12} />
                      <span className="truncate">{ref.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Back to suggestions */}
            <button
              onClick={() => {
                setArticle(null);
                setQuery('');
              }}
              className="mt-6 flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--accent-blue)' }}
            >
              <ArrowRight size={16} className="rotate-180" />
              Browse more terms
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
