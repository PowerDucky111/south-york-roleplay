import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { addMemberRole, updateMemberNickname } from "@/lib/discord";

export const dynamic = "force-dynamic";
const ALLOWED_STATUSES = new Set(["in_review", "awaiting_information", "approved", "rejected"]);

export async function GET() {
  const auth = await requirePermissionApi("applications.manage");
  if ("response" in auth) return auth.response;
  try {
    const result = await getDatabase().prepare(
      "SELECT a.id, a.applicant_discord_id, a.application_type_id, a.status, a.answers_json, a.review_notes, a.submitted_at, a.created_at, a.updated_at, t.name AS application_type_name, u.username AS applicant_username, u.callsign AS applicant_callsign FROM applications a JOIN application_types t ON t.id = a.application_type_id LEFT JOIN panel_users u ON u.discord_user_id = a.applicant_discord_id ORDER BY CASE a.status WHEN 'submitted' THEN 0 WHEN 'in_review' THEN 1 WHEN 'awaiting_information' THEN 2 ELSE 3 END, a.created_at ASC"
    ).all();
    return NextResponse.json({ applications: result.results });
  } catch (error) {
    console.error("[admin applications] GET failed:", error);
    return NextResponse.json({ error: "Could not load the application queue." }, { status: 500 });
  }
}

async function allocateCallsign(db: ReturnType<typeof getDatabase>, userId: string): Promise<string> {
  const current = await db.prepare("SELECT callsign FROM panel_users WHERE discord_user_id = ?").bind(userId).first<{ callsign: string | null }>();
  if (current?.callsign) return current.callsign;
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = String(100 + Math.floor(Math.random() * 9900));
    try {
      await db.prepare("UPDATE panel_users SET callsign = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE discord_user_id = ? AND callsign IS NULL").bind(candidate, userId).run();
      const saved = await db.prepare("SELECT callsign FROM panel_users WHERE discord_user_id = ?").bind(userId).first<{ callsign: string | null }>();
      if (saved?.callsign) return saved.callsign;
    } catch (error) {
      // A unique-index collision simply causes another candidate to be tried.
      if (attempt === 99) throw error;
    }
  }
  throw new Error("Could not allocate a unique callsign.");
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermissionApi("applications.manage");
  if ("response" in auth) return auth.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  let body: { applicationId?: unknown; status?: unknown; reviewNotes?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.applicationId !== "string" || !body.applicationId.trim() || typeof body.status !== "string" || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Choose a valid application decision." }, { status: 400 });
  }
  const notes = typeof body.reviewNotes === "string" ? body.reviewNotes.trim().slice(0, 4000) : "";

  try {
    const db = getDatabase();
    const application = await db.prepare(
      "SELECT a.id, a.status, a.applicant_discord_id, a.answers_json, t.discord_role_id, t.discord_role_ids_json FROM applications a JOIN application_types t ON t.id = a.application_type_id WHERE a.id = ?"
    ).bind(body.applicationId).first<{ id: string; status: string; applicant_discord_id: string; answers_json: string; discord_role_id: string | null; discord_role_ids_json: string | null }>();
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    if (["approved", "rejected", "withdrawn"].includes(application.status)) return NextResponse.json({ error: "This application has already been closed." }, { status: 409 });

    await db.prepare("INSERT INTO panel_users (discord_user_id, username, avatar_hash) VALUES (?, ?, ?) ON CONFLICT(discord_user_id) DO UPDATE SET username = excluded.username, avatar_hash = excluded.avatar_hash, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')")
      .bind(auth.session.userId, auth.session.username, auth.session.avatar).run();

    let callsign: string | null = null;
    if (body.status === "approved") {
      let roleIds: string[] = [];
      try { roleIds = application.discord_role_ids_json ? JSON.parse(application.discord_role_ids_json) as string[] : []; } catch { roleIds = []; }
      if (!roleIds.length && application.discord_role_id) roleIds = [application.discord_role_id];
      if (!roleIds.length) return NextResponse.json({ error: "No Discord whitelist roles are configured. Configure at least one role in Application settings." }, { status: 409 });

      const answers = JSON.parse(application.answers_json) as Record<string, string>;
      const rpName = (answers.rp_name || "").trim();
      callsign = await allocateCallsign(db, application.applicant_discord_id);
      try {
        for (const roleId of [...new Set(roleIds)]) await addMemberRole(application.applicant_discord_id, roleId);
        const nickname = `${callsign} | ${rpName || "South York Roleplay"}`.slice(0, 32);
        await updateMemberNickname(application.applicant_discord_id, nickname);
      } catch (error) {
        console.error("[admin applications] Discord whitelist approval actions failed:", error);
        return NextResponse.json({ error: "Discord could not complete the whitelist approval. Check the bot's Manage Roles and Manage Nicknames permissions, role hierarchy, and that the applicant is in the server. You can retry this approval." }, { status: 502 });
      }
    }

    await db.prepare("UPDATE applications SET status = ?, review_notes = ?, reviewed_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
      .bind(body.status, notes, auth.session.userId, body.applicationId).run();
    await db.prepare("INSERT INTO audit_logs (id, actor_discord_id, action, target_type, target_id, metadata_json) VALUES (?, ?, ?, 'application', ?, ?)")
      .bind(crypto.randomUUID(), auth.session.userId, "application." + body.status, body.applicationId, JSON.stringify({ reviewNotes: notes, callsign })).run();
    return NextResponse.json({ success: true, callsign });
  } catch (error) {
    console.error("[admin applications] PATCH failed:", error);
    return NextResponse.json({ error: "Could not update this application." }, { status: 500 });
  }
}
