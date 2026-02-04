// Player Types
export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: Team | null;
}

export interface PlayerStats {
  id: number;
  player_id: number;
  season: number;
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
}

export interface GamePlayerStats {
  id: number;
  player_id: number;
  game: {
    id: number;
    date: string;
    season: number;
    home_team_id: number;
    home_team_score: number;
    visitor_team_id: number;
    visitor_team_score: number;
  };
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
}

// Team Types
export interface Team {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

// Game Types
export type GameStatus = 'scheduled' | 'in_progress' | 'final';

export interface Game {
  id: number;
  date: string;
  season: number;
  status: GameStatus;
  period: number;
  time: string;
  postseason: boolean;
  home_team: Team;
  home_team_score: number;
  visitor_team: Team;
  visitor_team_score: number;
}

export interface BoxScore {
  game: Game;
  home_team_stats: GamePlayerStats[];
  visitor_team_stats: GamePlayerStats[];
}

// User & Social Types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Comment {
  id: number;
  content: string;
  user_id: string;
  user: User;
  player_id: number | null;
  game_id: number | null;
  team_id: number | null;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
}

export interface Favorite {
  id: number;
  user_id: string;
  player_id: number | null;
  team_id: number | null;
  created_at: string;
}

// Prediction Types
export interface MVPCandidate {
  player: Player;
  probability: number;
  rank: number;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    win_shares: number;
    per: number;
    bpm: number;
    vorp: number;
  };
  team_record: {
    wins: number;
    losses: number;
  };
}

export interface GamePrediction {
  game: Game;
  home_win_probability: number;
  predicted_home_score: number;
  predicted_visitor_score: number;
  factors: {
    home_advantage: number;
    recent_form_home: number;
    recent_form_visitor: number;
    head_to_head: number;
  };
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total_pages: number;
    current_page: number;
    next_page: number | null;
    per_page: number;
    total_count: number;
  };
}

// Search Types
export interface SearchResult {
  type: 'player' | 'team' | 'game';
  id: number;
  name: string;
  subtitle?: string;
  image_url?: string;
}

// Top 100 Types
export interface AllTimePlayer {
  rank: number;
  player: {
    id: number;
    name: string;
    position: string;
    years_active: string;
    teams: string[];
    image_url: string;
  };
  achievements: string[];
  career_stats: {
    games: number;
    ppg: number;
    rpg: number;
    apg: number;
    championships: number;
    mvps: number;
    all_stars: number;
  };
  description: string;
}
