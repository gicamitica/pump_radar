/**
 * Formatting utilities for dashboard widgets
 */

/**
 * Format currency values with compact notation
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  compact: boolean = false
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercent(
  value: number,
  decimals: number = 1,
  includeSign: boolean = false
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);

  if (includeSign && value > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Format numbers with compact notation (K, M, B)
 */
export function formatCompact(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format numbers with thousand separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format delta values with sign and color semantics
 */
export function formatDelta(
  value: number,
  format: 'percent' | 'currency' | 'number' = 'percent',
  currency?: string
): { formatted: string; trend: 'up' | 'down' | 'flat' } {
  let formatted: string;
  
  if (format === 'percent') {
    formatted = formatPercent(value, 1, true);
  } else if (format === 'currency') {
    formatted = formatCurrency(value, currency, true);
    if (value > 0) formatted = `+${formatted}`;
  } else {
    formatted = formatCompact(value);
    if (value > 0) formatted = `+${formatted}`;
  }

  const trend = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';

  return { formatted, trend };
}

/**
 * Format ratio values (e.g., LTV:CAC)
 */
export function formatRatio(numerator: number, denominator: number): string {
  if (denominator === 0) return 'N/A';
  const ratio = numerator / denominator;
  return `${ratio.toFixed(1)}:1`;
}

/**
 * Formats a monetary amount in cents to a human-readable currency string.
 * @param amountInCents The amount in cents (e.g., 100 for $1.00)
 * @param currency The ISO 4217 currency code (e.g., 'USD')
 * @returns A localized currency string
 */
export const formatCentsCurrency = (amountInCents: number, currency?: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amountInCents / 100);
  } catch (error) {
    console.warn('formatCurrency: Invalid or missing currency code, falling back to simple format', currency);
    return new Intl.NumberFormat(undefined, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInCents / 100);
  }
};

/**
 * Formats a weight in grams to a human-readable string (g or kg).
 * @param grams Weight in grams
 * @returns Formatted weight string
 */
export const formatWeight = (grams: number) => {
  return grams >= 1000 
    ? `${(grams / 1000).toFixed(1)} kg` 
    : `${grams} g`;
};

export const cleanString = (title: string) =>
  title?.replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '-');
