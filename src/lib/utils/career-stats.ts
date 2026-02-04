import type { PlayerStats } from "@/types";

/**
 * Computes career totals and weighted averages from an array of season stats.
 *
 * For cumulative stats (games_played), we sum them.
 * For per-game stats (pts, reb, ast, etc.), we calculate weighted averages by games_played.
 * For shooting percentages, we recompute from total makes/attempts to avoid averaging percentages.
 */
export function computeCareerTotals(seasons: PlayerStats[]): {
  games_played: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  pf: number;
} {
  if (seasons.length === 0) {
    return {
      games_played: 0,
      min: "0.0",
      pts: 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      turnover: 0,
      fg_pct: 0,
      fg3_pct: 0,
      ft_pct: 0,
      fgm: 0,
      fga: 0,
      fg3m: 0,
      fg3a: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
      pf: 0,
    };
  }

  // Sum games played
  const totalGames = seasons.reduce((sum, s) => sum + s.games_played, 0);

  // For per-game stats, compute weighted average: sum(stat * games) / totalGames
  const weightedAvg = (statGetter: (s: PlayerStats) => number) => {
    const weightedSum = seasons.reduce(
      (sum, s) => sum + statGetter(s) * s.games_played,
      0
    );
    return totalGames > 0 ? weightedSum / totalGames : 0;
  };

  // Parse minutes (handle both "32:15" and "32.5" formats)
  const parseMinutes = (min: string): number => {
    if (min.includes(":")) {
      const [mins, secs] = min.split(":").map(Number);
      return mins + (secs || 0) / 60;
    }
    return parseFloat(min) || 0;
  };

  // Weighted average minutes
  const totalMinutesWeighted = seasons.reduce(
    (sum, s) => sum + parseMinutes(s.min) * s.games_played,
    0
  );
  const avgMinutes = totalGames > 0 ? totalMinutesWeighted / totalGames : 0;

  // Sum makes and attempts for shooting stats
  const totalFgm = seasons.reduce((sum, s) => sum + s.fgm * s.games_played, 0);
  const totalFga = seasons.reduce((sum, s) => sum + s.fga * s.games_played, 0);
  const totalFg3m = seasons.reduce((sum, s) => sum + s.fg3m * s.games_played, 0);
  const totalFg3a = seasons.reduce((sum, s) => sum + s.fg3a * s.games_played, 0);
  const totalFtm = seasons.reduce((sum, s) => sum + s.ftm * s.games_played, 0);
  const totalFta = seasons.reduce((sum, s) => sum + s.fta * s.games_played, 0);

  // Recompute shooting percentages from totals
  const fg_pct = totalFga > 0 ? totalFgm / totalFga : 0;
  const fg3_pct = totalFg3a > 0 ? totalFg3m / totalFg3a : 0;
  const ft_pct = totalFta > 0 ? totalFtm / totalFta : 0;

  // Compute per-game averages from career totals
  const fgmPerGame = totalGames > 0 ? totalFgm / totalGames : 0;
  const fgaPerGame = totalGames > 0 ? totalFga / totalGames : 0;
  const fg3mPerGame = totalGames > 0 ? totalFg3m / totalGames : 0;
  const fg3aPerGame = totalGames > 0 ? totalFg3a / totalGames : 0;
  const ftmPerGame = totalGames > 0 ? totalFtm / totalGames : 0;
  const ftaPerGame = totalGames > 0 ? totalFta / totalGames : 0;

  return {
    games_played: totalGames,
    min: avgMinutes.toFixed(1),
    pts: weightedAvg((s) => s.pts),
    reb: weightedAvg((s) => s.reb),
    ast: weightedAvg((s) => s.ast),
    stl: weightedAvg((s) => s.stl),
    blk: weightedAvg((s) => s.blk),
    turnover: weightedAvg((s) => s.turnover),
    fg_pct,
    fg3_pct,
    ft_pct,
    fgm: fgmPerGame,
    fga: fgaPerGame,
    fg3m: fg3mPerGame,
    fg3a: fg3aPerGame,
    ftm: ftmPerGame,
    fta: ftaPerGame,
    oreb: weightedAvg((s) => s.oreb),
    dreb: weightedAvg((s) => s.dreb),
    pf: weightedAvg((s) => s.pf),
  };
}
