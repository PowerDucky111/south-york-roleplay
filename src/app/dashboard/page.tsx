import Link from "next/link";
import { requireAdminSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getGuild, getRoles, getBans, getMembers } from "@/lib/discord";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAdminSession();

  let guild = null;
  let roleCount = 0;
  let banCount = 0;
  let memberCount = 0;
  let error: string | null = null;

  try {
    const [g, roles, bans, members] = await Promise.all([
      getGuild(),
      getRoles(),
      getBans(),
      getMembers(),
    ]);
    guild = g;
    roleCount = roles.length;
    banCount = bans.length;
    memberCount =
      g.approximate_member_count ?? members.length;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load Discord data";
  }

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-discord-muted">
        {guild ? guild.name : "South York Roleplay"} — live server overview
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <strong>Discord API error:</strong> {error}
          <p className="mt-1 text-red-300/80">
            Check that your bot token is valid, the bot is in the server, and
            DISCORD_GUILD_ID is correct in your environment variables (.env.local locally, Netlify site settings when deployed).
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={memberCount.toLocaleString()} />
        <StatCard label="Roles" value={roleCount.toLocaleString()} />
        <StatCard label="Active Bans" value={banCount.toLocaleString()} />
        <StatCard
          label="Online (approx.)"
          value={(guild?.approximate_presence_count ?? 0).toLocaleString()}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink
          href="/members"
          title="Manage Members"
          body="Search members, assign roles, timeout, kick or ban."
        />
        <QuickLink
          href="/roles"
          title="Roles"
          body="View all server roles and how many members hold each."
        />
        <QuickLink
          href="/moderation"
          title="Moderation"
          body="Review banned users and lift bans when appropriate."
        />
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-discord-panel/60 p-5">
      <div className="text-sm text-discord-muted">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-white/5 bg-discord-panel/60 p-5 transition hover:border-discord-blurple/40 hover:bg-discord-hover"
    >
      <h3 className="font-semibold text-white group-hover:text-discord-blurple">
        {title}
      </h3>
      <p className="mt-1 text-sm text-discord-muted">{body}</p>
    </Link>
  );
}
