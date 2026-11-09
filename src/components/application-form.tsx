"use client";

import { FormEvent, useState } from "react";

interface ApplicationQuestion {
  id: string;
  label: string;
  type: "textarea" | "text";
  required: boolean;
}
interface ApplicationType {
  id: string;
  name: string;
  description: string;
  form_schema_json: string;
}

export function ApplicationForm({ types }: { types: ApplicationType[] }) {
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selected = types.find((type) => type.id === typeId);
  let questions: ApplicationQuestion[] = [];
  try {
    questions = selected ? JSON.parse(selected.form_schema_json) as ApplicationQuestion[] : [];
  } catch {
    questions = [];
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationTypeId: typeId, answers }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not submit your application.");
      setSuccess(true);
      setAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!types.length) {
    return <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">There are no application forms available at the moment. Please check back later.</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="application-type" className="mb-2 block text-sm font-medium text-slate-200">Application type</label>
        <select id="application-type" value={typeId} onChange={(event) => { setTypeId(event.target.value); setAnswers({}); setSuccess(false); }} className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm text-white outline-none focus:border-blue-400">
          {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        {selected?.description && <p className="mt-2 text-sm leading-6 text-slate-400">{selected.description}</p>}
      </div>

      {questions.map((question, index) => (
        <div key={question.id}>
          <label htmlFor={question.id} className="mb-2 block text-sm font-medium text-slate-200">{index + 1}. {question.label}{question.required && <span className="ml-1 text-blue-300">*</span>}</label>
          {question.type === "text" ? (
            <input id={question.id} required={question.required} maxLength={5000} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm text-white outline-none focus:border-blue-400" />
          ) : (
            <textarea id={question.id} required={question.required} maxLength={5000} rows={5} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-blue-400" />
          )}
        </div>
      ))}

      {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">Your application has been submitted successfully. You can follow its progress below.</p>}
      <button type="submit" disabled={submitting} className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Submitting…" : "Submit application"}</button>
      <p className="text-xs leading-5 text-slate-500">Your application will be visible to authorised South York Roleplay staff for review.</p>
    </form>
  );
}
