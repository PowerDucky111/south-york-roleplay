"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: "M3 13h8V3H3v10zm10 8h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/members", label: "Members", icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m16 0h4v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8zm8-7.87a4 4 0 010 7.75" },
      { href: "/roles", label: "Discord roles", icon: "M12 3l8 4v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7l8-4zm-3 9l2 2 4-4" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/moderation", label: "Moderation", icon: "M12 9v2m0 4h.01M5 20h14a2 2 0 001.7-3L13.7 4a2 2 0 00-3.4 0L3.3 17A2 2 0 005 20z" },
    ],
  },
];

export function Sidebar({ username, avatarUrl }: { username: string; avatarUrl: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col border-r border-white/[0.07] bg-syrp-sidebar/95 backdrop-blur-xl max-lg:w-[76px]">
      <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-6 max-lg:justify-center max-lg:px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black tracking-tight text-white shadow-lg shadow-blue-950/40">
          SY
        </div>
        <div className="min-w-0 max-lg:hidden">
          <div className="truncate text-sm font-bold tracking-wide text-white">SOUTH YORK</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Roleplay portal</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6 max-lg:px-2">
        {NAV.map((group) => (
          <div key={group.title}>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 max-lg:hidden">{group.title}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition max-lg:justify-center max-lg:px-0",
                      active
                        ? "border border-blue-400/15 bg-blue-500/10 text-blue-200 shadow-sm shadow-blue-950/20"
                        : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={item.icon} />
                    </svg>
                    <span className="max-lg:hidden">{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-300 max-lg:hidden" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.035] p-2.5 max-lg:justify-center max-lg:p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full ring-2 ring-white/10" />
          <div className="min-w-0 flex-1 max-lg:hidden">
            <div className="truncate text-xs font-semibold text-slate-100">{username}</div>
            <div className="mt-0.5 text-[10px] text-slate-500">Panel administrator</div>
          </div>
          <form action="/api/auth/logout" method="post" className="max-lg:hidden">
            <button type="submit" title="Sign out" className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 17l5-5-5-5m5 5H3m9-9h6a3 3 0 013 3v12a3 3 0 01-3 3h-6" />
              </svg>
            </button>
          </form>
        </div>
        <form action="/api/auth/logout" method="post" className="mt-2 hidden max-lg:block">
          <button type="submit" title="Sign out" className="flex w-full justify-center rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M10 17l5-5-5-5m5 5H3m9-9h6a3 3 0 013 3v12a3 3 0 01-3 3h-6" /></svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
