"use client";

import { useState } from "react";

export function ApplicationReviewActions({ applicationId, currentStatus }: { applicationId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const closed = ["approved", "rejected", "withdrawn"].includes(status);

  async function decide(nextStatus: "in_review" | "awaiting_information" | "approved" | "rejected") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status: nextStatus, reviewNotes: notes }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not update application.");
      setStatus(nextStatus);
      setMessage("Application updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 border-t border-white/[0.07] pt-5">
      <label className="mb-2 block text-xs font-semibold text-slate-300" htmlFor={applicationId + "-notes"}>Staff review notes</label>
      <textarea id={applicationId + "-notes"} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} rows={3} placeholder="Add feedback or a reason for your decision…" className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400" />
      {message && <p role="status" className="mt-2 text-xs text-slate-300">{message}</p>}
      {closed ? (
        <p className="mt-3 text-xs text-slate-500">This application is closed ({status.replace("_", " ")}).</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => decide("in_review")} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50">Mark in review</button>
          <button disabled={busy} onClick={() => decide("awaiting_information")} className="rounded-lg border border-amber-300/20 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-300/10 disabled:opacity-50">Request information</button>
          <button disabled={busy} onClick={() => decide("rejected")} className="rounded-lg border border-rose-300/20 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-300/10 disabled:opacity-50">Reject</button>
          <button disabled={busy} onClick={() => decide("approved")} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50">Approve</button>
        </div>
      )}
    </div>
  );
}
