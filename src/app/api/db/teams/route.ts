import { NextResponse } from "next/server";
import { getAllTeams } from "@/lib/db/teams";

export async function GET() {
  try {
    const teams = await getAllTeams();

    // Map to BDL-compatible format for frontend compatibility
    const data = teams.map((t) => ({
      id: t.id,
      name: t.name,
      city: t.city,
      full_name: `${t.city} ${t.name}`,
      abbreviation: t.abbreviation,
      conference: t.conference,
      division: t.division,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/db/teams] Error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}
