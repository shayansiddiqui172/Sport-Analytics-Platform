"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Trophy,
  BarChart3,
  ArrowRight,
  Zap,
  Target,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { GameTicker } from "@/components/games/game-ticker";
import { Button, Card, CardContent, Badge, TeamLogo } from "@/components/ui";
import { useLiveScores, useTeams } from "@/hooks/useNBAData";

export default function Home() {
  const { data: gamesData, isLoading: gamesLoading, hasLiveGames, isLive } = useLiveScores();
  const { data: teamsData } = useTeams();

  const games = gamesData?.data || [];
  const teams = teamsData?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent-purple/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="primary" className="mb-4">
                NBA Stats Platform
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="gradient-text">Real-Time NBA Stats</span>
                <br />
                <span className="text-text-primary">& Analytics</span>
              </h1>
              <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
                Live scores, player comparisons, predictive analytics, and comprehensive
                statistics for every NBA game. Your ultimate basketball data companion.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/games">
                  <Button size="lg" className="w-full sm:w-auto">
                    View Live Games
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/all-time">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Top 100 All-Time
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Live Games Ticker */}
        <section className="py-8 border-y border-border bg-surface/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Today&apos;s Games</h2>
                {games.some((g) => g.status === "in_progress") && (
                  <Badge variant="live" size="sm">
                    <span className="relative flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      LIVE
                    </span>
                  </Badge>
                )}
              </div>
              <Link
                href="/games"
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                View All Games
              </Link>
            </div>
            <GameTicker games={games} isLoading={gamesLoading} isLive={isLive} />
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">
                Everything You Need for NBA Analytics
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                From live scores to predictive models, StatLine provides comprehensive
                tools for basketball analysis.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Live Scores"
                description="Real-time game updates with play-by-play coverage"
                href="/games"
                delay={0}
              />
              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="Player Comparison"
                description="Compare players side-by-side with detailed stats"
                href="/compare"
                delay={0.1}
              />
              <FeatureCard
                icon={<Target className="w-6 h-6" />}
                title="Predictions"
                description="ML-powered MVP rankings and game predictions"
                href="/predictions"
                delay={0.2}
              />
              <FeatureCard
                icon={<Trophy className="w-6 h-6" />}
                title="Top 100 All-Time"
                description="Curated rankings of the greatest players ever"
                href="/all-time"
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* Stats Preview */}
        <section className="py-16 bg-surface/50 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard value="30" label="NBA Teams" />
              <StatCard value="450+" label="Active Players" />
              <StatCard value="1,230" label="Games/Season" />
              <StatCard value="50+" label="Stats Tracked" />
            </div>
          </div>
        </section>

        {/* Teams Section */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Browse by Team</h2>
                <p className="text-text-secondary">
                  Explore rosters, stats, and schedules for all 30 NBA teams
                </p>
              </div>
              <Link href="/teams">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-4">
              {teams.slice(0, 10).map((team) => (
                <motion.a
                  key={team.id}
                  href={`/teams/${team.id}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center p-4 bg-surface border border-border rounded-xl hover:border-border-light transition-colors"
                >
                  <TeamLogo
                    teamId={team.id}
                    teamName={team.full_name}
                    abbreviation={team.abbreviation}
                    size="md"
                    className="mb-2"
                  />
                  <span className="text-xs text-text-secondary text-center">
                    {team.city}
                  </span>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <span className="text-xl font-bold gradient-text">StatLine</span>
                </div>
                <p className="text-sm text-text-muted">
                  Your ultimate NBA statistics and analytics platform.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>
                    <Link href="/games" className="hover:text-text-primary transition-colors">
                      Games
                    </Link>
                  </li>
                  <li>
                    <Link href="/teams" className="hover:text-text-primary transition-colors">
                      Teams
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Features</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>
                    <Link href="/compare" className="hover:text-text-primary transition-colors">
                      Compare Players
                    </Link>
                  </li>
                  <li>
                    <Link href="/predictions" className="hover:text-text-primary transition-colors">
                      Predictions
                    </Link>
                  </li>
                  <li>
                    <Link href="/all-time" className="hover:text-text-primary transition-colors">
                      Top 100 All-Time
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border text-center text-sm text-text-muted">
              <p>&copy; {new Date().getFullYear()} StatLine. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

function FeatureCard({
  icon,
  title,
  description,
  href,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="h-full"
    >
      <Link href={href} className="h-full block">
        <Card variant="interactive" className="h-full">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-4">
              {icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-text-secondary">{description}</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
    </motion.div>
  );
}
