import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const auth = await requirePermissionApi("tickets.view_queue");
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    const db = getDatabase();
    const ticket = await db.prepare(
      "SELECT t.id,t.ticket_number,t.subject,t.category,t.priority,t.status,t.owner_discord_id,owner.username AS owner_username,t.assigned_to,assignee.username AS assignee_username,t.created_at,t.updated_at FROM tickets t LEFT JOIN panel_users owner ON owner.discord_user_id=t.owner_discord_id LEFT JOIN panel_users assignee ON assignee.discord_user_id=t.assigned_to WHERE t.id=?"
    ).bind(id).first();
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    const messages = await db.prepare(
      "SELECT tm.id,tm.body,tm.is_internal_note,tm.created_at,tm.author_discord_id,u.username AS author_username FROM ticket_messages tm LEFT JOIN panel_users u ON u.discord_user_id=tm.author_discord_id WHERE tm.ticket_id=? ORDER BY tm.created_at ASC"
    ).bind(id).all();
    return NextResponse.json({ ticket, messages: messages.results });
  } catch (error) {
    console.error("[staff ticket detail] GET failed:", error);
    return NextResponse.json({ error: "Could not load this ticket." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await requirePermissionApi("tickets.reply");
  if ("response" in auth) return auth.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const { id } = await context.params;
  let body: { message?: unknown; internalNote?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const internalNote = body.internalNote === true;
  if (message.length < 1 || message.length > 5000) return NextResponse.json({ error: "Your message must be between 1 and 5,000 characters." }, { status: 400 });

  try {
    const db = getDatabase();
    const ticket = await db.prepare("SELECT id,status FROM tickets WHERE id=?").bind(id).first<{id:string;status:string}>();
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    if (ticket.status === "closed") return NextResponse.json({ error: "This ticket is closed. Reopen it before replying." }, { status: 409 });

    const statements = [
      db.prepare("INSERT INTO panel_users (discord_user_id,username,avatar_hash) VALUES (?,?,?) ON CONFLICT(discord_user_id) DO UPDATE SET username=excluded.username,avatar_hash=excluded.avatar_hash,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')").bind(auth.session.userId,auth.session.username,auth.session.avatar),
      db.prepare("INSERT INTO ticket_messages (id,ticket_id,author_discord_id,body,is_internal_note) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(),id,auth.session.userId,message,internalNote ? 1 : 0),
      db.prepare("UPDATE tickets SET status=CASE WHEN ?=1 THEN status ELSE 'awaiting_player' END,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(internalNote ? 1 : 0,id),
      db.prepare("INSERT INTO audit_logs (id,actor_discord_id,action,target_type,target_id,metadata_json) VALUES (?,?,?,'ticket',?,?)").bind(crypto.randomUUID(),auth.session.userId,internalNote ? "ticket.internal_note_added" : "ticket.staff_reply_added",id,JSON.stringify({ internalNote })),
    ];
    await db.batch(statements);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[staff ticket detail] POST failed:", error);
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }
}
