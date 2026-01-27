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
