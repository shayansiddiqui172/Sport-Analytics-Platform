/**
 * Calculate the current NBA season year.
 *
 * The NBA season spans two calendar years (e.g., the 2025-2026 season starts in October 2025).
 * The Ball Don't Lie API uses the season START year, so for a season that begins in
 * October 2025, the API expects season: 2025.
 *
 * Logic: If current month < October (month 9), we're still in last year's season.
 * Otherwise, we're in the current year's season.
 *
 * @returns The NBA season year (the year the season started)
 */
export function getNBASeason(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed: 0 = Jan, 9 = Oct

  // If we're in Jan-Sep (months 0-8), the season started last year
  // If we're in Oct-Dec (months 9-11), the season started this year
  return currentMonth < 9 ? currentYear - 1 : currentYear;
}

/**
 * Convert a season year to NBA.com's season format.
 *
 * NBA.com uses "YYYY-YY" format (e.g., "2024-25" for the 2024-2025 season)
 *
 * @param seasonYear The season start year (e.g., 2024)
 * @returns The NBA.com season string (e.g., "2024-25")
 */
export function getNBASeasonString(seasonYear?: number): string {
  const year = seasonYear || getNBASeason();
  const nextYear = (year + 1).toString().slice(-2);
  return `${year}-${nextYear}`;
}
