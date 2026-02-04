import prisma from "./prisma";
import { getNBASeasonString } from "@/lib/utils/nba-season";

export async function getPlayerById(id: number) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      team: true,
      stats: {
        orderBy: { season: "desc" },
        take: 1,
      },
    },
  });
}

export async function getPlayerSeasonStats(playerId: number, season?: string) {
  const seasonStr = season || getNBASeasonString();
  return prisma.playerStats.findUnique({
    where: {
      playerId_season: { playerId, season: seasonStr },
    },
  });
}

export async function getPlayerCareerStats(playerId: number) {
  return prisma.playerStats.findMany({
    where: { playerId },
    orderBy: { season: "asc" },
  });
}

export async function getPlayerGameStats(
  playerId: number,
  season?: number,
  limit = 82
) {
  return prisma.gamePlayerStats.findMany({
    where: {
      playerId,
      ...(season ? { game: { season } } : {}),
    },
    include: {
      game: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: { game: { date: "desc" } },
    take: limit,
  });
}

export async function searchPlayers(query: string, limit = 10) {
  return prisma.player.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        {
          AND: query.includes(" ")
            ? [
                {
                  firstName: {
                    contains: query.split(" ")[0],
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: query.split(" ").slice(1).join(" "),
                    mode: "insensitive",
                  },
                },
              ]
            : [],
        },
      ],
    },
    include: { team: true },
    take: limit,
  });
}
