import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PlayerTickets } from "@/components/player-tickets";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const session = await requireSession();
  return (
    <AppShell session={session} mode="player">
      <div className="eyebrow">Community portal / Support</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Support tickets</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Get help from the South York Roleplay team and keep your support conversations together.</p>
      <PlayerTickets />
    </AppShell>
  );
}
