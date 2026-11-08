import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { timeoutMember } from "@/lib/discord";
import { notifyModeration } from "@/lib/moderation-notify";

// PATCH /api/members/[id]/timeout  body: { durationMinutes: number }  (0 = remove timeout)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const minutes = Number(body?.durationMinutes);

  if (!Number.isFinite(minutes) || minutes < 0) {
    return NextResponse.json({ error: "durationMinutes must be a non-negative number" }, { status: 400 });
  }

  // Discord timeouts: max 28 days (40320 minutes).
  const clamped = Math.min(minutes, 40320);
  const until = clamped === 0 ? null : new Date(Date.now() + clamped * 60_000).toISOString();

  try {
    await timeoutMember(id, until);
    if (until) {
      const hours = Math.floor(clamped / 60);
      const mins = clamped % 60;
      const durationLabel =
        hours > 0 ? `${hours}h ${mins}m` : `${mins} minute${mins === 1 ? "" : "s"}`;
      const endsAt = new Date(until).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      });
      await notifyModeration(id, {
        action: "timeout",
        durationLabel,
        endsAtLabel: `${endsAt} UTC`,
        moderatorName: auth.session.username,
      });
    }
    return NextResponse.json({ ok: true, until });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update timeout" },
      { status: 502 }
    );
  }
}
