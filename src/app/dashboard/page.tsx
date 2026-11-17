import Link from "next/link";
import { requirePermissionSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getGuild, getRoles, getBans, getMembers } from "@/lib/discord";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requirePermissionSession("admin.access");

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
    { label: "Community members", value: memberCount.toLocaleString(), note: "Discord server", icon: "users" },
    { label: "Server roles", value: roleCount.toLocaleString(), note: "Configured roles", icon: "layers" },
    { label: "Active bans", value: banCount.toLocaleString(), note: "Current ban list", icon: "shield" },
    { label: "Online now", value: (guild?.approximate_presence_count ?? 0).toLocaleString(), note: "Approximate presence", icon: "activity" },
  ];

  return (
    <AppShell session={session}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">Staff workspace / Overview</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">{guild ? guild.name : "South York Roleplay"} · Community operations overview</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-2 text-xs font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Staff session active
        </div>
      </div>

      {error && (
        <div className="mt-7 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-4 text-sm text-rose-200">
          <strong>Discord API error:</strong> {error}
          <p className="mt-1 text-rose-200/70">Check that your bot token is valid, the bot is in the server, and DISCORD_GUILD_ID is correct in your Worker runtime variables.</p>
        </div>
      )}

      <section className="mt-9">
        <div className="mb-4">
          <div className="eyebrow">Live server snapshot</div>
          <h2 className="mt-1 text-lg font-semibold text-white">Community at a glance</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className="panel-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${index === 2 ? "bg-rose-400/10 text-rose-300" : "bg-blue-400/10 text-blue-300"}`}>
                  <StatIcon name={stat.icon} />
                </span>
              </div>
              <div className="mt-4 text-3xl font-bold tracking-tight text-white">{stat.value}</div>
              <div className="mt-1 text-xs text-slate-500">{stat.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="eyebrow">Management tools</div>
        <h2 className="mt-1 text-lg font-semibold text-white">Quick access</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <QuickLink href="/members" number="01" title="Discord members" body="Find community members, review accounts and manage server roles." />
          <QuickLink href="/settings/applications" number="04" title="Application settings" body="Choose which Discord role is granted when an application is approved." />
          <QuickLink href="/roles" number="02" title="Discord roles" body="Review the server's role structure and role membership." />
          <QuickLink href="/moderation" number="03" title="Moderation" body="Review bans and manage moderation actions." />
        </div>
      </section>

      <section className="mt-10 panel-card p-6 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow">Portal development</div>
            <h2 className="mt-1 text-lg font-semibold text-white">Community features are on the way</h2>
          </div>
          <span className="w-fit rounded-full border border-blue-400/15 bg-blue-400/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-200">Foundation stage</span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">The new player portal is in place. Application reviews, Discord whitelist-role automation, support tickets and panel-managed staff permissions are the next implementation stages.</p>
      </section>
    </AppShell>
  );
}

function StatIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    users: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M20 8v6M23 11h-6",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5",
    shield: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z",
    activity: "M3 12h4l3-8 4 16 3-8h4",
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={paths[name]} /></svg>;
}

function QuickLink({ href, number, title, body }: { href: string; number: string; title: string; body: string }) {
  return (
    <Link href={href} className="panel-card group p-5 transition hover:-translate-y-0.5 hover:border-blue-400/25">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest text-blue-300">{number}</span>
        <span className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-300" aria-hidden>↗</span>
      </div>
      <h3 className="mt-5 font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
    </Link>
  );
}
