// Central place for all Discord API calls.
// Uses the bot token for server data and the user's OAuth token for "who am I".

const DISCORD_API = "https://discord.com/api/v10";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Set it in .env.local locally, or in the Netlify environment variables when deployed.`);
  }
  return value;
}

export function getGuildId(): string {
  return requireEnv("DISCORD_GUILD_ID");
}

// ---------- Bot-authenticated requests (server data) ----------

async function botFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${requireEnv("DISCORD_BOT_TOKEN")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API error ${res.status} on ${path}: ${body}`);
  }

  // Some endpoints (e.g. role updates) return 204 No Content.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Types ----------

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator: string;
  bot?: boolean;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  mentionable: boolean;
  icon?: string | null;
}

export interface GuildMember {
  user?: DiscordUser;
  nick: string | null;
  roles: string[];
  joined_at: string;
  pending: boolean;
  communication_disabled_until: string | null;
  deaf: boolean;
  mute: boolean;
  // Bitfield string returned by GET /guilds/{id}/members/{id}
  permissions?: string;
}

export interface Ban {
  user: DiscordUser;
  reason: string | null;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

// ---------- Guild / roles / members / bans ----------

export async function getGuild(): Promise<Guild> {
  return botFetch<Guild>(`/guilds/${getGuildId()}`);
}

export async function getRoles(): Promise<DiscordRole[]> {
  const roles = await botFetch<DiscordRole[]>(`/guilds/${getGuildId()}/roles`);
  // Highest position first — matches Discord's UI ordering.
  return roles.sort((a, b) => b.position - a.position);
}

// Fetches ALL members, paginating 1000 at a time (Discord's max page size).
export async function getMembers(): Promise<GuildMember[]> {
  const all: GuildMember[] = [];
  let after = "0";

  // Safety cap of 25 pages (25,000 members) to avoid infinite loops.
  for (let i = 0; i < 25; i++) {
    const page = await botFetch<GuildMember[]>(
      `/guilds/${getGuildId()}/members?limit=1000&after=${after}`
    );
    if (page.length === 0) break;
    all.push(...page);
    after = page[page.length - 1].user?.id ?? after;
    if (page.length < 1000) break;
  }

  return all;
}

export async function getBans(): Promise<Ban[]> {
  return botFetch<Ban[]>(`/guilds/${getGuildId()}/bans?limit=1000`);
}

export async function getMember(userId: string): Promise<GuildMember> {
  return botFetch<GuildMember>(`/guilds/${getGuildId()}/members/${userId}`);
}

// ---------- Moderation actions ----------

export async function updateMemberRoles(userId: string, roleIds: string[]): Promise<void> {
  await botFetch(`/guilds/${getGuildId()}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ roles: roleIds }),
  });
}

export async function kickMember(userId: string): Promise<void> {
  await botFetch(`/guilds/${getGuildId()}/members/${userId}`, { method: "DELETE" });
}

export async function banMember(userId: string, deleteMessageSeconds = 0): Promise<void> {
  await botFetch(`/guilds/${getGuildId()}/bans/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ delete_message_seconds: deleteMessageSeconds }),
  });
}

export async function unbanMember(userId: string): Promise<void> {
  await botFetch(`/guilds/${getGuildId()}/bans/${userId}`, { method: "DELETE" });
}

export async function timeoutMember(userId: string, untilIso: string | null): Promise<void> {
  await botFetch(`/guilds/${getGuildId()}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ communication_disabled_until: untilIso }),
  });
}

// ---------- Direct messages ----------

interface DMChannel {
  id: string;
}

// Opens (or reuses) the bot's DM channel with a user.
export async function createDMChannel(userId: string): Promise<string> {
  const channel = await botFetch<DMChannel>(`/users/@me/channels`, {
    method: "POST",
    body: JSON.stringify({ recipient_id: userId }),
  });
  return channel.id;
}

export async function sendDM(userId: string, content: string): Promise<void> {
  const channelId = await createDMChannel(userId);
  await botFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export interface DMEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export async function sendDMEmbed(userId: string, embed: DMEmbed): Promise<void> {
  const channelId = await createDMChannel(userId);
  await botFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ embeds: [embed] }),
  });
}

// ---------- Helpers ----------

export function avatarUrl(user: DiscordUser | undefined, size = 128): string {
  if (!user) return "";
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
  }
  // Default avatar based on user ID (new username system).
  const index = Number(BigInt(user.id) >> 22n) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export function displayName(member: GuildMember): string {
  if (member.nick) return member.nick;
  if (member.user?.global_name) return member.user.global_name;
  return member.user?.username ?? "Unknown";
}

export function tag(user: DiscordUser | undefined): string {
  if (!user) return "";
  return user.discriminator && user.discriminator !== "0"
    ? `${user.username}#${user.discriminator}`
    : `@${user.username}`;
}

export function roleColor(role: DiscordRole): string {
  return role.color ? `#${role.color.toString(16).padStart(6, "0")}` : "#949ba4";
}
