import { Sidebar } from "./sidebar";
import { avatarUrl, type DiscordUser } from "@/lib/discord";
import type { SessionPayload } from "@/lib/session";

export function AppShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const user: DiscordUser = {
    id: session.userId,
    username: session.username,
    global_name: session.username,
    avatar: session.avatar,
    discriminator: "0",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar username={session.username} avatarUrl={avatarUrl(user, 96)} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8 xl:px-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-5">
            <div>
              <div className="syrp-kicker">South York Roleplay · Community systems</div>
              <p className="mt-1 text-sm text-slate-400">A central place to manage the community</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Discord connected
            </div>
          </div>
          {children}
          <footer className="mt-12 border-t border-white/[0.06] pt-5 text-xs text-slate-500">
            South York Roleplay · Community Portal
          </footer>
        </div>
      </main>
    </div>
  );
}
