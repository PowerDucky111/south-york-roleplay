import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { kickMember } from "@/lib/discord";
import { notifyModeration } from "@/lib/moderation-notify";

// POST /api/members/[id]/kick
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  if (id === auth.session.userId) {
    return NextResponse.json({ error: "You cannot kick yourself" }, { status: 400 });
  }

  try {
    await kickMember(id);
    await notifyModeration(id, {
      action: "kick",
      durationLabel: "You may rejoin the server",
      moderatorName: auth.session.username,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to kick member" },
      { status: 502 }
    );
  }
}
