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
      <Sidebar username={session.username} avatarUrl={avatarUrl(user, 64)} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
