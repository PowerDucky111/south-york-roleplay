import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { unbanMember } from "@/lib/discord";
import { notifyModeration } from "@/lib/moderation-notify";

// DELETE /api/bans/[userId]  -> unban
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requirePermissionApi("discord.moderate");
  if ("response" in auth) return auth.response;

  const { userId } = await params;
  try {
    await unbanMember(userId);
    await notifyModeration(userId, {
      action: "unban",
      moderatorName: auth.session.username,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to unban user" },
      { status: 502 }
    );
  }
}
