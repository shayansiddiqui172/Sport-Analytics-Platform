import { NextRequest, NextResponse } from "next/server";

/**
 * NBA Stats API Proxy Route
 *
 * Proxies requests to stats.nba.com with required headers.
 * stats.nba.com blocks browser requests, so we handle this server-side.
 *
 * Endpoint types:
 * - leagueleaders: All qualified players (~230) with IDs + per-game stats (fast, primary data source)
 * - gamelog: Individual player game log (may be slow/rate-limited)
 */

const NBA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://stats.nba.com/',
  'Accept': 'application/json, text/plain, */*',
  'x-nba-stats-token': 'true',
  'x-nba-stats-origin': 'stats',
  'Origin': 'https://stats.nba.com',
};

const FETCH_TIMEOUT_MS = 12000;
const DASH_TIMEOUT_MS = 12000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Missing 'type' query parameter" },
        { status: 400 }
      );
    }

    let endpoint = "";
    let params = new URLSearchParams();

    switch (type) {
      case "leagueleaders": {
        const season = searchParams.get("season") || "2024-25";
        endpoint = "https://stats.nba.com/stats/leagueleaders";
        params.set("LeagueID", "00");
        params.set("PerMode", "PerGame");
        params.set("Scope", "S");
        params.set("Season", season);
        params.set("SeasonType", "Regular Season");
        params.set("StatCategory", "PTS");
        break;
      }

      case "teamplayerstats": {
        const teamId = searchParams.get("teamId");
        const season = searchParams.get("season") || "2024-25";

        if (!teamId) {
          return NextResponse.json(
            { error: "Missing 'teamId' parameter" },
            { status: 400 }
          );
        }

        endpoint = "https://stats.nba.com/stats/leaguedashplayerstats";
        params.set("MeasureType", "Base");
        params.set("PerMode", "PerGame");
        params.set("Season", season);
        params.set("SeasonType", "Regular Season");
        params.set("TeamID", teamId);
        params.set("LeagueID", "00");
        params.set("PlusMinus", "N");
        params.set("PaceAdjust", "N");
        params.set("Rank", "N");
        params.set("Outcome", "");
        params.set("Location", "");
        params.set("Month", "0");
        params.set("SeasonSegment", "");
        params.set("DateFrom", "");
        params.set("DateTo", "");
        params.set("OpponentTeamID", "0");
        params.set("VsConference", "");
        params.set("VsDivision", "");
        params.set("GameSegment", "");
        params.set("Period", "0");
        params.set("ShotClockRange", "");
        params.set("LastNGames", "0");
        break;
      }

      case "gamelog": {
        const playerId = searchParams.get("playerId");
        const season = searchParams.get("season") || "2024-25";

        if (!playerId) {
          return NextResponse.json(
            { error: "Missing 'playerId' parameter" },
            { status: 400 }
          );
        }

        endpoint = "https://stats.nba.com/stats/playergamelog";
        params.set("PlayerID", playerId);
        params.set("Season", season);
        params.set("SeasonType", "Regular Season");
        params.set("LeagueID", "00");
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }

    const url = `${endpoint}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = type === "teamplayerstats" ? DASH_TIMEOUT_MS : FETCH_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        headers: NBA_HEADERS,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`NBA Stats API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: "Failed to fetch from NBA Stats API", status: response.status },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        console.error(`NBA Stats API timeout for type=${type}`);
        return NextResponse.json(
          { error: "Request to NBA Stats API timed out" },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("NBA Stats API proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
