"use client";

import { useEffect, useState } from "react";

interface ApplicationType {
  id: string; name: string; description: string; discord_role_id: string | null;
  discord_role_ids_json: string; enabled: number;
}
interface DiscordRole { id: string; name: string; position: number; }

export function ApplicationSettings() {
  const [types, setTypes] = useState<ApplicationType[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [applicationsEnabled, setApplicationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toggleSaving, setToggleSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/application-settings").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load settings.");
      if (!active) return;
      const applicationTypes = data.applicationTypes as ApplicationType[];
      setTypes(applicationTypes);
      setRoles(data.roles as DiscordRole[]);
      setApplicationsEnabled(data.applicationsEnabled !== false);
      setSelections(Object.fromEntries(applicationTypes.map((type) => {
        let ids: string[] = [];
        try { ids = JSON.parse(type.discord_role_ids_json || "[]") as string[]; } catch { /* use legacy field */ }
        if (!ids.length && type.discord_role_id) ids = [type.discord_role_id];
        return [type.id, ids];
      })));
    }).catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load settings."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveRoles(typeId: string) {
    setSaving(typeId); setError(""); setMessage("");
    try {
      const discordRoleIds = selections[typeId] ?? [];
      const response = await fetch("/api/admin/application-settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationTypeId: typeId, discordRoleIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save roles.");
      setTypes((current) => current.map((type) => type.id === typeId ? { ...type, discord_role_ids_json: JSON.stringify(discordRoleIds), discord_role_id: discordRoleIds[0] ?? null } : type));
      setMessage("Whitelist roles saved successfully.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save roles."); }
    finally { setSaving(null); }
  }

  async function toggleApplications(enabled: boolean) {
    setToggleSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/application-settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationsEnabled: enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update application availability.");
      setApplicationsEnabled(enabled);
      setMessage(enabled ? "Whitelist applications are now open." : "Whitelist applications have been closed.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update application availability."); }
    finally { setToggleSaving(false); }
  }

  return (
    <div className="mt-8 space-y-5">
      <section className="panel-card p-5 sm:p-6">
        <div className="eyebrow">Application availability</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-white">Whitelist applications</h2><p className="mt-1 text-sm text-slate-400">Close applications temporarily without deleting the form or previous submissions.</p></div>
          <button type="button" disabled={toggleSaving || loading} onClick={() => toggleApplications(!applicationsEnabled)} className={applicationsEnabled ? "rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 disabled:opacity-50" : "rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-200 disabled:opacity-50"}>
            {toggleSaving ? "Saving…" : applicationsEnabled ? "Enabled — turn off" : "Disabled — turn on"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Current status: {applicationsEnabled ? "Applications are open to players." : "Players cannot submit new applications."}</p>
      </section>

      <section className="panel-card p-5 sm:p-6">
        <div className="eyebrow">Discord integration</div>
        <h2 className="mt-1 text-lg font-semibold text-white">Whitelist role assignment</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Select every Discord role to grant when an application is approved. Existing member roles are preserved.</p>
        <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100/90">The bot needs <strong>Manage Roles</strong>, and its highest role must be above every selected role. It also needs <strong>Manage Nicknames</strong> to set a player's callsign nickname.</div>
      </section>

      {loading ? <div className="panel-card p-6 text-sm text-slate-400">Loading application types and Discord roles…</div> :
        types.length === 0 ? <div className="panel-card p-6 text-sm text-slate-400">No application types have been created yet.</div> :
        types.map((type) => (
          <section key={type.id} className="panel-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{type.name}</h3><p className="mt-1 text-sm text-slate-400">{type.description}</p></div><span className={type.enabled ? "rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300" : "rounded-full bg-slate-400/10 px-3 py-1 text-xs text-slate-400"}>{type.enabled ? "Form enabled" : "Form disabled"}</span></div>
            <fieldset className="mt-5"><legend className="mb-2 text-xs font-semibold text-slate-300">Discord roles granted on approval</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((role) => <label key={role.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0b1627] px-3 py-2.5 text-sm text-slate-200"><input type="checkbox" checked={(selections[type.id] ?? []).includes(role.id)} onChange={(event) => setSelections((current) => ({ ...current, [type.id]: event.target.checked ? [...(current[type.id] ?? []), role.id] : (current[type.id] ?? []).filter((id) => id !== role.id) }))} />{role.name}</label>)}
              </div>
            </fieldset>
            <button type="button" onClick={() => saveRoles(type.id)} disabled={saving !== null} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">{saving === type.id ? "Saving…" : "Save selected roles"}</button>
          </section>
        ))}
      {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</p>}
    </div>
  );
}
