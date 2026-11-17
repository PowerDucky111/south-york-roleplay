import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { banMember } from "@/lib/discord";
import { notifyModeration } from "@/lib/moderation-notify";

// PUT /api/members/[id]/ban  body: { deleteMessageSeconds?: number }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("discord.moderate");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  if (id === auth.session.userId) {
    return NextResponse.json({ error: "You cannot ban yourself" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const deleteMessageSeconds = Number(body?.deleteMessageSeconds ?? 0);
  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : null;

  try {
    await banMember(id, deleteMessageSeconds);
    await notifyModeration(id, {
      action: "ban",
      durationLabel: "Permanent",
      moderatorName: auth.session.username,
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to ban member" },
      { status: 502 }
    );
  }
}
