"use client";

import { useEffect, useState } from "react";

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  discord_role_id: string | null;
  enabled: number;
}
interface DiscordRole { id: string; name: string; position: number; }

export function ApplicationSettings() {
  const [types, setTypes] = useState<ApplicationType[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/application-settings")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load settings.");
        if (!active) return;
        const applicationTypes = data.applicationTypes as ApplicationType[];
        setTypes(applicationTypes);
        setRoles(data.roles as DiscordRole[]);
        setSelections(Object.fromEntries(applicationTypes.map((type) => [type.id, type.discord_role_id ?? ""])));
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load settings."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(typeId: string) {
    const discordRoleId = selections[typeId];
    if (!discordRoleId) { setError("Choose a Discord role first."); return; }
    setSaving(typeId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/application-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationTypeId: typeId, discordRoleId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save role.");
      setTypes((current) => current.map((type) => type.id === typeId ? { ...type, discord_role_id: discordRoleId } : type));
      setMessage("Whitelist role saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save role.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="panel-card p-5 sm:p-6">
        <div className="eyebrow">Discord integration</div>
        <h2 className="mt-1 text-lg font-semibold text-white">Whitelist role assignment</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Choose the Discord role that should be granted when an application of each type is approved. The role is only added; existing member roles are kept.</p>
        <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100/90">
          Your Discord bot needs the <strong>Manage Roles</strong> permission, and its highest role must be above the whitelist role in Server Settings → Roles. Discord will reject the approval if either requirement is missing.
        </div>
      </div>

      {loading ? <div className="panel-card p-6 text-sm text-slate-400">Loading application types and Discord roles…</div> :
        types.length === 0 ? <div className="panel-card p-6 text-sm text-slate-400">No application types have been created yet.</div> :
        types.map((type) => {
          const currentRole = roles.find((role) => role.id === type.discord_role_id);
          return (
            <section key={type.id} className="panel-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{type.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{type.description}</p>
                </div>
                <span className={type.enabled ? "rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300" : "rounded-full bg-slate-400/10 px-3 py-1 text-xs text-slate-400"}>
                  {type.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <label htmlFor={"role-" + type.id} className="mt-5 block text-xs font-semibold text-slate-300">Discord whitelist role</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <select id={"role-" + type.id} value={selections[type.id] ?? ""} onChange={(event) => setSelections((current) => ({ ...current, [type.id]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1627] px-3 py-3 text-sm text-white outline-none focus:border-blue-400">
                  <option value="">Select a Discord role…</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
                <button onClick={() => save(type.id)} disabled={saving !== null || !selections[type.id]} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                  {saving === type.id ? "Saving…" : "Save role"}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {currentRole ? "Currently assigned: " + currentRole.name : type.discord_role_id ? "Saved role ID: " + type.discord_role_id + " (not present in the current role list)" : "No whitelist role configured yet."}
              </p>
            </section>
          );
        })}

      {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</p>}
    </div>
  );
}
