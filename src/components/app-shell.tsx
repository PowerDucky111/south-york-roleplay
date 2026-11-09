import { Sidebar } from "./sidebar";
import { avatarUrl, type DiscordUser } from "@/lib/discord";
import type { SessionPayload } from "@/lib/session";

export function AppShell({
  session,
  children,
  mode = "staff",
}: {
  session: SessionPayload;
  children: React.ReactNode;
  mode?: "staff" | "player";
}) {
  const user: DiscordUser = {
    id: session.userId,
    username: session.username,
    global_name: session.username,
    avatar: session.avatar,
    discriminator: "0",
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 lg:flex">
      <Sidebar
        username={session.username}
        avatarUrl={avatarUrl(user, 64)}
        mode={mode}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
