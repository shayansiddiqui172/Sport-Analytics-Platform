/**
 * NBA player headshot mapping — maps Ball Don't Lie API player data to NBA.com headshot CDN.
 * Primary: NBA.com official CDN (high-res PNG), Fallback: smaller size variant.
 *
 * Architecture mirrors team-logos.ts for consistency.
 */

/**
 * Get the NBA.com CDN headshot URL (high-res 1040x760 PNG) for a player.
 * Uses the NBA's official player ID system.
 *
 * @param nbaPlayerId - The NBA.com player ID (PLAYER_ID from stats.nba.com)
 * @returns Headshot URL or null if no ID provided
 */
export function getNBAHeadshotUrl(nbaPlayerId: number | null): string | null {
  if (!nbaPlayerId || nbaPlayerId <= 0) return null;
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaPlayerId}.png`;
}

/**
 * Get the smaller NBA.com CDN headshot URL (260x190 PNG) as fallback.
 * Useful for faster loading or when high-res fails.
 *
 * @param nbaPlayerId - The NBA.com player ID
 * @returns Smaller headshot URL or null if no ID provided
 */
export function getNBAHeadshotUrlSmall(nbaPlayerId: number | null): string | null {
  if (!nbaPlayerId || nbaPlayerId <= 0) return null;
  return `https://cdn.nba.com/headshots/nba/latest/260x190/${nbaPlayerId}.png`;
}

/**
 * Check if we have a valid NBA player ID for headshot lookup.
 *
 * @param nbaPlayerId - The NBA.com player ID to validate
 * @returns True if the ID is valid for headshot fetching
 */
export function hasHeadshotData(nbaPlayerId: number | null | undefined): boolean {
  return typeof nbaPlayerId === 'number' && nbaPlayerId > 0;
}
