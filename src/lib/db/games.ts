import prisma from "./prisma";
import { getNBASeason } from "@/lib/utils/nba-season";

interface GameFilters {
  date?: string;
  season?: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
  postseason?: boolean;
  limit?: number;
}

export async function getGames(filters?: GameFilters) {
  const season = filters?.season || getNBASeason();

  return prisma.game.findMany({
    where: {
      season,
      ...(filters?.date
        ? {
            date: {
              gte: new Date(`${filters.date}T00:00:00Z`),
              lt: new Date(`${filters.date}T23:59:59Z`),
            },
          }
        : {}),
      ...(filters?.startDate ? { date: { gte: new Date(filters.startDate) } } : {}),
      ...(filters?.endDate ? { date: { lte: new Date(filters.endDate) } } : {}),
      ...(filters?.teamId
        ? {
            OR: [
              { homeTeamId: filters.teamId },
              { awayTeamId: filters.teamId },
            ],
          }
        : {}),
      ...(filters?.postseason !== undefined
        ? { postseason: filters.postseason }
        : {}),
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { date: "desc" },
    take: filters?.limit || 100,
  });
}

export async function getGameById(id: number) {
  return prisma.game.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      playerStats: {
        include: {
          player: {
            include: { team: true },
          },
        },
        orderBy: { points: "desc" },
      },
    },
  });
}

export async function getTodayGames() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  return prisma.game.findMany({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { date: "asc" },
  });
}
