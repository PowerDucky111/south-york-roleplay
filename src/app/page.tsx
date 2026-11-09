import Link from "next/link";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Your login session expired. Please try again.",
  token_exchange_failed: "Discord login failed. Please try again.",
  profile_fetch_failed: "We could not retrieve your Discord profile.",
  not_authorized: "Your Discord account does not have staff access to this server.",
  not_member: "You need to join the South York Roleplay Discord server before accessing the portal.",
  missing_oauth_config: "The server is missing Discord login configuration.",
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1220] px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_55%)]" />
      <div className="relative w-full max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 font-black text-white shadow-xl shadow-blue-950/40">SY</div>
              <div>
                <div className="text-sm font-bold tracking-[0.18em] text-white">SOUTH YORK ROLEPLAY</div>
                <div className="mt-1 text-xs text-slate-500">Community management portal</div>
              </div>
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> FiveM roleplay community
            </div>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Your community.<br /><span className="text-blue-300">One place.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
              Apply to join, keep up with community announcements and get support — or access the tools that help run South York Roleplay.
            </p>
            {error && (
              <div className="mt-7 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
              </div>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              {session ? (
                <Link href={admin ? "/dashboard" : "/portal"} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500">
                  Open {admin ? "staff workspace" : "community portal"}
                </Link>
              ) : (
                <Link href="/api/auth/discord" className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500">
                  <DiscordIcon /> Continue with Discord
                </Link>
              )}
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05]">
                Join our Discord
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-600">Discord membership is required to access the portal.</p>
          </div>

          <div className="panel-card p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
              <div>
                <div className="text-sm font-semibold text-white">Community hub</div>
                <div className="mt-1 text-xs text-slate-500">Everything in one place</div>
              </div>
              <div className="rounded-lg bg-blue-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-200">South York RP</div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["01", "Applications", "Submit and track your community application"],
                ["02", "Support", "Get help from the right team"],
                ["03", "Community updates", "Stay up to date with notices and events"],
                ["04", "Staff workspace", "Tools for authorised community staff"],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4 rounded-xl border border-white/[0.05] bg-white/[0.025] p-4">
                  <div className="pt-0.5 text-xs font-bold text-blue-300">{number}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/[0.07] pt-5 text-xs text-slate-600">© {new Date().getFullYear()} South York Roleplay. Community portal.</div>
      </div>
    </main>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
