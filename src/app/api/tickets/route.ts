import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(["general", "technical", "whitelist", "player-report", "other"]);

export async function GET() {
  const session = await requireSession();
  try {
    const db = getDatabase();
    const result = await db.prepare(
      "SELECT t.id, t.ticket_number, t.subject, t.category, t.priority, t.status, t.created_at, t.updated_at, (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id AND tm.is_internal_note = 0) AS message_count FROM tickets t WHERE t.owner_discord_id = ? ORDER BY t.updated_at DESC"
    ).bind(session.userId).all();
    return NextResponse.json({ tickets: result.results });
  } catch (error) {
    console.error("[tickets] GET failed:", error);
    return NextResponse.json({ error: "Could not load your support tickets." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { subject?: unknown; category?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit a valid support request." }, { status: 400 });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const category = typeof body.category === "string" ? body.category : "general";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (subject.length < 5 || subject.length > 100) {
    return NextResponse.json({ error: "Your subject must be between 5 and 100 characters." }, { status: 400 });
  }
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Choose a valid support category." }, { status: 400 });
  }
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json({ error: "Your message must be between 10 and 5,000 characters." }, { status: 400 });
  }

  try {
    const db = getDatabase();
    await db.prepare(
      "INSERT INTO panel_users (discord_user_id, username, avatar_hash) VALUES (?, ?, ?) ON CONFLICT(discord_user_id) DO UPDATE SET username = excluded.username, avatar_hash = excluded.avatar_hash, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"
    ).bind(session.userId, session.username, session.avatar).run();

    const id = crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const statements = [
      db.prepare(
        "INSERT INTO tickets (id, ticket_number, owner_discord_id, subject, category, status) VALUES (?, (SELECT COALESCE(MAX(ticket_number), 0) + 1 FROM tickets), ?, ?, ?, 'open')"
      ).bind(id, session.userId, subject, category),
      db.prepare(
        "INSERT INTO ticket_messages (id, ticket_id, author_discord_id, body) VALUES (?, ?, ?, ?)"
      ).bind(messageId, id, session.userId, message),
      db.prepare(
        "INSERT INTO audit_logs (id, actor_discord_id, action, target_type, target_id, metadata_json) VALUES (?, ?, 'ticket.created', 'ticket', ?, ?)"
      ).bind(crypto.randomUUID(), session.userId, id, JSON.stringify({ subject, category })),
    ];
    await db.batch(statements);
    return NextResponse.json({ success: true, ticketId: id }, { status: 201 });
  } catch (error) {
    console.error("[tickets] POST failed:", error);
    return NextResponse.json({ error: "Your support ticket could not be created. Please try again." }, { status: 500 });
  }
}
