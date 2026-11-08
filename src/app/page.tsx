import Link from "next/link";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Login session expired. Please try again.",
  token_exchange_failed: "Discord login failed. Please try again.",
  profile_fetch_failed: "Could not fetch your Discord profile.",
  not_authorized: "Your Discord account does not have staff access to this server.",
  missing_oauth_config: "Server is missing OAuth configuration.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  const admin = session ? await isAdmin(session.userId) : false;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-discord-darker via-[#1a1c20] to-discord-darker px-6">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-discord-blurple">
          FiveM &middot; Yorkshire
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          South York Roleplay
        </h1>
        <p className="mt-4 text-lg text-discord-muted">
          Staff Community Management System
        </p>

        {error && (
          <div className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          </div>
        )}

        <div className="mt-10">
          {admin ? (
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-discord-blurple px-8 py-3 text-base font-semibold text-white transition hover:bg-[#4752c4]"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/api/auth/discord"
                className="inline-flex items-center gap-3 rounded-lg bg-discord-blurple px-8 py-3 text-base font-semibold text-white transition hover:bg-[#4752c4]"
              >
                <DiscordIcon />
                Sign in with Discord
              </Link>
              <p className="mt-4 text-sm text-discord-muted">
                Staff access only — you must have Administrator or Manage Server
                permissions in the South York Roleplay Discord.
              </p>
            </>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            ["Member Management", "View every member, assign and remove roles instantly."],
            ["Moderation", "Kick, ban, timeout and unban — all from one dashboard."],
            ["Live Data", "Everything syncs directly with your Discord server."],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-xl border border-white/5 bg-discord-panel/60 p-5"
            >
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-discord-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
