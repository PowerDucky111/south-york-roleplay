"use client";

import { FormEvent, useEffect, useState } from "react";

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  awaiting_staff: "Awaiting staff",
  awaiting_player: "Your reply needed",
  resolved: "Resolved",
  closed: "Closed",
};

export function PlayerTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadTickets() {
    setLoading(true);
    try {
      const response = await fetch("/api/tickets", { cache: "no-store" });
      const data = await response.json() as { tickets?: Ticket[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load tickets.");
      setTickets(data.tickets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTickets(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not create ticket.");
      setSubject("");
      setCategory("general");
      setMessage("");
      setNotice("Your support ticket has been created.");
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <section className="panel-card p-6 sm:p-7">
        <div className="eyebrow">Your requests</div>
        <h2 className="mt-2 text-lg font-semibold text-white">Ticket history</h2>
        {loading ? (
          <p className="mt-5 text-sm text-slate-400">Loading your tickets…</p>
        ) : tickets.length ? (
          <div className="mt-5 space-y-3">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-300">Ticket #{ticket.ticket_number}</p>
                    <h3 className="mt-1 font-semibold text-white">{ticket.subject}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">{STATUS_LABELS[ticket.status] ?? ticket.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{ticket.category.replace("-", " ")}</span>
                  <span>{ticket.message_count} message{ticket.message_count === 1 ? "" : "s"}</span>
                  <span>Updated {new Date(ticket.updated_at).toLocaleDateString("en-GB")}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-slate-400">You haven't opened a support ticket yet. If you need help, use the form alongside this panel.</div>
        )}
      </section>

      <section className="panel-card p-6 sm:p-7">
        <div className="eyebrow">Contact the team</div>
        <h2 className="mt-2 text-lg font-semibold text-white">Open a support ticket</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Describe the issue clearly so the right team can help you.</p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="ticket-subject" className="mb-2 block text-sm font-medium text-slate-200">Subject</label>
            <input id="ticket-subject" required minLength={5} maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What do you need help with?" className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm text-white outline-none focus:border-blue-400" />
          </div>
          <div>
            <label htmlFor="ticket-category" className="mb-2 block text-sm font-medium text-slate-200">Category</label>
            <select id="ticket-category" value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm text-white outline-none focus:border-blue-400">
              <option value="general">General support</option>
              <option value="technical">Technical issue</option>
              <option value="whitelist">Whitelist / application</option>
              <option value="player-report">Player report</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="ticket-message" className="mb-2 block text-sm font-medium text-slate-200">Details</label>
            <textarea id="ticket-message" required minLength={10} maxLength={5000} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Explain what happened and include any useful details…" className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-blue-400" />
          </div>
          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}
          <button type="submit" disabled={submitting} className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Creating ticket…" : "Create support ticket"}</button>
        </form>
      </section>
    </div>
  );
}
