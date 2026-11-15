import { NextRequest, NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { getGuildId, getRoles } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePermissionApi("applications.manage");
  if ("response" in auth) return auth.response;
  try {
    const db = getDatabase();
    const [types, roles, setting] = await Promise.all([
      db.prepare("SELECT id, name, description, discord_role_id, discord_role_ids_json, enabled FROM application_types ORDER BY sort_order ASC, name ASC").all(),
      getRoles(),
      db.prepare("SELECT value FROM system_settings WHERE key = 'whitelist_applications_enabled'").first<{ value: string }>(),
    ]);
    return NextResponse.json({
      applicationTypes: types.results,
      applicationsEnabled: setting?.value !== "0",
      roles: roles.filter((role) => !role.managed && role.id !== getGuildId()).map((role) => ({ id: role.id, name: role.name, position: role.position })),
    });
  } catch (error) {
    console.error("[application settings] GET failed:", error);
    return NextResponse.json({ error: "Could not load application settings. Check the D1 migration and Discord bot connection." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermissionApi("applications.manage");
  if ("response" in auth) return auth.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  let body: { applicationTypeId?: unknown; discordRoleIds?: unknown; applicationsEnabled?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  try {
    const db = getDatabase();
    if (typeof body.applicationsEnabled === "boolean") {
      await db.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES ('whitelist_applications_enabled', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
        .bind(body.applicationsEnabled ? "1" : "0").run();
      await db.prepare("INSERT INTO panel_users (discord_user_id, username, avatar_hash) VALUES (?, ?, ?) ON CONFLICT(discord_user_id) DO UPDATE SET username = excluded.username, avatar_hash = excluded.avatar_hash, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'))")
        .bind(auth.session.userId, auth.session.username, auth.session.avatar).run();
      return NextResponse.json({ success: true, applicationsEnabled: body.applicationsEnabled });
    }

    if (typeof body.applicationTypeId !== "string" || !body.applicationTypeId.trim() || !Array.isArray(body.discordRoleIds) || !body.discordRoleIds.every((id) => typeof id === "string") || body.discordRoleIds.length > 20) {
      return NextResponse.json({ error: "Choose an application type and up to 20 Discord roles." }, { status: 400 });
    }
    const type = await db.prepare("SELECT id FROM application_types WHERE id = ?").bind(body.applicationTypeId).first<{ id: string }>();
    if (!type) return NextResponse.json({ error: "Application type not found." }, { status: 404 });
    const available = await getRoles();
    const selected = [...new Set(body.discordRoleIds as string[])];
    const invalid = selected.filter((id) => !available.some((role) => role.id === id && !role.managed && role.id !== getGuildId()));
    if (invalid.length) return NextResponse.json({ error: "One or more selected Discord roles are unavailable." }, { status: 400 });
    const primary = selected[0] ?? null;
    await db.prepare("UPDATE application_types SET discord_role_id = ?, discord_role_ids_json = ? WHERE id = ?")
      .bind(primary, JSON.stringify(selected), type.id).run();
    await db.prepare("INSERT INTO panel_users (discord_user_id, username, avatar_hash) VALUES (?, ?, ?) ON CONFLICT(discord_user_id) DO UPDATE SET username = excluded.username, avatar_hash = excluded.avatar_hash, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')")
      .bind(auth.session.userId, auth.session.username, auth.session.avatar).run();
    await db.prepare("INSERT INTO audit_logs (id, actor_discord_id, action, target_type, target_id, metadata_json) VALUES (?, ?, 'application.whitelist_roles_updated', 'application_type', ?, ?)")
      .bind(crypto.randomUUID(), auth.session.userId, type.id, JSON.stringify({ discordRoleIds: selected })).run();
    return NextResponse.json({ success: true, discordRoleIds: selected });
  } catch (error) {
    console.error("[application settings] PATCH failed:", error);
    return NextResponse.json({ error: "Could not save application settings." }, { status: 500 });
  }
}
