import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { getBans } from "@/lib/discord";

// GET /api/bans -> ban list
export async function GET() {
  const auth = await requirePermissionApi("discord.moderate");
  if ("response" in auth) return auth.response;

  try {
    const bans = await getBans();
    return NextResponse.json({ bans });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch bans" },
      { status: 502 }
    );
  }
}
