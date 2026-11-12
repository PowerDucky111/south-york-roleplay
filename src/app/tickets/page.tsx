import { requirePermissionSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { StaffTicketQueue } from "@/components/staff-ticket-queue";

export const dynamic = "force-dynamic";

export default async function StaffTicketsPage() {
  const session = await requirePermissionSession("tickets.view_queue");
  return (
    <AppShell session={session}>
      <div className="eyebrow">Staff workspace / Support</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Support tickets</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Review player requests, assign ownership and keep the support queue moving.</p>
      <StaffTicketQueue />
    </AppShell>
  );
}
