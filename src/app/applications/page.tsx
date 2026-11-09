import Link from "next/link";
import { requireAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ApplicationReviewActions } from "@/components/application-review-actions";

export const dynamic = "force-dynamic";

interface ApplicationRow {
  id: string;
  applicant_discord_id: string;
  status: string;
  answers_json: string;
  review_notes: string;
  submitted_at: string | null;
  created_at: string;
  application_type_name: string;
  applicant_username: string | null;
}

const labels: Record<string, string> = {
  submitted: "Submitted", in_review: "In review", awaiting_information: "Awaiting information",
  approved: "Approved", rejected: "Rejected", withdrawn: "Withdrawn",
};

export default async function StaffApplicationsPage() {
  const session = await requireAdminSession();
  let applications: ApplicationRow[] = [];
  let error = "";
  try {
    const result = await getDatabase().prepare(
      "SELECT a.id, a.applicant_discord_id, a.status, a.answers_json, a.review_notes, a.submitted_at, a.created_at, t.name AS application_type_name, u.username AS applicant_username FROM applications a JOIN application_types t ON t.id = a.application_type_id LEFT JOIN panel_users u ON u.discord_user_id = a.applicant_discord_id ORDER BY CASE a.status WHEN 'submitted' THEN 0 WHEN 'in_review' THEN 1 WHEN 'awaiting_information' THEN 2 ELSE 3 END, a.created_at ASC"
    ).all<ApplicationRow>();
    applications = result.results;
  } catch (err) {
    console.error("[staff applications] Failed to load:", err);
    error = "The application database could not be reached. Check the D1 binding and deployment.";
  }

  const pending = applications.filter((item) => ["submitted", "in_review", "awaiting_information"].includes(item.status)).length;

  return (
    <AppShell session={session}>
      <div className="eyebrow">Staff workspace / Applications</div>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Application review</h1>
          <p className="mt-2 text-sm text-slate-400">Review community applications and record your decisions.</p>
        </div>
        <div className="rounded-xl border border-blue-400/15 bg-blue-400/[0.07] px-4 py-3 text-sm text-blue-200">{pending} awaiting action</div>
      </div>
      {error ? <div role="alert" className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : (
        <div className="mt-8 space-y-4">
          {applications.length === 0 ? <div className="panel-card p-7 text-sm text-slate-400">No applications have been submitted yet.</div> :
            applications.map((application) => {
              let answers: Record<string, string> = {};
              try { answers = JSON.parse(application.answers_json) as Record<string, string>; } catch { /* malformed legacy row */ }
              return (
                <article key={application.id} className="panel-card p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="eyebrow">{application.application_type_name}</div>
                      <h2 className="mt-1 text-lg font-semibold text-white">{application.applicant_username ?? "Discord member"}</h2>
                      <p className="mt-1 text-xs text-slate-500">Discord ID: {application.applicant_discord_id} · {application.submitted_at ? new Date(application.submitted_at).toLocaleString("en-GB") : "Submission date unavailable"}</p>
                    </div>
                    <span className="w-fit rounded-full border border-blue-300/15 bg-blue-300/[0.08] px-3 py-1.5 text-xs font-medium text-blue-200">{labels[application.status] ?? application.status}</span>
                  </div>
                  <div className="mt-5 space-y-4">
                    {Object.entries(answers).map(([question, answer], index) => (
                      <div key={question} className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Answer {index + 1} · {question.replaceAll("_", " ")}</div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{answer || "No answer provided."}</p>
                      </div>
                    ))}
                  </div>
                  <ApplicationReviewActions applicationId={application.id} currentStatus={application.status} />
                </article>
              );
            })}
        </div>
      )}
      <Link href="/dashboard" className="mt-7 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200">← Back to dashboard</Link>
    </AppShell>
  );
}
