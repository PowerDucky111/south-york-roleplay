import { getDatabase } from "@/lib/db";
import { updateMemberNickname, type DiscordUser } from "@/lib/discord";

export const MANAGEMENT_ROLE_ID = "1570946559372296202";

export function randomCallsign(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100 + (values[0] % 9900));
}

export function callsignNickname(callsign: string, displayName: string): string {
  const cleanName = displayName.replace(/^\[\d{3,4}\]\s*/, "").trim() || "Member";
  const prefix = `[${callsign}] `;
  return prefix + cleanName.slice(0, Math.max(0, 32 - prefix.length));
}

export async function ensureMemberCallsign(
  user: DiscordUser,
  displayName: string
): Promise<string> {
  const db = getDatabase();
  const existing = await db.prepare(
    "SELECT callsign FROM panel_users WHERE discord_user_id = ?"
  ).bind(user.id).first<{ callsign: string | null }>();
  if (existing?.callsign) return existing.callsign;

  for (let attempt = 0; attempt < 30; attempt++) {
    const callsign = randomCallsign();
    try {
      await db.prepare(
        `INSERT INTO panel_users (discord_user_id, username, avatar_hash, callsign)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(discord_user_id) DO UPDATE SET
           username = excluded.username,
           avatar_hash = excluded.avatar_hash,
           callsign = COALESCE(panel_users.callsign, excluded.callsign),
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`
      ).bind(user.id, user.global_name ?? user.username, user.avatar, callsign).run();
      const saved = await db.prepare(
        "SELECT callsign FROM panel_users WHERE discord_user_id = ?"
      ).bind(user.id).first<{ callsign: string | null }>();
      if (saved?.callsign) return saved.callsign;
    } catch (error) {
      // A callsign collision is safe to retry because the D1 index is unique.
      if (attempt === 29) throw error;
    }
  }
  throw new Error("Could not allocate a unique callsign after several attempts.");
}

export async function syncMemberNickname(
  userId: string,
  callsign: string,
  displayName: string
): Promise<void> {
  await updateMemberNickname(userId, callsignNickname(callsign, displayName));
}

export async function getCallsignMap(): Promise<Record<string, string>> {
  const result = await getDatabase().prepare(
    "SELECT discord_user_id, callsign FROM panel_users WHERE callsign IS NOT NULL"
  ).all<{ discord_user_id: string; callsign: string }>();
  return Object.fromEntries(result.results.map((row) => [row.discord_user_id, row.callsign]));
}
