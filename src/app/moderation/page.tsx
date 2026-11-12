import { requirePermissionSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { BansTable } from "@/components/bans-table";
import { getBans } from "@/lib/discord";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const session = await requirePermissionSession("discord.moderate");

  let bans: Awaited<ReturnType<typeof getBans>> = [];
  let error: string | null = null;

  try {
    bans = await getBans();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load bans";
  }

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-bold text-white">Moderation</h1>
      <p className="mt-1 text-sm text-discord-muted">
        {bans.length} banned {bans.length === 1 ? "user" : "users"}. Kick, ban
        and timeout actions are on the{" "}
        <a href="/members" className="text-discord-blurple hover:underline">
          Members page
        </a>
        .
      </p>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <strong>Discord API error:</strong> {error}
        </div>
      ) : (
        <BansTable bans={bans} />
      )}
    </AppShell>
  );
}
