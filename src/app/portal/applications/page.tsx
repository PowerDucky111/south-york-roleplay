import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";

export const dynamic = "force-dynamic";

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  form_schema_json: string;
}
interface ApplicationRow {
  id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  application_type_name: string;
}

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In review",
  awaiting_information: "Awaiting information",
  approved: "Approved",
  rejected: "Not approved",
  withdrawn: "Withdrawn",
  draft: "Draft",
};

export default async function ApplicationsPage() {
  const session = await requireSession();
  let types: ApplicationType[] = [];
  let applications: ApplicationRow[] = [];
  let loadError = "";

  try {
    const db = getDatabase();
    const [typeResult, applicationResult] = await Promise.all([
      db.prepare("SELECT id, name, description, form_schema_json FROM application_types WHERE enabled = 1 ORDER BY sort_order ASC, name ASC").all<ApplicationType>(),
      db.prepare("SELECT a.id, a.status, a.submitted_at, a.created_at, t.name AS application_type_name FROM applications a JOIN application_types t ON t.id = a.application_type_id WHERE a.applicant_discord_id = ? ORDER BY a.created_at DESC").bind(session.userId).all<ApplicationRow>(),
    ]);
    types = typeResult.results;
    applications = applicationResult.results;
  } catch (error) {
    console.error("[applications page] Failed to load D1 data:", error);
    loadError = "We couldn't connect to the application database. Please try again shortly.";
  }

  return (
    <AppShell session={session} mode="player">
      <div className="eyebrow">Community portal / Applications</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">My applications</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Apply to join South York Roleplay and follow the progress of your submissions.</p>

      {loadError ? (
        <div role="alert" className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{loadError}</div>
      ) : (
        <>
          <section className="mt-8 panel-card p-6 sm:p-8">
            <div className="eyebrow">New submission</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Start an application</h2>
            <p className="mb-6 mt-2 text-sm leading-6 text-slate-400">Complete the form below. Required questions are marked with an asterisk.</p>
            <ApplicationForm types={types} />
          </section>

          <section className="mt-8">
            <div className="eyebrow">Your submissions</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Application history</h2>
            <div className="mt-4 space-y-3">
              {applications.length === 0 ? (
                <div className="panel-card p-5 text-sm text-slate-400">You haven't submitted any applications yet.</div>
              ) : applications.map((application) => (
                <div key={application.id} className="panel-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{application.application_type_name}</h3>
                    <p className="mt-1 text-xs text-slate-500">Submitted {application.submitted_at ? new Date(application.submitted_at).toLocaleString("en-GB") : "—"}</p>
                  </div>
                  <span className="w-fit rounded-full border border-blue-300/15 bg-blue-300/[0.08] px-3 py-1.5 text-xs font-medium text-blue-200">{statusLabels[application.status] ?? application.status}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      <Link href="/portal" className="mt-7 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200">← Back to overview</Link>
    </AppShell>
  );
}
