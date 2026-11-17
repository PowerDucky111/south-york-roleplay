import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { getMember, displayName } from "@/lib/discord";
import { getDatabase } from "@/lib/db";
import { syncMemberNickname } from "@/lib/callsign";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermissionApi("system.manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const callsign = String(body?.callsign ?? "").trim();
  if (!/^\d{3,4}$/.test(callsign)) {
    return NextResponse.json({ error: "Callsign must be a 3- or 4-digit number." }, { status: 400 });
  }

  try {
    const member = await getMember(id);
    if (!member.user || member.user.bot) {
      return NextResponse.json({ error: "A valid human Discord member is required." }, { status: 400 });
    }

    const db = getDatabase();
    await db.prepare(
      `INSERT INTO panel_users (discord_user_id, username, avatar_hash, callsign)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(discord_user_id) DO UPDATE SET
         username = excluded.username,
         avatar_hash = excluded.avatar_hash,
         callsign = excluded.callsign,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`
    ).bind(id, member.user.global_name ?? member.user.username, member.user.avatar, callsign).run();

    try {
      await syncMemberNickname(id, callsign, displayName(member));
      return NextResponse.json({ ok: true, callsign, discordSynced: true });
    } catch (error) {
      console.warn(`[callsign] Saved ${callsign} for ${id}, but Discord nickname update failed:`, error);
      return NextResponse.json({
        ok: true,
        callsign,
        discordSynced: false,
        warning: "The callsign was saved, but Discord could not update this member's nickname. Check the bot's role hierarchy and Manage Nicknames permission.",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign callsign";
    const conflict = /unique constraint|idx_panel_users_callsign/i.test(message);
    return NextResponse.json(
      { error: conflict ? "That callsign is already assigned. Choose another number." : message },
      { status: conflict ? 409 : 502 }
    );
  }
}
