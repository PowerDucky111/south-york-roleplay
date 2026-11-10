import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { getRoles } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  try {
    const db = getDatabase();
    const [types, roles] = await Promise.all([
      db.prepare(
        "SELECT id, name, description, discord_role_id, enabled FROM application_types ORDER BY sort_order ASC, name ASC"
      ).all<{
        id: string; name: string; description: string;
        discord_role_id: string | null; enabled: number;
      }>(),
      getRoles(),
    ]);

    return NextResponse.json({
      applicationTypes: types.results,
      roles: roles
        .filter((role) => !role.managed && role.name !== "@everyone")
        .map((role) => ({ id: role.id, name: role.name, position: role.position })),
    });
  } catch (error) {
    console.error("[application settings] GET failed:", error);
    return NextResponse.json(
      { error: "Could not load application settings. Check the D1 database and Discord bot connection." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { applicationTypeId?: unknown; discordRoleId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.applicationTypeId !== "string" || !body.applicationTypeId.trim() ||
      typeof body.discordRoleId !== "string" || !body.discordRoleId.trim()) {
    return NextResponse.json({ error: "Choose an application type and a Discord role." }, { status: 400 });
  }

  try {
    const db = getDatabase();
    const type = await db.prepare("SELECT id FROM application_types WHERE id = ?")
      .bind(body.applicationTypeId).first<{ id: string }>();
    if (!type) return NextResponse.json({ error: "Application type not found." }, { status: 404 });

    const roles = await getRoles();
    const selectedRole = roles.find((role) => role.id === body.discordRoleId);
    if (!selectedRole || selectedRole.managed || selectedRole.name === "@everyone") {
      return NextResponse.json({ error: "That Discord role is not available for whitelist assignment." }, { status: 400 });
    }

    await db.prepare("UPDATE application_types SET discord_role_id = ? WHERE id = ?")
      .bind(selectedRole.id, type.id).run();

    await db.prepare(
      "INSERT INTO panel_users (discord_user_id, username, avatar_hash) VALUES (?, ?, ?) ON CONFLICT(discord_user_id) DO UPDATE SET username = excluded.username, avatar_hash = excluded.avatar_hash, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"
    ).bind(auth.session.userId, auth.session.username, auth.session.avatar).run();

    await db.prepare(
      "INSERT INTO audit_logs (id, actor_discord_id, action, target_type, target_id, metadata_json) VALUES (?, ?, 'application.whitelist_role_updated', 'application_type', ?, ?)"
    ).bind(crypto.randomUUID(), auth.session.userId, type.id, JSON.stringify({ discordRoleId: selectedRole.id, roleName: selectedRole.name })).run();

    return NextResponse.json({ success: true, role: { id: selectedRole.id, name: selectedRole.name } });
  } catch (error) {
    console.error("[application settings] PATCH failed:", error);
    return NextResponse.json({ error: "Could not save the whitelist role." }, { status: 500 });
  }
}
