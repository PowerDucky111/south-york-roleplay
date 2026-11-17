import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { displayName, getMembers } from "@/lib/discord";
import { ensureMemberCallsign, syncMemberNickname } from "@/lib/callsign";

export async function POST() {
  const auth = await requirePermissionApi("system.manage");
  if ("response" in auth) return auth.response;

  try {
    const members = await getMembers();
    let processed = 0;
    let nicknamesUpdated = 0;
    let nicknameFailures = 0;

    for (const member of members) {
      if (!member.user || member.user.bot) continue;
      const existing = await ensureMemberCallsign(member.user, displayName(member));
      processed++;
      try {
        await syncMemberNickname(member.user.id, existing, displayName(member));
        nicknamesUpdated++;
      } catch (error) {
        nicknameFailures++;
        console.warn(`[callsign-sync] Could not update nickname for ${member.user.id}:`, error);
      }
    }

    return NextResponse.json({
      ok: true,
      membersProcessed: processed,
      nicknamesUpdated,
      nicknameFailures,
      message: `Sync complete: ${processed} members processed, ${nicknamesUpdated} nicknames updated, ${nicknameFailures} nickname updates failed. Leadership above the bot role may need manual updates.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Member sync failed" },
      { status: 502 }
    );
  }
}
