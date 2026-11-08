import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { updateMemberRoles } from "@/lib/discord";

// PATCH /api/members/[id]  body: { roles: string[] }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const roles = body?.roles;

  if (!Array.isArray(roles) || roles.some((r) => typeof r !== "string")) {
    return NextResponse.json({ error: "Body must be { roles: string[] }" }, { status: 400 });
  }

  try {
    await updateMemberRoles(id, roles);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update roles" },
      { status: 502 }
    );
  }
}
