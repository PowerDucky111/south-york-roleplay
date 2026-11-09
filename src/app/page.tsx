import Link from "next/link";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Your sign-in session expired. Please try again.",
  token_exchange_failed: "Discord sign-in failed. Please try again.",
  profile_fetch_failed: "We couldn't retrieve your Discord profile.",
  not_authorized: "Your Discord account does not currently have panel access.",
  missing_oauth_config: "The portal is missing its Discord sign-in configuration.",
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-blue-500/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-sky-400/[0.06] blur-3xl" />

      <div className="relative w-full max-w-5xl">
        <header className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500 to-blue-700 font-black text-white shadow-lg shadow-blue-950/40">SY</div>
            <div>
              <div className="text-sm font-bold tracking-[0.12em] text-white">SOUTH YORK ROLEPLAY</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Community portal</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-300 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Community systems
          </div>
        </header>

        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <section>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-3 py-1.5 text-xs font-semibold text-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> FiveM · Yorkshire
            </div>
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Your community.
              <span className="block bg-gradient-to-r from-blue-300 to-sky-400 bg-clip-text text-transparent">One portal.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Applications, community support and staff services for South York Roleplay — all in one place.
            </p>

            {error && (
              <div className="mt-7 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">
                {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
              </div>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              {admin ? (
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-400">
                  Open staff dashboard <span aria-hidden>→</span>
                </Link>
              ) : session ? (
                <div className="rounded-xl border border-blue-400/20 bg-blue-500/[0.08] px-5 py-3 text-sm text-blue-100">
                  Signed in as {session.username}. Player portal access is being prepared.
                </div>
              ) : (
                <Link href="/api/auth/discord" className="inline-flex items-center gap-3 rounded-xl bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-400">
                  <DiscordIcon /> Continue with Discord <span aria-hidden>→</span>
                </Link>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-500">Secure sign-in powered by Discord.</p>
          </section>

          <section className="syrp-panel rounded-2xl p-6 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="syrp-kicker">Portal services</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Everything in one place</h2>
              </div>
              <div className="rounded-xl border border-blue-300/15 bg-blue-400/10 p-3 text-blue-200">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l8 4v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7l8-4z" /></svg>
              </div>
            </div>
            <div className="space-y-3">
              <Feature icon="▤" title="Applications" body="Apply to join the community and track decisions." />
              <Feature icon="◷" title="Support tickets" body="Get help and follow your open requests." />
              <Feature icon="◈" title="Community notices" body="Keep up with important server updates." />
              <Feature icon="⌘" title="Staff services" body="Tools for moderation and community management." />
            </div>
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-xs leading-5 text-slate-500">
              Access to staff tools is controlled by permissions assigned inside the portal.
            </div>
          </section>
        </div>

        <footer className="mt-16 border-t border-white/[0.07] pt-5 text-xs text-slate-600">
          © {new Date().getFullYear()} South York Roleplay. Community portal.
        </footer>
      </div>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.055] bg-white/[0.025] p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-lg text-blue-300">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <div className="mt-0.5 text-xs leading-5 text-slate-500">{body}</div>
      </div>
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
