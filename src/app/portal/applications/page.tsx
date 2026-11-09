import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await requireSession();
  return (
    <AppShell session={session} mode="player">
      <div className="eyebrow">Community portal / Applications</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">My applications</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Submit an application and keep track of its review status from your account.</p>
      <div className="mt-8 panel-card p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 4h8l4 4v12H4V4zM8 4v5h8V4M8 14h8M8 17h5" /></svg>
        </div>
        <h2 className="mt-5 text-lg font-semibold text-white">Applications are being set up</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">The application system is part of the next build stage. It will support configurable application forms, review decisions, feedback and automatic Discord whitelist roles when an application is approved.</p>
        <div className="mt-5 rounded-xl border border-blue-400/15 bg-blue-400/[0.06] p-4 text-xs leading-5 text-blue-100/80">Your Discord account is connected as {session.username}. You do not need to create another account.</div>
        <Link href="/portal" className="mt-6 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200">← Back to overview</Link>
      </div>
    </AppShell>
  );
}
