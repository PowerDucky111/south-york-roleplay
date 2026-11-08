import { requireAdminSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { MemberTable } from "@/components/member-table";
import { getMembers, getRoles } from "@/lib/discord";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const session = await requireAdminSession();

  let members: Awaited<ReturnType<typeof getMembers>> = [];
  let roles: Awaited<ReturnType<typeof getRoles>> = [];
  let error: string | null = null;

  try {
    [members, roles] = await Promise.all([getMembers(), getRoles()]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load members";
  }

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold text-white">Members</h1>
      <p className="mt-1 text-sm text-discord-muted">
        All {members.length} members of the server. Click a member&apos;s actions
        to manage roles or moderate.
      </p>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <strong>Discord API error:</strong> {error}
        </div>
      ) : (
        <div className="mt-6">
          <MemberTable
            members={members}
            roles={roles}
            currentUserId={session.userId}
          />
        </div>
      )}
    </AppShell>
  );
}
