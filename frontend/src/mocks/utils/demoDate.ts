/**
 * Demo Date Utilities
 * 
 * Provides functions to generate dates relative to "now" for demo/mock data.
 * This ensures that demo data always appears current regardless of when the app is run.
 * 
 * All functions return ISO 8601 date strings in UTC.
 */

/**
 * Base date for all demo date calculations.
 * Can be overridden for testing purposes.
 */
let baseDate: Date | null = null;

/**
 * Set a custom base date for testing purposes.
 * Pass null to reset to using the current date.
 */
export function setDemoBaseDate(date: Date | null): void {
  baseDate = date;
}

/**
 * Get the current base date (either the custom one or now).
 */
function getBaseDate(): Date {
  return baseDate ?? new Date();
}

/**
 * Get the start of today (midnight) in UTC.
 */
function getStartOfToday(): Date {
  const now = getBaseDate();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// ============================================================================
// Core Date Generation Functions
// ============================================================================

export interface DemoDateOptions {
  /** Number of days from today (negative for past, positive for future) */
  daysFromToday?: number;
  /** Hour of day (0-23) */
  hours?: number;
  /** Minutes (0-59) */
  minutes?: number;
  /** Seconds (0-59) */
  seconds?: number;
}

/**
 * Create a demo date relative to today.
 * 
 * @example
 * // Today at 9:30 AM
 * createDemoDate({ hours: 9, minutes: 30 })
 * 
 * // 3 days ago at 2:00 PM
 * createDemoDate({ daysFromToday: -3, hours: 14 })
 * 
 * // 5 days from now at 10:00 AM
 * createDemoDate({ daysFromToday: 5, hours: 10 })
 */
export function createDemoDate(options: DemoDateOptions = {}): string {
  const {
    daysFromToday = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
  } = options;

  const startOfToday = getStartOfToday();
  const date = new Date(startOfToday);
  
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  date.setUTCHours(hours, minutes, seconds, 0);
  
  return date.toISOString();
}

/**
 * Get a demo date as an ISO string for a specific number of days from today.
 * Time defaults to start of day (midnight UTC).
 * 
 * @param daysFromToday - Negative for past, positive for future
 */
export function getDemoDate(daysFromToday: number): string {
  return createDemoDate({ daysFromToday });
}

/**
 * Get a demo datetime with specific time.
 * 
 * @param daysFromToday - Negative for past, positive for future
 * @param hours - Hour of day (0-23)
 * @param minutes - Minutes (0-59)
 */
export function getDemoDateTime(daysFromToday: number, hours: number, minutes: number = 0): string {
  return createDemoDate({ daysFromToday, hours, minutes });
}

// ============================================================================
// Time-based Offset Functions (for recent activity)
// ============================================================================

/**
 * Get a date that is a specific number of minutes ago from now.
 */
export function minutesAgo(minutes: number): string {
  const now = getBaseDate();
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
}

/**
 * Get a date that is a specific number of hours ago from now.
 */
export function hoursAgo(hours: number): string {
  const now = getBaseDate();
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

/**
 * Get a date that is a specific number of days ago from now.
 */
export function daysAgo(days: number): string {
  const now = getBaseDate();
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Get a date that is a specific number of weeks ago from now.
 */
export function weeksAgo(weeks: number): string {
  return daysAgo(weeks * 7);
}

/**
 * Get a date that is a specific number of months ago from now.
 * Note: Uses approximate 30-day months.
 */
export function monthsAgo(months: number): string {
  return daysAgo(months * 30);
}

// ============================================================================
// Date Range Functions
// ============================================================================

export interface DateRangeOptions {
  /** Start offset in days from today */
  startOffsetDays: number;
  /** End offset in days from today */
  endOffsetDays: number;
  /** Start time (optional) */
  startTime?: { hours: number; minutes?: number };
  /** End time (optional) */
  endTime?: { hours: number; minutes?: number };
}

/**
 * Get a date range (start and end dates) relative to today.
 * Useful for calendar events.
 * 
 * @example
 * // Event from tomorrow 9:00 AM to 11:00 AM
 * getDemoDateRange({
 *   startOffsetDays: 1,
 *   endOffsetDays: 1,
 *   startTime: { hours: 9 },
 *   endTime: { hours: 11 }
 * })
 */
export function getDemoDateRange(options: DateRangeOptions): { startDate: string; endDate: string } {
  const { startOffsetDays, endOffsetDays, startTime, endTime } = options;

  const startDate = createDemoDate({
    daysFromToday: startOffsetDays,
    hours: startTime?.hours ?? 0,
    minutes: startTime?.minutes ?? 0,
  });

  const endDate = createDemoDate({
    daysFromToday: endOffsetDays,
    hours: endTime?.hours ?? 23,
    minutes: endTime?.minutes ?? 59,
  });

  return { startDate, endDate };
}

// ============================================================================
// Sequence Generation (for chat messages, activity logs, etc.)
// ============================================================================

export interface MessageSequenceOptions {
  /** Base timestamp to start from (days from today, can be fractional) */
  baseDaysAgo: number;
  /** Number of messages to generate timestamps for */
  count: number;
  /** Average interval between messages in minutes */
  avgIntervalMinutes?: number;
  /** Variance in interval (0-1, where 0.5 means ±50% of avg interval) */
  intervalVariance?: number;
}

/**
 * Generate a sequence of timestamps for messages in a conversation.
 * Returns timestamps in chronological order (oldest first).
 * 
 * @example
 * // Generate 5 message timestamps starting from 2 hours ago
 * generateMessageTimestamps({
 *   baseDaysAgo: 0.083, // ~2 hours
 *   count: 5,
 *   avgIntervalMinutes: 5
 * })
 */
export function generateMessageTimestamps(options: MessageSequenceOptions): string[] {
  const {
    baseDaysAgo,
    count,
    avgIntervalMinutes = 5,
    intervalVariance = 0.5,
  } = options;

  const now = getBaseDate();
  const baseTime = now.getTime() - baseDaysAgo * 24 * 60 * 60 * 1000;
  
  const timestamps: string[] = [];
  let currentTime = baseTime;

  for (let i = 0; i < count; i++) {
    timestamps.push(new Date(currentTime).toISOString());
    
    // Add interval with variance for next message
    const variance = 1 + (Math.random() - 0.5) * 2 * intervalVariance;
    const interval = avgIntervalMinutes * variance * 60 * 1000;
    currentTime += interval;
  }

  return timestamps;
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format a relative date as a human-readable string.
 * Useful for display in notifications, activity feeds, etc.
 * 
 * @param daysAgo - Number of days ago
 * @returns Formatted string like "Today", "Yesterday", "3 days ago", etc.
 */
export function formatRelativeDay(daysAgo: number): string {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return 'Last week';
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo < 60) return 'Last month';
  return `${Math.floor(daysAgo / 30)} months ago`;
}

/**
 * Get a formatted date string for display (e.g., "Dec 5, 2024").
 * 
 * @param daysFromToday - Negative for past, positive for future
 */
export function getFormattedDemoDate(daysFromToday: number): string {
  const date = new Date(getDemoDate(daysFromToday));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a random number of days within a range.
 * Useful for generating varied demo data.
 */
export function randomDaysInRange(minDays: number, maxDays: number): number {
  return Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
}

/**
 * Get a random hour within a range.
 */
export function randomHourInRange(minHour: number = 8, maxHour: number = 18): number {
  return Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
}
