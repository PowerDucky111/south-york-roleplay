"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string; ticket_number: number; subject: string; category: string; priority: string; status: string;
  owner_discord_id: string; owner_username: string | null; assigned_to: string | null; assignee_username: string | null;
  created_at: string; updated_at: string; message_count: number;
}
interface StaffMember { discord_user_id: string; username: string }

const statuses = ["open", "awaiting_staff", "awaiting_player", "resolved", "closed"];
const priorities = ["low", "normal", "high", "urgent"];

export function StaffTicketQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("active");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/tickets", { cache: "no-store" });
      const data = await response.json() as { tickets?: Ticket[]; staff?: StaffMember[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load tickets.");
      setTickets(data.tickets ?? []); setStaff(data.staff ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load tickets."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function update(ticket: Ticket, changes: { status?: string; priority?: string; assignedTo?: string | null }) {
    setSaving(ticket.id); setError("");
    try {
      const response = await fetch("/api/admin/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: ticket.id, ...changes }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not update ticket.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update ticket."); }
    finally { setSaving(""); }
  }

  const visible = tickets.filter(ticket => filter === "all" || (filter === "active" ? !["resolved", "closed"].includes(ticket.status) : ticket.status === filter));
  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-slate-400">{tickets.length} total support tickets</p></div>
        <select aria-label="Filter tickets" value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#101a2b] px-3 py-2 text-sm text-white">
          <option value="active">Active tickets</option><option value="all">All tickets</option>{statuses.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {loading ? <p className="text-sm text-slate-400">Loading support queue…</p> : visible.length ? (
        <div className="space-y-4">
          {visible.map(ticket => <article key={ticket.id} className="panel-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-semibold text-blue-300">Ticket #{ticket.ticket_number} · {ticket.category.replace("-"," ")}</p><h2 className="mt-1 text-lg font-semibold text-white">{ticket.subject}</h2><p className="mt-1 text-xs text-slate-500">Opened by {ticket.owner_username ?? ticket.owner_discord_id} · {ticket.message_count} messages · {new Date(ticket.created_at).toLocaleDateString("en-GB")}</p></div>
              {saving === ticket.id && <span className="text-xs text-slate-400">Saving…</span>}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-slate-400">Status<select disabled={saving===ticket.id} value={ticket.status} onChange={e=>void update(ticket,{status:e.target.value})} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0b1627] px-3 py-2 text-sm text-white">{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label>
              <label className="text-xs text-slate-400">Priority<select disabled={saving===ticket.id} value={ticket.priority} onChange={e=>void update(ticket,{priority:e.target.value})} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0b1627] px-3 py-2 text-sm text-white">{priorities.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
              <label className="text-xs text-slate-400">Assigned staff<select disabled={saving===ticket.id} value={ticket.assigned_to ?? ""} onChange={e=>void update(ticket,{assignedTo:e.target.value || null})} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0b1627] px-3 py-2 text-sm text-white"><option value="">Unassigned</option>{staff.map(person=><option key={person.discord_user_id} value={person.discord_user_id}>{person.username}</option>)}</select></label>
            </div>
          </article>)}
        </div>
      ) : <div className="panel-card p-8 text-center text-sm text-slate-400">No tickets match this filter.</div>}
    </div>
  );
}
