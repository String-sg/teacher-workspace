import type { PGAnnouncement } from '~/data/mock-pg-announcements';

/**
 * Get the day period based on the current hour.
 *
 * @returns The day period.
 */
export function getDayPeriod(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export const DATE_FORMATTER = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Singapore',
});

export function formatDate(iso: string | undefined): string {
  if (!iso) return '\u2014';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '\u2014';
  return DATE_FORMATTER.format(date);
}

/**
 * Format an ISO string as `DD MMM YYYY, hh:mm am/pm` (or upper-cased).
 * Returns `undefined` when the input is missing or unparseable so callers
 * can fall back to `formatDate` (date-only) without a sentinel dash.
 */
export function formatDateTime(
  iso: string | undefined,
  opts: { case?: 'upper' | 'lower' } = {},
): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;

  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  let hour = d.getHours();
  const minute = d.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  const hourStr = hour.toString().padStart(2, '0');

  const result = `${day} ${month} ${year}, ${hourStr}:${minute} ${ampm}`;
  return opts.case === 'upper' ? result.toUpperCase() : result;
}

export function isLowReadRate(
  postedAt: string | undefined,
  readCount: number,
  total: number,
): boolean {
  if (!postedAt || total === 0) return false;
  const hoursElapsed = (Date.now() - new Date(postedAt).getTime()) / 3_600_000;
  return hoursElapsed >= 48 && readCount / total < 0.5;
}

export function getRelevantDate(announcement: PGAnnouncement): string | undefined {
  if (announcement.status === 'posted') return announcement.postedAt;
  if (announcement.status === 'scheduled') return announcement.scheduledAt;
  return announcement.createdAt;
}
