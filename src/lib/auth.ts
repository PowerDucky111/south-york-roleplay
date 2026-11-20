import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";
import { getGuild, getMember } from "./discord";
import { getDatabase } from "./db";

export const MANAGEMENT_ROLE_ID = "1570946559372296202";

export async function hasManagementRole(userId: string): Promise<boolean> {
  try {
    const member = await getMember(userId);
    return member.roles.includes(MANAGEMENT_ROLE_ID);
  } catch (error) {
    console.error(`[auth] Management role check failed for ${userId}:`, error);
    return false;
  }
}

const PERMISSION_ADMINISTRATOR = 1n << 3n;
const PERMISSION_MANAGE_GUILD = 1n << 5n;

function envAdminIds(): string[] {
  return (process.env.ADMIN_DISCORD_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
}

// Break-glass owner access, retained to prevent accidental lockout.
export function isBootstrapAdmin(userId: string): boolean {
  return envAdminIds().includes(userId);
}

// Legacy Discord-based check for routes not yet migrated.
export async function isAdmin(userId: string): Promise<boolean> {
  if (isBootstrapAdmin(userId) || await hasManagementRole(userId)) return true;
  try {
    const guild = await getGuild();
    if (guild.owner_id === userId) return true;
    const member = await getMember(userId);
    const perms = BigInt(member.permissions ?? "0");
    return (perms & PERMISSION_ADMINISTRATOR) !== 0n || (perms & PERMISSION_MANAGE_GUILD) !== 0n;
  } catch (err) {
    console.error(`[auth] isAdmin check failed for ${userId}:`, err);
    return false;
  }
}

// D1 is the primary source of panel permissions. The Discord management-role
// fallback is intentionally retained during migration so existing managers
// do not lose access before their D1 assignments have been verified.
export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  if (isBootstrapAdmin(userId)) return true;

  try {
    const result = await getDatabase().prepare(
      "SELECT 1 AS allowed FROM panel_user_roles ur JOIN panel_permissions p ON p.role_id = ur.role_id WHERE ur.discord_user_id = ? AND p.permission_key = ? LIMIT 1"
    ).bind(userId, permissionKey).first<{ allowed: number }>();
    if (result) return true;
  } catch (error) {
    console.error(`[auth] D1 permission check failed for ${userId} (${permissionKey}):`, error);
  }

  // Temporary compatibility path for existing Discord management-role holders.
  return hasManagementRole(userId);
}

export async function requirePermissionSession(permissionKey: string): Promise<SessionPayload> {
  const session = await requireSession();
  if (!(await hasPermission(session.userId, permissionKey))) redirect("/");
  return session;
}

export async function requirePermissionApi(permissionKey: string): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { response: NextResponse.json({ error: "Not logged in" }, { status: 401 }) };
  if (!(await hasPermission(session.userId, permissionKey))) {
    return { response: NextResponse.json({ error: "Forbidden: this panel permission is required." }, { status: 403 }) };
  }
  return { session };
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/");
  return session as SessionPayload;
}

// Legacy guard for routes still using the old Discord admin check.
export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!(await isAdmin(session.userId))) redirect("/");
  return session;
}

export async function requireAdminApi(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { response: NextResponse.json({ error: "Not logged in" }, { status: 401 }) };
  if (!(await isAdmin(session.userId))) {
    return { response: NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 }) };
  }
  return { session };
}
