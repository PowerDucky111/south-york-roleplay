import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const session = await requireSession();
  return (
    <AppShell session={session} mode="player">
      <div className="eyebrow">Community portal / Support</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Support tickets</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Get help from the South York Roleplay team and keep all your support conversations together.</p>
      <div className="mt-8 panel-card p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 5h16v11H8l-4 4zM8 9h8M8 12h5" /></svg>
        </div>
        <h2 className="mt-5 text-lg font-semibold text-white">Support centre is being set up</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">The ticket system will let you open a request, reply to staff, attach relevant details and track whether your ticket is open, awaiting your reply or resolved.</p>
        <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-xs leading-5 text-slate-400">Signed in as {session.username}. Your tickets will be linked to this Discord account.</div>
        <Link href="/portal" className="mt-6 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200">← Back to overview</Link>
      </div>
    </AppShell>
  );
}
