import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { getMembers, getRoles } from "@/lib/discord";

// GET /api/members -> { members, roles }
export async function GET() {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  try {
    const [members, roles] = await Promise.all([getMembers(), getRoles()]);
    return NextResponse.json({ members, roles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch members" },
      { status: 502 }
    );
  }
}
