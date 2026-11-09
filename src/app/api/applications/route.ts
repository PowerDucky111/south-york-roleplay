import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ApplicationTypeRow {
  id: string;
  name: string;
  description: string;
  form_schema_json: string;
}
interface Question {
  id: string;
  label: string;
  type: "textarea" | "text";
  required: boolean;
}

export async function GET() {
  const session = await requireSession();
  try {
    const db = getDatabase();
    const [types, applications] = await Promise.all([
      db.prepare(
        "SELECT id, name, description, form_schema_json FROM application_types WHERE enabled = 1 ORDER BY sort_order ASC, name ASC"
      ).all<ApplicationTypeRow>(),
      db.prepare(
        "SELECT a.id, a.status, a.submitted_at, a.created_at, a.updated_at, t.name AS application_type_name FROM applications a JOIN application_types t ON t.id = a.application_type_id WHERE a.applicant_discord_id = ? ORDER BY a.created_at DESC"
      ).bind(session.userId).all(),
    ]);
    return NextResponse.json({ types: types.results, applications: applications.results });
  } catch (error) {
    console.error("[applications] GET failed:", error);
    return NextResponse.json({ error: "Could not load applications. Please try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();

  // Reject cross-origin submissions; the session cookie is intentionally HttpOnly.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { applicationTypeId?: unknown; answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit a valid application." }, { status: 400 });
  }

  if (typeof body.applicationTypeId !== "string" || !body.applicationTypeId.trim()) {
    return NextResponse.json({ error: "Choose an application type." }, { status: 400 });
  }
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Please complete the application form." }, { status: 400 });
  }

  try {
    const db = getDatabase();
    const type = await db.prepare(
      "SELECT id, form_schema_json FROM application_types WHERE id = ? AND enabled = 1"
    ).bind(body.applicationTypeId).first<{ id: string; form_schema_json: string }>();

    if (!type) return NextResponse.json({ error: "That application form is no longer available." }, { status: 404 });

    let questions: Question[];
    try {
      questions = JSON.parse(type.form_schema_json) as Question[];
    } catch {
      console.error("[applications] Invalid form schema for", type.id);
      return NextResponse.json({ error: "This application form is temporarily unavailable." }, { status: 500 });
    }

    const answers = body.answers as Record<string, unknown>;
    const cleanAnswers: Record<string, string> = {};
    for (const question of questions) {
      const value = answers[question.id];
      const answer = typeof value === "string" ? value.trim().slice(0, 5000) : "";
      if (question.required && !answer) {
        return NextResponse.json({ error: `Please answer: ${question.label}` }, { status: 400 });
      }
      cleanAnswers[question.id] = answer;
    }

    const existing = await db.prepare(
      "SELECT id FROM applications WHERE applicant_discord_id = ? AND application_type_id = ? AND status IN ('submitted', 'in_review', 'awaiting_information', 'approved') LIMIT 1"
    ).bind(session.userId, type.id).first<{ id: string }>();
    if (existing) {
      return NextResponse.json({ error: "You already have an active application of this type." }, { status: 409 });
    }

    await db.prepare(
      "INSERT INTO panel_users (discord_user_id, username, avatar_hash) VALUES (?, ?, ?) ON CONFLICT(discord_user_id) DO UPDATE SET username = excluded.username, avatar_hash = excluded.avatar_hash, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"
    ).bind(session.userId, session.username, session.avatar).run();

    const id = crypto.randomUUID();
    await db.prepare(
      "INSERT INTO applications (id, applicant_discord_id, application_type_id, status, answers_json, submitted_at) VALUES (?, ?, ?, 'submitted', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"
    ).bind(id, session.userId, type.id, JSON.stringify(cleanAnswers)).run();

    await db.prepare(
      "INSERT INTO audit_logs (id, actor_discord_id, action, target_type, target_id, metadata_json) VALUES (?, ?, 'application.submitted', 'application', ?, ?)"
    ).bind(crypto.randomUUID(), session.userId, id, JSON.stringify({ applicationTypeId: type.id })).run();

    return NextResponse.json({ success: true, applicationId: id }, { status: 201 });
  } catch (error) {
    console.error("[applications] POST failed:", error);
    return NextResponse.json({ error: "Your application could not be saved. Please try again." }, { status: 500 });
  }
}
