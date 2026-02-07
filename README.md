# StatLine — Real-Time NBA Stats & Analytics

A full-stack NBA analytics platform built with Next.js 16, React 19, and TypeScript. Aggregates data from multiple sources to deliver live scores, player/team stats, head-to-head comparisons, and award predictions — all in a responsive, dark-themed UI.


---

## Features

### Live Game Tracking
- Real-time scoreboard with adaptive polling (10s during live games, 30s pre-tip, stops when final)
- Animated score updates via Framer Motion
- Betting odds overlay (spread, moneyline, over/under) via The Odds API

### Player Profiles & Search
- Instant search across 600+ active players with headshot previews and keyboard navigation
- Season averages, career stats across all seasons, and recent game logs
- Player headshots served from the NBA CDN

### Team Pages
- All 30 teams organized by conference with win-loss records
- Full rosters with per-game averages, expandable game logs, and recent results
- Hover-prefetching for instant page transitions

### Head-to-Head Comparison
- Side-by-side stat comparison of any two players
- Visual indicators highlighting the leader in each category

### Award Predictions
- MVP, Champion, and Rookie of the Year predictions
- Pulls real sportsbook futures odds when available (DraftKings via The Odds API)
- Falls back to a stat-based scoring model (MVP) or standings-derived probabilities (Champion) when odds markets are unavailable

### Top 100 All-Time
- Curated list of the greatest NBA players with career stats and accolades

---

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript 5 |
| Database | PostgreSQL + Prisma ORM |
| State Management | TanStack React Query |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Deployment | Vercel (with scheduled cron jobs) |

### Data Pipeline

The app aggregates data from three external APIs with a multi-source fallback strategy:

1. **Ball Don't Lie API** — primary source for players, teams, games, and box scores
2. **NBA.com Stats API** — league leaders, full rosters, live scoreboard, and player bios (proxied server-side to handle CORS)
3. **The Odds API** — game-level and futures betting odds with automatic key failover on quota exhaustion

Data flows through a **DB → BDL → NBA.com** fallback chain per request, so the app stays functional even if an upstream API goes down.

### Caching Strategy

- **Server-side in-memory cache** with configurable TTLs (15s for live scores, 10min for league leaders, 30min for team rosters)
- **React Query client cache** with per-hook stale times (5min default, 24hr for teams)
- **HTTP Cache-Control headers** tuned per endpoint
- **Database-backed cache entries** for sync timestamps

### Automated Sync

Vercel cron jobs keep the database current:
- Every 30 minutes: game scores and box scores
- Daily at 6:00 AM: full sync of teams, players, season games, and stats



## Author

Shayan Siddiqui
