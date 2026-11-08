"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { avatarUrl, tag, type Ban } from "@/lib/discord";

export function BansTable({ bans }: { bans: Ban[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function unban(userId: string, username: string) {
    setBusyId(userId);
    setToast(null);
    try {
      const res = await fetch(`/api/bans/${userId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast(data.error ?? "Failed to unban user");
      } else {
        setToast(`${username} has been unbanned`);
        router.refresh();
      }
    } catch {
      setToast("Network error — please try again");
    } finally {
      setBusyId(null);
    }
  }

  if (bans.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/5 bg-discord-panel/40 px-4 py-10 text-center text-sm text-discord-muted">
        No banned users. Nice and clean.
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {toast}
        </div>
      )}
      <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-discord-panel/80 text-xs uppercase tracking-wide text-discord-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Reason</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bans.map((b) => (
              <tr key={b.user.id} className="bg-discord-dark/40 hover:bg-discord-hover/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl(b.user, 64)}
                      alt=""
                      className="h-9 w-9 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-white">
                        {b.user.global_name ?? b.user.username}
                      </div>
                      <div className="text-xs text-discord-muted">{tag(b.user)}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-discord-muted md:table-cell">
                  {b.reason ?? "No reason given"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => unban(b.user.id, b.user.username)}
                    disabled={busyId === b.user.id}
                    className="rounded-md px-3 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
                  >
                    {busyId === b.user.id ? "Unbanning…" : "Unban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
