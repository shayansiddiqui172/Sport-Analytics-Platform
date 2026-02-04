/**
 * NBA team logo mapping — maps Ball Don't Lie API team data to CDN logo URLs.
 * Primary: NBA.com official CDN (SVG), Fallback: ESPN CDN (PNG).
 */

interface TeamLogoInfo {
  nbaId: number;
  espnAbbrev: string;
}

/**
 * Maps team abbreviation → NBA.com team ID + ESPN abbreviation.
 * NBA.com uses numeric team IDs for their CDN logos.
 */
const LOGO_MAP: Record<string, TeamLogoInfo> = {
  ATL: { nbaId: 1610612737, espnAbbrev: "atl" },
  BOS: { nbaId: 1610612738, espnAbbrev: "bos" },
  BKN: { nbaId: 1610612751, espnAbbrev: "bkn" },
  CHA: { nbaId: 1610612766, espnAbbrev: "cha" },
  CHI: { nbaId: 1610612741, espnAbbrev: "chi" },
  CLE: { nbaId: 1610612739, espnAbbrev: "cle" },
  DAL: { nbaId: 1610612742, espnAbbrev: "dal" },
  DEN: { nbaId: 1610612743, espnAbbrev: "den" },
  DET: { nbaId: 1610612765, espnAbbrev: "det" },
  GSW: { nbaId: 1610612744, espnAbbrev: "gs" },
  HOU: { nbaId: 1610612745, espnAbbrev: "hou" },
  IND: { nbaId: 1610612754, espnAbbrev: "ind" },
  LAC: { nbaId: 1610612746, espnAbbrev: "lac" },
  LAL: { nbaId: 1610612747, espnAbbrev: "lal" },
  MEM: { nbaId: 1610612763, espnAbbrev: "mem" },
  MIA: { nbaId: 1610612748, espnAbbrev: "mia" },
  MIL: { nbaId: 1610612749, espnAbbrev: "mil" },
  MIN: { nbaId: 1610612750, espnAbbrev: "min" },
  NOP: { nbaId: 1610612740, espnAbbrev: "no" },
  NYK: { nbaId: 1610612752, espnAbbrev: "ny" },
  OKC: { nbaId: 1610612760, espnAbbrev: "okc" },
  ORL: { nbaId: 1610612753, espnAbbrev: "orl" },
  PHI: { nbaId: 1610612755, espnAbbrev: "phi" },
  PHX: { nbaId: 1610612756, espnAbbrev: "phx" },
  POR: { nbaId: 1610612757, espnAbbrev: "por" },
  SAC: { nbaId: 1610612758, espnAbbrev: "sac" },
  SAS: { nbaId: 1610612759, espnAbbrev: "sa" },
  TOR: { nbaId: 1610612761, espnAbbrev: "tor" },
  UTA: { nbaId: 1610612762, espnAbbrev: "utah" },
  WAS: { nbaId: 1610612764, espnAbbrev: "wsh" },
};

/** Get the NBA.com CDN logo URL (SVG) for a team. */
export function getNBALogoUrl(abbreviation: string): string | null {
  const info = LOGO_MAP[abbreviation.toUpperCase()];
  if (!info) return null;
  return `https://cdn.nba.com/logos/nba/${info.nbaId}/global/L/logo.svg`;
}

/** Get the ESPN CDN logo URL (PNG) as fallback. */
export function getESPNLogoUrl(abbreviation: string): string | null {
  const info = LOGO_MAP[abbreviation.toUpperCase()];
  if (!info) return null;
  return `https://a.espncdn.com/i/teamlogos/nba/500/${info.espnAbbrev}.png`;
}

/** Check if we have logo data for a given abbreviation. */
export function hasLogoData(abbreviation: string): boolean {
  return abbreviation.toUpperCase() in LOGO_MAP;
}

/** Get the NBA.com team ID for a given abbreviation. */
export function getNBATeamId(abbreviation: string): number | null {
  const info = LOGO_MAP[abbreviation.toUpperCase()];
  return info ? info.nbaId : null;
}
