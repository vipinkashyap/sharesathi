/**
 * Format number in Indian numbering system (12,34,567)
 */
export function formatIndianNumber(num: number): string {
  const numStr = Math.abs(num).toFixed(2);
  const [whole, decimal] = numStr.split('.');

  // Handle numbers less than 1000
  if (whole.length <= 3) {
    return (num < 0 ? '-' : '') + whole + (decimal ? '.' + decimal : '');
  }

  // Last 3 digits
  let result = whole.slice(-3);
  let remaining = whole.slice(0, -3);

  // Add pairs of digits with commas
  while (remaining.length > 0) {
    const chunk = remaining.slice(-2);
    remaining = remaining.slice(0, -2);
    result = chunk + ',' + result;
  }

  return (num < 0 ? '-' : '') + result + (decimal ? '.' + decimal : '');
}

/**
 * Format price with rupee symbol
 */
export function formatPrice(price: number): string {
  return '₹' + formatIndianNumber(price);
}

/**
 * Format market cap in crores with appropriate suffix
 */
export function formatMarketCap(crores: number): string {
  if (crores >= 100000) {
    return `₹${(crores / 100000).toFixed(2)}L Cr`;
  } else if (crores >= 1000) {
    return `₹${(crores / 1000).toFixed(2)}K Cr`;
  }
  return `₹${formatIndianNumber(crores)} Cr`;
}

/**
 * Format price change with sign and percentage
 */
export function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}₹${Math.abs(change).toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

/**
 * Format percentage with sign
 */
export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Format volume in lakhs/crores
 */
export function formatVolume(volume: number): string {
  if (volume >= 10000000) {
    return `${(volume / 10000000).toFixed(2)} Cr`;
  } else if (volume >= 100000) {
    return `${(volume / 100000).toFixed(2)} L`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)} K`;
  }
  return volume.toString();
}
