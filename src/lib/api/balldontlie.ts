import type { Game, Player, PlayerStats, GamePlayerStats, Team, PaginatedResponse } from "@/types";

const BASE_URL = "https://api.balldontlie.io/v1";

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
  retries = 3
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add API key if available
  if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY) {
    headers["Authorization"] = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (response.status === 429 && attempt < retries) {
      // Rate limited — wait with exponential backoff then retry
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  throw new Error("API Error: max retries exceeded");
}

// Players
export async function getPlayers(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  team_ids?: number[];
}): Promise<PaginatedResponse<Player>> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
  if (params?.search) searchParams.set("search", params.search);
  if (params?.team_ids) {
    params.team_ids.forEach((id) => searchParams.append("team_ids[]", id.toString()));
  }

  const query = searchParams.toString();
  return fetchAPI<PaginatedResponse<Player>>(`/players${query ? `?${query}` : ""}`);
}

export async function getPlayer(id: number): Promise<{ data: Player }> {
  return fetchAPI<{ data: Player }>(`/players/${id}`);
}

// Teams
export async function getTeams(): Promise<{ data: Team[] }> {
  return fetchAPI<{ data: Team[] }>("/teams");
}

export async function getTeam(id: number): Promise<{ data: Team }> {
  return fetchAPI<{ data: Team }>(`/teams/${id}`);
}

// Games
export async function getGames(params?: {
  page?: number;
  per_page?: number;
  dates?: string[];
  seasons?: number[];
  team_ids?: number[];
  postseason?: boolean;
  start_date?: string;
  end_date?: string;
}): Promise<PaginatedResponse<Game>> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
  if (params?.dates) {
    params.dates.forEach((date) => searchParams.append("dates[]", date));
  }
  if (params?.seasons) {
    params.seasons.forEach((season) => searchParams.append("seasons[]", season.toString()));
  }
  if (params?.team_ids) {
    params.team_ids.forEach((id) => searchParams.append("team_ids[]", id.toString()));
  }
  if (params?.postseason !== undefined) {
    searchParams.set("postseason", params.postseason.toString());
  }
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);

  const query = searchParams.toString();
  return fetchAPI<PaginatedResponse<Game>>(`/games${query ? `?${query}` : ""}`);
}

export async function getGame(id: number): Promise<{ data: Game }> {
  return fetchAPI<{ data: Game }>(`/games/${id}`);
}

// Stats
export async function getStats(params?: {
  page?: number;
  per_page?: number;
  dates?: string[];
  seasons?: number[];
  player_ids?: number[];
  game_ids?: number[];
  postseason?: boolean;
  start_date?: string;
  end_date?: string;
}): Promise<PaginatedResponse<GamePlayerStats>> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
  if (params?.dates) {
    params.dates.forEach((date) => searchParams.append("dates[]", date));
  }
  if (params?.seasons) {
    params.seasons.forEach((season) => searchParams.append("seasons[]", season.toString()));
  }
  if (params?.player_ids) {
    params.player_ids.forEach((id) => searchParams.append("player_ids[]", id.toString()));
  }
  if (params?.game_ids) {
    params.game_ids.forEach((id) => searchParams.append("game_ids[]", id.toString()));
  }
  if (params?.postseason !== undefined) {
    searchParams.set("postseason", params.postseason.toString());
  }
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);

  const query = searchParams.toString();
  return fetchAPI<PaginatedResponse<GamePlayerStats>>(`/stats${query ? `?${query}` : ""}`);
}

// Season Averages
export async function getSeasonAverages(params: {
  season: number;
  player_ids: number[];
}): Promise<{ data: PlayerStats[] }> {
  const searchParams = new URLSearchParams();
  searchParams.set("season", params.season.toString());
  params.player_ids.forEach((id) => searchParams.append("player_ids[]", id.toString()));

  return fetchAPI<{ data: PlayerStats[] }>(`/season_averages?${searchParams.toString()}`);
}

// Career Stats — Multi-Season Fetcher
export async function getPlayerCareerStats(
  playerId: number,
  draftYear: number | null
): Promise<PlayerStats[]> {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth < 9 ? currentYear - 1 : currentYear;

  // Start from draft year, or 2015 if no draft year (2015 is the earliest reliable data in Ball Don't Lie API)
  const startYear = draftYear || 2015;

  // Generate list of seasons to fetch
  const seasons: number[] = [];
  for (let year = startYear; year <= currentSeason; year++) {
    seasons.push(year);
  }

  // Rate limiting consideration: batch requests in chunks to avoid overwhelming the API
  // Ball Don't Lie API has rate limits, so we'll process in chunks of 8 seasons at a time
  const CHUNK_SIZE = 8;
  const allStats: PlayerStats[] = [];

  for (let i = 0; i < seasons.length; i += CHUNK_SIZE) {
    const chunk = seasons.slice(i, i + CHUNK_SIZE);

    // Fetch all seasons in this chunk in parallel
    const chunkResults = await Promise.allSettled(
      chunk.map(season =>
        getSeasonAverages({ season, player_ids: [playerId] })
          .then(res => ({ season, data: res.data }))
      )
    );

    // Process results, extracting successful fetches and filtering out empty seasons
    for (const result of chunkResults) {
      if (result.status === "fulfilled" && result.value.data.length > 0) {
        allStats.push(...result.value.data);
      }
      // If failed or empty, just skip (player may not have played that season)
    }
  }

  // Sort by season ascending (oldest to newest)
  return allStats.sort((a, b) => a.season - b.season);
}
