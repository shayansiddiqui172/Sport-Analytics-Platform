/**
 * NBA team colors — primary + secondary for each team.
 * When two teams have similar primary colors, the secondary is used as fallback.
 */

interface TeamInfo {
  primary: string;
  secondary: string;
  abbreviation: string;
}

const TEAMS: Record<string, TeamInfo> = {
  "Atlanta Hawks":          { primary: "#E03A3E", secondary: "#C1D32F", abbreviation: "ATL" },
  "Boston Celtics":         { primary: "#007A33", secondary: "#BA9653", abbreviation: "BOS" },
  "Brooklyn Nets":          { primary: "#000000", secondary: "#FFFFFF", abbreviation: "BKN" },
  "Charlotte Hornets":      { primary: "#1D1160", secondary: "#00788C", abbreviation: "CHA" },
  "Chicago Bulls":          { primary: "#CE1141", secondary: "#000000", abbreviation: "CHI" },
  "Cleveland Cavaliers":    { primary: "#860038", secondary: "#FDBB30", abbreviation: "CLE" },
  "Dallas Mavericks":       { primary: "#00538C", secondary: "#B8C4CA", abbreviation: "DAL" },
  "Denver Nuggets":         { primary: "#0E2240", secondary: "#FEC524", abbreviation: "DEN" },
  "Detroit Pistons":        { primary: "#C8102E", secondary: "#1D42BA", abbreviation: "DET" },
  "Golden State Warriors":  { primary: "#1D428A", secondary: "#FFC72C", abbreviation: "GSW" },
  "Houston Rockets":        { primary: "#CE1141", secondary: "#C4CED4", abbreviation: "HOU" },
  "Indiana Pacers":         { primary: "#002D62", secondary: "#FDBB30", abbreviation: "IND" },
  "Los Angeles Clippers":   { primary: "#C8102E", secondary: "#1D428A", abbreviation: "LAC" },
  "Los Angeles Lakers":     { primary: "#552583", secondary: "#FDB927", abbreviation: "LAL" },
  "Memphis Grizzlies":      { primary: "#5D76A9", secondary: "#12173F", abbreviation: "MEM" },
  "Miami Heat":             { primary: "#98002E", secondary: "#F9A01B", abbreviation: "MIA" },
  "Milwaukee Bucks":        { primary: "#00471B", secondary: "#EEE1C6", abbreviation: "MIL" },
  "Minnesota Timberwolves": { primary: "#0C2340", secondary: "#236192", abbreviation: "MIN" },
  "New Orleans Pelicans":   { primary: "#0C2340", secondary: "#C8102E", abbreviation: "NOP" },
  "New York Knicks":        { primary: "#006BB6", secondary: "#F58426", abbreviation: "NYK" },
  "Oklahoma City Thunder":  { primary: "#007AC1", secondary: "#EF6100", abbreviation: "OKC" },
  "Orlando Magic":          { primary: "#0077C0", secondary: "#C4CED4", abbreviation: "ORL" },
  "Philadelphia 76ers":     { primary: "#006BB6", secondary: "#ED174C", abbreviation: "PHI" },
  "Phoenix Suns":           { primary: "#1D1160", secondary: "#E56020", abbreviation: "PHX" },
  "Portland Trail Blazers": { primary: "#E03A3E", secondary: "#000000", abbreviation: "POR" },
  "Sacramento Kings":       { primary: "#5A2D81", secondary: "#63727A", abbreviation: "SAC" },
  "San Antonio Spurs":      { primary: "#C4CED4", secondary: "#000000", abbreviation: "SAS" },
  "Toronto Raptors":        { primary: "#CE1141", secondary: "#000000", abbreviation: "TOR" },
  "Utah Jazz":              { primary: "#002B5C", secondary: "#F9A01B", abbreviation: "UTA" },
  "Washington Wizards":     { primary: "#002B5C", secondary: "#E31837", abbreviation: "WAS" },
  "LA Clippers":            { primary: "#C8102E", secondary: "#1D428A", abbreviation: "LAC" },
};

// Build reverse lookup by abbreviation
const ABBREV_MAP: Record<string, TeamInfo> = {};
for (const [, info] of Object.entries(TEAMS)) {
  ABBREV_MAP[info.abbreviation] = info;
}

function lookup(nameOrAbbrev: string): TeamInfo | undefined {
  return TEAMS[nameOrAbbrev] ?? ABBREV_MAP[nameOrAbbrev];
}

/** Parse hex color to RGB. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** Euclidean distance between two RGB colors (0–441 range). */
function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

const MIN_DISTANCE = 120; // threshold — below this the colors look too similar

/** Get team color by full name or abbreviation. */
export function getTeamColor(nameOrAbbrev: string): string {
  return lookup(nameOrAbbrev)?.primary ?? "#6366f1";
}

/**
 * Get a pair of colors for two teams that are guaranteed to be visually distinct.
 * If both primaries are too similar, one team gets its secondary color.
 */
export function getTeamPairColors(
  team1: string,
  team2: string
): [string, string] {
  const t1 = lookup(team1);
  const t2 = lookup(team2);
  const c1 = t1?.primary ?? "#6366f1";
  const c2 = t2?.primary ?? "#a855f7";

  if (colorDistance(c1, c2) >= MIN_DISTANCE) {
    return [c1, c2];
  }

  // Try swapping team2 to secondary
  if (t2 && colorDistance(c1, t2.secondary) >= MIN_DISTANCE) {
    return [c1, t2.secondary];
  }

  // Try swapping team1 to secondary
  if (t1 && colorDistance(t1.secondary, c2) >= MIN_DISTANCE) {
    return [t1.secondary, c2];
  }

  // Fallback: both secondaries
  if (t1 && t2 && colorDistance(t1.secondary, t2.secondary) >= MIN_DISTANCE) {
    return [t1.secondary, t2.secondary];
  }

  // Last resort: use primary + a contrasting fallback
  return [c1, "#a855f7"];
}

/** Get team abbreviation from full name. */
export function getTeamAbbreviation(fullName: string): string {
  return TEAMS[fullName]?.abbreviation ?? fullName.slice(0, 3).toUpperCase();
}
