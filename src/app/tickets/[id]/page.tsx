import { requirePermissionSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { StaffTicketDetail } from "@/components/staff-ticket-detail";

export const dynamic = "force-dynamic";

export default async function StaffTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermissionSession("tickets.view_queue");
  const { id } = await params;
  return (
    <AppShell session={session}>
      <div className="eyebrow">Staff workspace / Support / Ticket</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Ticket conversation</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Read the player's request, reply to them or leave an internal staff note.</p>
      <StaffTicketDetail ticketId={id} />
    </AppShell>
  );
}
