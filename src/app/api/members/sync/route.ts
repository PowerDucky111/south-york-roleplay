import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { displayName, getMembers } from "@/lib/discord";
import { callsignNickname, ensureMemberCallsign, syncMemberNickname } from "@/lib/callsign";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST() {
  const auth = await requirePermissionApi("system.manage");
  if ("response" in auth) return auth.response;

  try {
    const members = await getMembers();
    let processed = 0;
    let nicknamesUpdated = 0;
    let nicknamesAlreadyCorrect = 0;
    let nicknameFailures = 0;
    const failureDetails: { userId: string; reason: string }[] = [];

    for (const member of members) {
      if (!member.user || member.user.bot) continue;
      const existing = await ensureMemberCallsign(member.user, displayName(member));
      processed++;
      try {
        const desiredNickname = callsignNickname(existing, displayName(member));
        if (member.nick !== desiredNickname) {
          await syncMemberNickname(member.user.id, existing, displayName(member));
          nicknamesUpdated++;
        } else {
          nicknamesAlreadyCorrect++;
        }
      } catch (error) {
        nicknameFailures++;
        const reason = errorMessage(error);
        console.warn(`[callsign-sync] Nickname update failed for ${member.user.id}: ${reason}`);
        if (failureDetails.length < 25) {
          failureDetails.push({ userId: member.user.id, reason });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      membersProcessed: processed,
      nicknamesUpdated,
      nicknamesAlreadyCorrect,
      nicknameFailures,
      nicknameFailureDetails: failureDetails,
      message: `Sync complete: ${processed} members processed, ${nicknamesUpdated} nicknames updated, ${nicknamesAlreadyCorrect} already correct, ${nicknameFailures} nickname updates failed.`,
    });
  } catch (error) {
    const message = errorMessage(error);
    console.error(`[callsign-sync] Member sync failed: ${message}`);
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
