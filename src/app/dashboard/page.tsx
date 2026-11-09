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
      getGuild(), getRoles(), getBans(), getMembers(),
    ]);
    guild = g;
    roleCount = roles.length;
    banCount = bans.length;
    memberCount = g.approximate_member_count ?? members.length;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load Discord data";
  }

  const stats = [
    { label: "Community members", value: memberCount.toLocaleString(), detail: "Discord server", icon: "users" },
    { label: "Discord roles", value: roleCount.toLocaleString(), detail: "Configured roles", icon: "layers" },
    { label: "Active bans", value: banCount.toLocaleString(), detail: "Current server bans", icon: "shield" },
    { label: "Online now", value: (guild?.approximate_presence_count ?? 0).toLocaleString(), detail: "Approximate presence", icon: "activity" },
  ];

  return (
    <AppShell session={session}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="syrp-kicker">Workspace / Overview</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Good to see you, {session.username}</h1>
          <p className="mt-2 text-sm text-slate-400">{guild ? guild.name : "South York Roleplay"} · Community operations overview</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs text-slate-400">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Admin workspace
        </div>
      </div>

      {error && (
        <div className="mt-7 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-200">
          <strong>Discord connection issue:</strong> {error}
          <p className="mt-1 text-amber-100/70">Check the bot token, bot membership and DISCORD_GUILD_ID in your Worker runtime variables.</p>
        </div>
      )}

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="syrp-panel rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-400">{stat.label}</div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-300/10 bg-blue-400/[0.08] text-blue-300">
                <StatIcon name={stat.icon} />
              </div>
            </div>
            <div className="mt-5 text-3xl font-bold tracking-tight text-white">{stat.value}</div>
            <div className="mt-1 text-xs text-slate-500">{stat.detail}</div>
          </div>
        ))}
      </section>

      <section className="mt-9 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="syrp-panel rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="syrp-kicker">Quick access</div>
              <h2 className="mt-1 text-lg font-semibold text-white">Community administration</h2>
            </div>
            <span className="rounded-lg border border-white/[0.07] px-2.5 py-1 text-[11px] text-slate-500">Staff tools</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickLink href="/members" icon="users" title="Member management" body="Find members and manage their Discord access." />
            <QuickLink href="/roles" icon="layers" title="Discord roles" body="Review server roles and role assignments." />
            <QuickLink href="/moderation" icon="shield" title="Moderation centre" body="Review bans and take moderation action." />
            <div className="rounded-xl border border-dashed border-white/[0.12] bg-white/[0.015] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500/10 text-slate-400"><StatIcon name="clipboard" /></div>
              <div className="mt-3 text-sm font-semibold text-slate-200">Applications & tickets</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Coming in the next portal build phase.</p>
            </div>
          </div>
        </div>

        <div className="syrp-panel rounded-2xl p-6">
          <div className="syrp-kicker">Platform roadmap</div>
          <h2 className="mt-1 text-lg font-semibold text-white">What we're building</h2>
          <div className="mt-5 space-y-4">
            <RoadmapItem title="Community portal" detail="Player accounts and notices" state="In progress" />
            <RoadmapItem title="Applications" detail="Review queues and Discord whitelist role" state="Planned" />
            <RoadmapItem title="Support desk" detail="Player tickets and staff assignment" state="Planned" />
            <RoadmapItem title="Panel permissions" detail="Roles managed inside the portal" state="Planned" />
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function QuickLink({ href, icon, title, body }: { href: string; icon: string; title: string; body: string }) {
  return (
    <Link href={href} className="group rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-blue-400/25 hover:bg-blue-500/[0.05]">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300"><StatIcon name={icon} /></div>
      <h3 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-blue-200">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
    </Link>
  );
}

function RoadmapItem({ title, detail, state }: { title: string; detail: string; state: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div><div className="text-sm font-medium text-slate-200">{title}</div><div className="mt-0.5 text-xs text-slate-500">{detail}</div></div>
      <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[10px] text-slate-400">{state}</span>
    </div>
  );
}

function StatIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    users: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m16 0h4v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8zm8-7.87a4 4 0 010 7.75",
    layers: "M12 3L3 8l9 5 9-5-9-5zm-9 9l9 5 9-5M3 16l9 5 9-5",
    shield: "M12 3l8 4v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7l8-4z",
    activity: "M3 12h4l3-8 4 16 3-8h4",
    clipboard: "M9 5h6m-6 4h6m-6 4h6m-9 8h18V3H3v18z",
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.activity} /></svg>;
}
