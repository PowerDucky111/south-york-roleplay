import { requireAdminSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getMembers, getRoles, roleColor } from "@/lib/discord";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const session = await requireAdminSession();

  let roles: Awaited<ReturnType<typeof getRoles>> = [];
  let members: Awaited<ReturnType<typeof getMembers>> = [];
  let error: string | null = null;

  try {
    [roles, members] = await Promise.all([getRoles(), getMembers()]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load roles";
  }

  // Count members per role.
  const counts = new Map<string, number>();
  for (const m of members) {
    for (const roleId of m.roles) {
      counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
    }
  }

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold text-white">Roles</h1>
      <p className="mt-1 text-sm text-discord-muted">
        {roles.length} roles in the server, ordered by position (highest first).
      </p>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <strong>Discord API error:</strong> {error}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-discord-panel/80 text-xs uppercase tracking-wide text-discord-muted">
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Type</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {roles.map((r) => (
                <tr key={r.id} className="bg-discord-dark/40 hover:bg-discord-hover/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: roleColor(r) }}
                      />
                      <span className="font-medium text-white">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-discord-muted">
                    {(counts.get(r.id) ?? 0).toLocaleString()}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {r.managed ? (
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-discord-muted">
                        Bot / integration
                      </span>
                    ) : r.name === "@everyone" ? (
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-discord-muted">
                        Default
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Assignable
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-discord-muted lg:table-cell">
                    {r.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-discord-muted">
        Tip: to assign a role from the Members page, the bot&apos;s highest role
        must sit above that role in Discord&apos;s role list.
      </p>
    </AppShell>
  );
}
