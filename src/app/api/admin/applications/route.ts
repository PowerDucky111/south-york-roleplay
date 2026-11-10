import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { addMemberRole } from "@/lib/discord";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set(["in_review", "awaiting_information", "approved", "rejected"]);

export async function GET() {
  const auth = await requirePermissionApi("applications.manage");
  if ("response" in auth) return auth.response;
  try {
    const db = getDatabase();
    const result = await db.prepare(
      "SELECT a.id, a.applicant_discord_id, a.application_type_id, a.status, a.answers_json, a.review_notes, a.submitted_at, a.created_at, a.updated_at, t.name AS application_type_name, u.username AS applicant_username FROM applications a JOIN application_types t ON t.id = a.application_type_id LEFT JOIN panel_users u ON u.discord_user_id = a.applicant_discord_id ORDER BY CASE a.status WHEN 'submitted' THEN 0 WHEN 'in_review' THEN 1 WHEN 'awaiting_information' THEN 2 ELSE 3 END, a.created_at ASC"
    ).all();
    return NextResponse.json({ applications: result.results });
  } catch (error) {
    console.error("[admin applications] GET failed:", error);
    return NextResponse.json({ error: "Could not load the application queue." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermissionApi("applications.manage");
  if ("response" in auth) return auth.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { applicationId?: unknown; status?: unknown; reviewNotes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body.applicationId !== "string" || !body.applicationId.trim() ||
      typeof body.status !== "string" || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Choose a valid application decision." }, { status: 400 });
  }
  const notes = typeof body.reviewNotes === "string" ? body.reviewNotes.trim().slice(0, 4000) : "";

  try {
    const db = getDatabase();
    const application = await db.prepare(
      "SELECT a.id, a.status, a.applicant_discord_id, t.discord_role_id FROM applications a JOIN application_types t ON t.id = a.application_type_id WHERE a.id = ?"
    ).bind(body.applicationId).first<{
      id: string;
      status: string;
      applicant_discord_id: string;
      discord_role_id: string | null;
    }>();
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    if (["approved", "rejected", "withdrawn"].includes(application.status)) {
      return NextResponse.json({ error: "This application has already been closed." }, { status: 409 });
    }

    // Ensure the reviewing staff member exists for the reviewed_by foreign key.
    await db.prepare(
      "INSERT INTO panel_users (discord_user_id, username, avatar_hash) VALUES (?, ?, ?) ON CONFLICT(discord_user_id) DO UPDATE SET username = excluded.username, avatar_hash = excluded.avatar_hash, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"
    ).bind(auth.session.userId, auth.session.username, auth.session.avatar).run();

    // Grant the configured Discord whitelist role before recording approval.
    // If Discord rejects the request, leave the application open for staff to retry.
    if (body.status === "approved") {
      if (!application.discord_role_id) {
        return NextResponse.json(
          { error: "No Discord whitelist role is configured for this application type. Configure its discord_role_id first." },
          { status: 409 }
        );
      }
      try {
        await addMemberRole(application.applicant_discord_id, application.discord_role_id);
      } catch (error) {
        console.error("[admin applications] Discord whitelist role grant failed:", error);
        return NextResponse.json(
          { error: "Discord could not grant the whitelist role. Check the bot token, Manage Roles permission, and role hierarchy, then try again." },
          { status: 502 }
        );
      }
    }

    await db.prepare(
      "UPDATE applications SET status = ?, review_notes = ?, reviewed_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?"
    ).bind(body.status, notes, auth.session.userId, body.applicationId).run();
    await db.prepare(
      "INSERT INTO audit_logs (id, actor_discord_id, action, target_type, target_id, metadata_json) VALUES (?, ?, ?, 'application', ?, ?)"
    ).bind(crypto.randomUUID(), auth.session.userId, "application." + body.status, body.applicationId, JSON.stringify({ reviewNotes: notes })).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin applications] PATCH failed:", error);
    return NextResponse.json({ error: "Could not update this application." }, { status: 500 });
  }
}
