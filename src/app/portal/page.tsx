import Link from "next/link";
import { requireSession, isAdmin } from "@/lib/auth";
import { avatarUrl, type DiscordUser } from "@/lib/discord";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await requireSession();
  const staff = await isAdmin(session.userId);
  const user: DiscordUser = { id: session.userId, username: session.username, global_name: session.username, avatar: session.avatar, discriminator: "0" };

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white">SY</div>
            <div><div className="text-sm font-bold tracking-[0.12em] text-white">SOUTH YORK ROLEPLAY</div><div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Player portal</div></div>
          </Link>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl(user, 64)} alt="" className="h-9 w-9 rounded-full ring-2 ring-white/10"/>
            <div className="text-right"><div className="text-sm font-semibold text-white">{session.username}</div><div className="text-xs text-slate-500">Signed in with Discord</div></div>
            <form action="/api/auth/logout" method="post"><button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Sign out</button></form>
          </div>
        </header>
        <section className="mt-10"><div className="syrp-kicker">Member workspace</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Welcome, {session.username}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your South York Roleplay account, applications and support will be available here.</p></section>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <PortalCard title="My applications" description="Submit a community application and track its review status." icon="▤" state="Coming soon"/>
          <PortalCard title="Support tickets" description="Contact the team, reply to staff and follow your open requests." icon="◷" state="Coming soon"/>
          <PortalCard title="Community notices" description="Read important announcements, updates and planned events." icon="◈" state="Coming soon"/>
        </section>
        <section className="syrp-panel mt-6 rounded-2xl p-6"><div className="syrp-kicker">Getting started</div><h2 className="mt-1 text-lg font-semibold text-white">Your player portal is being prepared</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">You can now sign in using your Discord account. Application submissions, ticket conversations and published notices will be enabled as the portal features are added. No application or whitelist status has been created yet.</p>{staff && <Link href="/dashboard" className="mt-5 inline-flex rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">Open staff workspace →</Link>}</section>
      </div>
    </main>
  );
}

function PortalCard({ title, description, icon, state }: { title: string; description: string; icon: string; state: string }) {
  return <div className="syrp-panel rounded-2xl p-5"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-300">{icon}</div><span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-slate-500">{state}</span></div><h2 className="mt-5 text-base font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>;
}