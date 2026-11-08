"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  avatarUrl,
  displayName,
  roleColor,
  tag,
  type DiscordRole,
  type GuildMember,
} from "@/lib/discord";
import { cn, formatDate } from "@/lib/utils";

type ModalState =
  | { type: "roles"; member: GuildMember }
  | { type: "timeout"; member: GuildMember }
  | { type: "kick"; member: GuildMember }
  | { type: "ban"; member: GuildMember }
  | null;

export function MemberTable({
  members,
  roles,
  currentUserId,
}: {
  members: GuildMember[];
  roles: DiscordRole[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const roleMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  // Roles a member can be assigned: exclude managed roles (bots/integrations)
  // and the @everyone role (position 0, id === guild id).
  const assignableRoles = useMemo(
    () => roles.filter((r) => !r.managed && r.name !== "@everyone"),
    [roles]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && !m.roles.includes(roleFilter)) return false;
      if (!q) return true;
      const name = displayName(m).toLowerCase();
      const username = (m.user?.username ?? "").toLowerCase();
      const nick = (m.nick ?? "").toLowerCase();
      return name.includes(q) || username.includes(q) || nick.includes(q);
    });
  }, [members, query, roleFilter]);

  async function runAction(key: string, fn: () => Promise<Response>, successMsg: string) {
    setBusy(key);
    setToast(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast(data.error ?? "Action failed");
      } else {
        setToast(successMsg);
        setModal(null);
        router.refresh();
      }
    } catch {
      setToast("Network error — please try again");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or nickname…"
          className="w-full rounded-lg border border-white/10 bg-discord-panel px-4 py-2 text-sm text-white placeholder:text-discord-muted focus:border-discord-blurple focus:outline-none sm:max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-discord-panel px-4 py-2 text-sm text-white focus:border-discord-blurple focus:outline-none"
        >
          <option value="all">All roles</option>
          {assignableRoles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="text-sm text-discord-muted sm:ml-auto sm:self-center">
          {filtered.length} of {members.length} members
        </div>
      </div>

      {toast && (
        <div
          className={cn(
            "mt-4 rounded-lg border px-4 py-2 text-sm",
            toast.includes("fail") || toast.includes("error") || toast.includes("cannot")
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          )}
        >
          {toast}
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-discord-panel/80 text-xs uppercase tracking-wide text-discord-muted">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Roles</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.slice(0, 200).map((m) => {
              const userId = m.user?.id ?? "";
              const isSelf = userId === currentUserId;
              const timedOut =
                m.communication_disabled_until &&
                new Date(m.communication_disabled_until) > new Date();
              const memberRoles = m.roles
                .map((id) => roleMap.get(id))
                .filter((r): r is DiscordRole => Boolean(r));

              return (
                <tr key={userId} className="bg-discord-dark/40 hover:bg-discord-hover/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl(m.user, 64)}
                        alt=""
                        className="h-9 w-9 rounded-full"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">
                          {displayName(m)}
                          {isSelf && (
                            <span className="ml-2 rounded bg-discord-blurple/20 px-1.5 py-0.5 text-[10px] font-semibold text-discord-blurple">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-discord-muted">
                          {tag(m.user)}
                          {m.user?.bot && " · bot"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex max-w-[280px] flex-wrap gap-1">
                      {memberRoles.slice(0, 4).map((r) => (
                        <span
                          key={r.id}
                          className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                          style={{
                            backgroundColor: `${roleColor(r)}22`,
                            color: roleColor(r),
                          }}
                        >
                          {r.name}
                        </span>
                      ))}
                      {memberRoles.length > 4 && (
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-discord-muted">
                          +{memberRoles.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-discord-muted lg:table-cell">
                    {formatDate(m.joined_at)}
                  </td>
                  <td className="px-4 py-3">
                    {timedOut ? (
                      <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                        Timed out
                      </span>
                    ) : m.pending ? (
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-discord-muted">
                        Pending
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <ActionButton
                        label="Roles"
                        onClick={() => setModal({ type: "roles", member: m })}
                        disabled={isSelf}
                      />
                      <ActionButton
                        label="Timeout"
                        onClick={() => setModal({ type: "timeout", member: m })}
                        disabled={isSelf}
                      />
                      <ActionButton
                        label="Kick"
                        danger
                        onClick={() => setModal({ type: "kick", member: m })}
                        disabled={isSelf}
                      />
                      <ActionButton
                        label="Ban"
                        danger
                        onClick={() => setModal({ type: "ban", member: m })}
                        disabled={isSelf}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-discord-muted">
            No members match your search.
          </div>
        )}
        {filtered.length > 200 && (
          <div className="border-t border-white/5 px-4 py-3 text-center text-xs text-discord-muted">
            Showing first 200 of {filtered.length} results — refine your search to narrow it down.
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "roles" && (
        <RoleEditorModal
          member={modal.member}
          roles={assignableRoles}
          roleMap={roleMap}
          busy={busy === `roles-${modal.member.user?.id}`}
          onClose={() => setModal(null)}
          onSave={(roleIds) => {
            const id = modal.member.user?.id ?? "";
            runAction(
              `roles-${id}`,
              () =>
                fetch(`/api/members/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ roles: roleIds }),
                }),
              `Roles updated for ${displayName(modal.member)}`
            );
          }}
        />
      )}

      {modal?.type === "timeout" && (
        <TimeoutModal
          member={modal.member}
          busy={busy === `timeout-${modal.member.user?.id}`}
          onClose={() => setModal(null)}
          onSubmit={(minutes) => {
            const id = modal.member.user?.id ?? "";
            runAction(
              `timeout-${id}`,
              () =>
                fetch(`/api/members/${id}/timeout`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ durationMinutes: minutes }),
                }),
              minutes === 0
                ? `Timeout removed for ${displayName(modal.member)}`
                : `Timeout applied to ${displayName(modal.member)}`
            );
          }}
        />
      )}

      {modal?.type === "kick" && (
        <ConfirmModal
          title={`Kick ${displayName(modal.member)}?`}
          body="They will be removed from the server but can rejoin."
          confirmLabel="Kick member"
          busy={busy === `kick-${modal.member.user?.id}`}
          onClose={() => setModal(null)}
          onConfirm={() => {
            const id = modal.member.user?.id ?? "";
            runAction(
              `kick-${id}`,
              () => fetch(`/api/members/${id}/kick`, { method: "POST" }),
              `${displayName(modal.member)} has been kicked`
            );
          }}
        />
      )}

      {modal?.type === "ban" && (
        <BanModal
          member={modal.member}
          busy={busy === `ban-${modal.member.user?.id}`}
          onClose={() => setModal(null)}
          onConfirm={(reason) => {
            const id = modal.member.user?.id ?? "";
            runAction(
              `ban-${id}`,
              () =>
                fetch(`/api/members/${id}/ban`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    deleteMessageSeconds: 86400,
                    reason: reason || null,
                  }),
                }),
              `${displayName(modal.member)} has been banned`
            );
          }}
        />
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition",
        disabled
          ? "cursor-not-allowed text-discord-muted/40"
          : danger
            ? "text-red-400 hover:bg-red-500/10"
            : "text-discord-muted hover:bg-discord-hover hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-discord-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function RoleEditorModal({
  member,
  roles,
  roleMap,
  busy,
  onClose,
  onSave,
}: {
  member: GuildMember;
  roles: DiscordRole[];
  roleMap: Map<string, DiscordRole>;
  busy: boolean;
  onClose: () => void;
  onSave: (roleIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(member.roles));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal title={`Roles — ${displayName(member)}`} onClose={onClose}>
      <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {roles.map((r) => {
          const checked = selected.has(r.id);
          return (
            <label
              key={r.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-discord-hover",
                checked && "bg-discord-hover"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(r.id)}
                className="h-4 w-4 accent-discord-blurple"
              />
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: roleColor(r) }}
              />
              <span className="text-sm text-white">{r.name}</span>
              {roleMap.get(r.id)?.managed && (
                <span className="ml-auto text-[10px] uppercase text-discord-muted">
                  managed
                </span>
              )}
            </label>
          );
        })}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-discord-muted hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave([...selected])}
          disabled={busy}
          className="rounded-lg bg-discord-blurple px-4 py-2 text-sm font-semibold text-white hover:bg-[#4752c4] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save roles"}
        </button>
      </div>
    </Modal>
  );
}

function TimeoutModal({
  member,
  busy,
  onClose,
  onSubmit,
}: {
  member: GuildMember;
  busy: boolean;
  onClose: () => void;
  onSubmit: (minutes: number) => void;
}) {
  const [minutes, setMinutes] = useState("60");

  return (
    <Modal title={`Timeout — ${displayName(member)}`} onClose={onClose}>
      <p className="text-sm text-discord-muted">
        Prevents the member from sending messages or joining voice channels.
        Maximum is 28 days (40320 minutes).
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={40320}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-32 rounded-lg border border-white/10 bg-discord-dark px-3 py-2 text-sm text-white focus:border-discord-blurple focus:outline-none"
        />
        <span className="text-sm text-discord-muted">minutes</span>
      </div>
      <div className="mt-5 flex justify-between gap-2">
        <button
          onClick={() => onSubmit(0)}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
        >
          Remove timeout
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-discord-muted hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(Math.min(Number(minutes) || 0, 40320))}
            disabled={busy || !(Number(minutes) > 0)}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {busy ? "Applying…" : "Apply timeout"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-discord-muted">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-discord-muted hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function BanModal({
  member,
  busy,
  onClose,
  onConfirm,
}: {
  member: GuildMember;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Modal title={`Ban ${displayName(member)}?`} onClose={onClose}>
      <p className="text-sm text-discord-muted">
        They will be banned from the server, unable to rejoin, and their
        messages from the last 24 hours will be deleted. They will receive a DM
        explaining the action.
      </p>
      <div className="mt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-discord-muted">
          Reason (optional — included in the DM)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={512}
          placeholder="e.g. Repeated rule violations in #general"
          className="mt-1.5 w-full rounded-lg border border-white/10 bg-discord-dark px-3 py-2 text-sm text-white placeholder:text-discord-muted/60 focus:border-discord-blurple focus:outline-none"
        />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-discord-muted hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(reason.trim())}
          disabled={busy}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
        >
          {busy ? "Banning…" : "Ban member"}
        </button>
      </div>
    </Modal>
  );
}
