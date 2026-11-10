import { requireAdminSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ApplicationSettings } from "@/components/application-settings";

export const dynamic = "force-dynamic";

export default async function ApplicationSettingsPage() {
  const session = await requireAdminSession();
  return (
    <AppShell session={session}>
      <div className="eyebrow">Staff workspace / Settings</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Application settings</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Configure the Discord whitelist role linked to each application form.</p>
      <ApplicationSettings />
    </AppShell>
  );
}
