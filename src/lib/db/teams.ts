import prisma from "./prisma";

export async function getAllTeams() {
  return prisma.team.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getTeamById(id: number) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      players: {
        include: {
          stats: {
            orderBy: { season: "desc" },
            take: 1,
          },
        },
      },
    },
  });
}
