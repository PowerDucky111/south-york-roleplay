import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { getGuild, getRoles, getBans } from "@/lib/discord";

// GET /api/guild -> overview stats
export async function GET() {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  try {
    const [guild, roles, bans] = await Promise.all([getGuild(), getRoles(), getBans()]);
    return NextResponse.json({
      guild,
      roleCount: roles.length,
      banCount: bans.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch guild data" },
      { status: 502 }
    );
  }
}
