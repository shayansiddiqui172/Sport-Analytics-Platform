import prisma from "@/lib/db/prisma";

const BDL_BASE = "https://api.balldontlie.io/v1";

async function fetchBDL<T>(endpoint: string): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY) {
    headers["Authorization"] = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY;
  }
  const res = await fetch(`${BDL_BASE}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`BDL API error: ${res.status}`);
  return res.json();
}

export async function syncTeams(): Promise<{ synced: number }> {
  const { data: teams } = await fetchBDL<{
    data: Array<{
      id: number;
      name: string;
      city: string;
      abbreviation: string;
      conference: string;
      division: string;
    }>;
  }>("/teams");

  let synced = 0;
  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: {
        name: team.name,
        city: team.city,
        abbreviation: team.abbreviation,
        conference: team.conference,
        division: team.division,
      },
      create: {
        id: team.id,
        name: team.name,
        city: team.city,
        abbreviation: team.abbreviation,
        conference: team.conference,
        division: team.division,
      },
    });
    synced++;
  }

  console.log(`[sync-teams] Upserted ${synced} teams`);
  return { synced };
}
