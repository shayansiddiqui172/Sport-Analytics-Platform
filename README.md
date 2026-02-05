# NBA Stats Web App

A modern web application for viewing and comparing NBA player statistics, built with Next.js and TypeScript.

## Features

- **Player Search**: Instant search across 600+ NBA players
- **Player Comparison**: Side-by-side statistical comparison of any two players
- **Live Stats**: Real-time player and team statistics from NBA.com
- **Game Tracking**: View scores, box scores, and game details
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16.1.5 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: Supabase Auth
- **Animations**: Framer Motion
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL database
- NBA Stats API access

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stats-web-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
DATABASE_URL="your-postgresql-url"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"
SYNC_SECRET_KEY="your-secret-key"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate deploy
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Sync

The app automatically syncs NBA data:
- **Quick sync**: Every 30 minutes (game stats and scores)
- **Full sync**: Daily at 6 AM (all players, teams, and stats)

Manual sync:
```bash
curl -X POST "http://localhost:3000/api/sync?type=full&secret=your-secret-key"
```

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Make sure to set all environment variables in your Vercel project settings.

## License

MIT

## Author

Shayan Siddiqui
