import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/db/players";
import * as api from "@/lib/api/balldontlie";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;

    const players = await searchPlayers(query, limit);

    // Map to BDL-compatible format, adding a DB indicator
    const data = players.map((p) => ({
      id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      position: p.position || "",
      height: p.height,
      weight: p.weight,
      jersey_number: p.jerseyNumber || "",
      college: p.college || "",
      country: p.country || "",
      draft_year: p.draftYear,
      draft_round: p.draftRound,
      draft_number: p.draftNumber,
      _source: "db", // Mark as database player
      team: p.team
        ? {
            id: p.team.id,
            name: p.team.name,
            city: p.team.city,
            full_name: `${p.team.city} ${p.team.name}`,
            abbreviation: p.team.abbreviation,
            conference: p.team.conference,
            division: p.team.division,
          }
        : null,
    }));

    // Also try BallDontLie search — prefer BDL results over DB for current players
    try {
      const bdlResults = await api.getPlayers({ search: query, per_page: limit });
      if (bdlResults.data && bdlResults.data.length > 0) {
        // For each BDL result, check if we have a DB version with the same name
        // If we do, REPLACE it with the BDL version (to use correct IDs)
        // If we don't, ADD the BDL version
        const bdlFullNames = new Map<string, any>();
        for (const bdlPlayer of bdlResults.data) {
          const fullName = `${bdlPlayer.first_name} ${bdlPlayer.last_name}`.toLowerCase();
          bdlFullNames.set(fullName, {
            id: `bdl-${bdlPlayer.id}`, // Use special prefix for BDL players
            first_name: bdlPlayer.first_name,
            last_name: bdlPlayer.last_name,
            position: bdlPlayer.position || "",
            height: bdlPlayer.height || "",
            weight: bdlPlayer.weight || 0,
            jersey_number: bdlPlayer.jersey_number || "",
            college: bdlPlayer.college || "",
            country: bdlPlayer.country || "",
            draft_year: bdlPlayer.draft_year || 0,
            draft_round: bdlPlayer.draft_round || 0,
            draft_number: bdlPlayer.draft_number || 0,
            _source: "bdl", // Mark as BDL player
            _bdl_id: bdlPlayer.id, // Store original BDL ID
            team: bdlPlayer.team || null,
          });
        }

        // Replace DB versions with BDL versions where they match by name
        const finalData = [];
        for (const dbPlayer of data) {
          const dbFullName = `${dbPlayer.first_name} ${dbPlayer.last_name}`.toLowerCase();
          if (bdlFullNames.has(dbFullName)) {
            // Prefer BDL version for this player
            finalData.push(bdlFullNames.get(dbFullName));
            bdlFullNames.delete(dbFullName); // Mark as used
          } else {
            // Keep DB version if no BDL match
            finalData.push(dbPlayer);
          }
        }

        // Add any remaining BDL results that weren't matched
        for (const bdlPlayer of bdlFullNames.values()) {
          finalData.push(bdlPlayer);
        }

        return NextResponse.json({
          data: finalData.slice(0, limit),
          meta: {
            total_count: finalData.length,
            current_page: 1,
            total_pages: 1,
            per_page: limit,
            next_page: null,
          },
        });
      }
    } catch (e) {
      // BDL search failed, just return DB results
      console.warn("BDL search failed:", e);
    }

    return NextResponse.json({
      data: data.slice(0, limit),
      meta: {
        total_count: data.length,
        current_page: 1,
        total_pages: 1,
        per_page: limit,
        next_page: null,
      },
    });
  } catch (error) {
    console.error("[api/db/players/search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search players" },
      { status: 500 }
    );
  }
}
