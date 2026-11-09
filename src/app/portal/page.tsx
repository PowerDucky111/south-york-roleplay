import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

const shortcuts = [
  { href: "/portal/applications", number: "01", title: "My applications", description: "Apply to join the community and follow the progress of your submissions.", action: "View applications" },
  { href: "/portal/tickets", number: "02", title: "Support tickets", description: "Contact the team, ask a question or get help with an issue.", action: "Open support" },
];

export default async function PlayerPortalPage() {
  const session = await requireSession();

  return (
    <AppShell session={session} mode="player">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">Community portal / Overview</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Welcome back, {session.username}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your South York Roleplay account, applications and support — all in one place.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-2 text-xs font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Discord account connected
        </div>
      </div>

      <section className="mt-9 grid gap-4 sm:grid-cols-2">
        <div className="panel-card relative overflow-hidden p-6 sm:p-7">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-500/[0.08] blur-2xl" />
          <div className="relative">
            <div className="eyebrow">Your account</div>
            <div className="mt-3 text-xl font-semibold text-white">Community member</div>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">You are signed in with Discord. Use the portal to submit applications and contact the community team.</p>
          </div>
        </div>
        <div className="panel-card p-6 sm:p-7">
          <div className="eyebrow">Need a hand?</div>
          <div className="mt-3 text-xl font-semibold text-white">We're here to help.</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">Open a support request and the appropriate team will be able to pick it up.</p>
          <Link href="/portal/tickets" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200">Go to support <span aria-hidden>→</span></Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow">Get started</div>
            <h2 className="mt-2 text-lg font-semibold text-white">Your community tools</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {shortcuts.map((item) => (
            <Link key={item.href} href={item.href} className="panel-card group p-6 transition hover:-translate-y-0.5 hover:border-blue-400/25">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold tracking-widest text-blue-300">{item.number}</span>
                <span className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-300" aria-hidden>↗</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{item.description}</p>
              <div className="mt-5 text-xs font-semibold text-blue-300">{item.action} <span aria-hidden>→</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 panel-card p-6 sm:p-7">
        <div className="eyebrow">Community noticeboard</div>
        <h2 className="mt-2 text-lg font-semibold text-white">Stay in the loop</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Community announcements and event notices will appear here once the noticeboard editor is enabled for staff.</p>
        <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-slate-500">There are no published notices to display yet.</div>
      </section>
    </AppShell>
  );
}
