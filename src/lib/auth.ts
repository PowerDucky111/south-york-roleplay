import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";
import { getGuild, getMember } from "./discord";

// Discord permission bits we care about.
const PERMISSION_ADMINISTRATOR = 1n << 3n;
const PERMISSION_MANAGE_GUILD = 1n << 5n;

function envAdminIds(): string[] {
  return (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

// Returns true if this Discord user is allowed into the CMS.
// Admin = listed in ADMIN_DISCORD_IDS, guild owner, or has
// Administrator / Manage Server permission in the guild.
export async function isAdmin(userId: string): Promise<boolean> {
  if (envAdminIds().includes(userId)) return true;

  try {
    const guild = await getGuild();
    if (guild.owner_id === userId) return true;

    const member = await getMember(userId);
    const perms = BigInt(member.permissions ?? "0");
    return (perms & PERMISSION_ADMINISTRATOR) !== 0n || (perms & PERMISSION_MANAGE_GUILD) !== 0n;
  } catch (err) {
    // User isn't in the guild or bot can't see them -> not admin.
    // Log so the reason is visible in the dev server console.
    console.error(`[auth] isAdmin check failed for ${userId}:`, err);
    return false;
  }
}

// For server components / pages: returns the session or redirects to login.
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }
  return session as SessionPayload;
}

// For server components: returns session only if admin, else redirects home.
export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!(await isAdmin(session.userId))) redirect("/");
  return session;
}

// For API routes: returns session or a 401/403 JSON response.
export async function requireAdminApi(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Not logged in" }, { status: 401 }) };
  }
  if (!(await isAdmin(session.userId))) {
    return { response: NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 }) };
  }
  return { session };
}
