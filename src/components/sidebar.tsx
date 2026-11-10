"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string };
const PLAYER_NAV: NavItem[] = [
  { href: "/portal", label: "Overview", icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { href: "/portal/applications", label: "My applications", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { href: "/portal/tickets", label: "Support tickets", icon: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5" },
];
const STAFF_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { href: "/applications", label: "Applications", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { href: "/settings/applications", label: "Application settings", icon: "M12 8a4 4 0 100 8 4 4 0 000-8zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2h-2.4v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H6.7v-2.4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5v-.2h2.4v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.5 1h.2V14h-.2a1.7 1.7 0 00-1.4 1z" },
  { href: "/staff-access", label: "Panel staff access", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2h-2.4v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H6.7v-2.4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5v-.2h2.4v.2a1.7 1.7 0 001 1.5l.1.1 1.7-1.7" },
  { href: "/members", label: "Discord members", icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M20 8v6M23 11h-6" },
  { href: "/roles", label: "Discord roles", icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7zM9 12l2 2 4-4" },
  { href: "/moderation", label: "Moderation", icon: "M12 9v2m0 4h.01M5 20h14a2 2 0 001.7-3L13.7 4a2 2 0 00-3.4 0L3.3 17A2 2 0 005 20z" },
];

export function Sidebar({
  username,
  avatarUrl,
  mode = "staff",
}: {
  username: string;
  avatarUrl: string;
  mode?: "staff" | "player";
}) {
  const pathname = usePathname();
  const nav = mode === "staff" ? STAFF_NAV : PLAYER_NAV;

  return (
    <aside className="relative z-10 flex min-h-screen w-full shrink-0 flex-col border-b border-white/[0.07] bg-[#101a2b] lg:sticky lg:top-0 lg:h-screen lg:w-[270px] lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-sm font-black tracking-tight text-white shadow-lg shadow-blue-950/40">
          SY
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-wide text-white">SOUTH YORK RP</div>
          <div className="mt-0.5 text-xs text-slate-400">
            {mode === "staff" ? "Management portal" : "Community portal"}
          </div>
        </div>
      </div>

      <div className="px-5 pt-6">
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {mode === "staff" ? "Staff workspace" : "Your space"}
        </div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = item.href === "/portal"
              ? pathname === "/portal"
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium transition",
                  active
                    ? "bg-blue-500/15 text-blue-200 ring-1 ring-inset ring-blue-400/20"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                )}
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-300" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {mode === "staff" && (
        <div className="mt-8 px-5">
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Community</div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Discord connection
            </div>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">Server tools are connected through your configured Discord bot.</p>
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-white/[0.07] p-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full bg-slate-800 ring-2 ring-white/10" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{username}</div>
            <div className="mt-0.5 text-xs text-slate-500">{mode === "staff" ? "Staff workspace" : "Community member"}</div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" title="Sign out" className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
