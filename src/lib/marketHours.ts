export type MarketStatus = 'open' | 'closed' | 'pre-open' | 'post-close';

/**
 * Get detailed market status
 */
export function getMarketStatus(): MarketStatus {
  const now = new Date();

  // Get IST time
  const istOffset = 5.5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + istOffset) % 1440;

  // Get day in IST
  let istDay = now.getUTCDay();
  if (utcMinutes + istOffset >= 1440) {
    istDay = (istDay + 1) % 7;
  }

  // Weekend
  if (istDay === 0 || istDay === 6) return 'closed';

  const preOpen = 9 * 60; // 9:00 AM
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  if (istMinutes >= preOpen && istMinutes < marketOpen) {
    return 'pre-open';
  } else if (istMinutes >= marketOpen && istMinutes <= marketClose) {
    return 'open';
  } else if (istMinutes > marketClose && istMinutes < 24 * 60) {
    return 'post-close';
  }

  return 'closed';
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get market status display text
 */
export function getMarketStatusText(): string {
  const status = getMarketStatus();
  switch (status) {
    case 'open':
      return 'Market Open';
    case 'pre-open':
      return 'Pre-Open Session';
    case 'post-close':
      return 'Market Closed';
    case 'closed':
      return 'Market Closed';
  }
}
