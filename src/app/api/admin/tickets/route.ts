import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["open", "awaiting_staff", "awaiting_player", "resolved", "closed"]);
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

export async function GET() {
  const auth = await requirePermissionApi("tickets.view_queue");
  if ("response" in auth) return auth.response;
  try {
    const db = getDatabase();
    const [tickets, staff] = await Promise.all([
      db.prepare(
        "SELECT t.id, t.ticket_number, t.subject, t.category, t.priority, t.status, t.owner_discord_id, owner.username AS owner_username, t.assigned_to, assignee.username AS assignee_username, t.created_at, t.updated_at, (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id=t.id AND tm.is_internal_note=0) AS message_count FROM tickets t LEFT JOIN panel_users owner ON owner.discord_user_id=t.owner_discord_id LEFT JOIN panel_users assignee ON assignee.discord_user_id=t.assigned_to ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, t.updated_at DESC"
      ).all(),
      db.prepare(
        "SELECT DISTINCT u.discord_user_id, u.username FROM panel_users u JOIN panel_user_roles ur ON ur.discord_user_id=u.discord_user_id JOIN panel_permissions p ON p.role_id=ur.role_id WHERE p.permission_key IN ('tickets.reply','tickets.assign') ORDER BY u.username"
      ).all(),
    ]);
    return NextResponse.json({ tickets: tickets.results, staff: staff.results });
  } catch (error) {
    console.error("[staff tickets] GET failed:", error);
    return NextResponse.json({ error: "Could not load the support queue." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermissionApi("tickets.assign");
  if ("response" in auth) return auth.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  let body: { ticketId?: unknown; status?: unknown; priority?: unknown; assignedTo?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const ticketId = typeof body.ticketId === "string" ? body.ticketId : "";
  if (!ticketId) return NextResponse.json({ error: "A ticket ID is required." }, { status: 400 });
  if (body.status !== undefined && (typeof body.status !== "string" || !STATUSES.has(body.status))) return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
  if (body.priority !== undefined && (typeof body.priority !== "string" || !PRIORITIES.has(body.priority))) return NextResponse.json({ error: "Invalid ticket priority." }, { status: 400 });
  if (body.assignedTo !== undefined && body.assignedTo !== null && typeof body.assignedTo !== "string") return NextResponse.json({ error: "Invalid assignee." }, { status: 400 });

  try {
    const db = getDatabase();
    const existing = await db.prepare("SELECT id, status, priority, assigned_to FROM tickets WHERE id=?").bind(ticketId).first<{id:string;status:string;priority:string;assigned_to:string|null}>();
    if (!existing) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    const status = typeof body.status === "string" ? body.status : existing.status;
    const priority = typeof body.priority === "string" ? body.priority : existing.priority;
    const assignedTo = body.assignedTo === undefined ? existing.assigned_to : body.assignedTo as string | null;
    if (assignedTo) {
      const eligible = await db.prepare("SELECT 1 AS ok FROM panel_users u JOIN panel_user_roles ur ON ur.discord_user_id=u.discord_user_id JOIN panel_permissions p ON p.role_id=ur.role_id WHERE u.discord_user_id=? AND p.permission_key IN ('tickets.reply','tickets.assign') LIMIT 1").bind(assignedTo).first();
      if (!eligible) return NextResponse.json({ error: "The selected member does not have a support ticket role." }, { status: 400 });
    }
    const statements = [
      db.prepare("UPDATE tickets SET status=?, priority=?, assigned_to=?, closed_at=CASE WHEN ?='closed' THEN COALESCE(closed_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ELSE NULL END, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(status, priority, assignedTo, status, ticketId),
      db.prepare("INSERT INTO audit_logs (id,actor_discord_id,action,target_type,target_id,metadata_json) VALUES (?,?, 'ticket.updated','ticket',?,?)").bind(crypto.randomUUID(), auth.session.userId, ticketId, JSON.stringify({ status, priority, assignedTo })),
    ];
    await db.batch(statements);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[staff tickets] PATCH failed:", error);
    return NextResponse.json({ error: "Could not update this ticket." }, { status: 500 });
  }
}
