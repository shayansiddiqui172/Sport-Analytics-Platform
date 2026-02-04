import { NextRequest, NextResponse } from "next/server";
import { runQuickSync, runFullSync, getSyncStatus } from "@/lib/sync";

export async function POST(request: NextRequest) {
  // Verify sync secret
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    const querySecret = new URL(request.url).searchParams.get("secret");
    const provided = authHeader?.replace("Bearer ", "") || querySecret;

    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "quick";

  try {
    let result;
    if (type === "full") {
      result = await runFullSync();
    } else {
      result = await runQuickSync();
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[api/sync] ${type} sync failed:`, error);
    return NextResponse.json(
      { error: `Sync failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Verify sync secret for status check too
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    const querySecret = new URL(request.url).searchParams.get("secret");
    const provided = authHeader?.replace("Bearer ", "") || querySecret;

    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const status = await getSyncStatus();
    return NextResponse.json({ status });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to get sync status: ${error.message}` },
      { status: 500 }
    );
  }
}
