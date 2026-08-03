"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  Droplets,
  FileSearch,
  Loader2,
  MessageSquareText,
  Network,
  Send,
  ShieldCheck,
  Sparkles,
  Waves
} from "lucide-react";
import type { EcoHistoryItem } from "@/lib/ecoagency-types";

type SpecialistId = "complaint" | "water" | "spill";

type ConversationResult = {
  prompt: string;
  response: string;
  history: EcoHistoryItem[];
};

const specialists = [
  {
    id: "complaint" as const,
    name: "Complaint Caseworker",
    eyebrow: "Intake & case context",
    description: "Finds complaint records, tracking details, locations, status, and regulated-entity context.",
    icon: FileSearch,
    color: "#2563eb",
    soft: "#eff6ff",
    border: "#bfdbfe"
  },
  {
    id: "water" as const,
    name: "Water Quality Analyst",
    eyebrow: "Water intelligence",
    description: "Examines contamination complaints, county patterns, population context, and related evidence.",
    icon: Droplets,
    color: "#087ea4",
    soft: "#ecfeff",
    border: "#a5f3fc"
  },
  {
    id: "spill" as const,
    name: "Spill Response Analyst",
    eyebrow: "Incident response",
    description: "Assesses spill, waste, and oil incidents and connects findings to response and remediation steps.",
    icon: AlertTriangle,
    color: "#c2410c",
    soft: "#fff7ed",
    border: "#fed7aa"
  }
];

const promptPresets = [
  {
    label: "Complaint lookup",
    agent: "complaint" as const,
    prompt: "List the count of air-related complaints in Johnson County and summarize the incident records."
  },
  {
    label: "Water assessment",
    agent: "water" as const,
    prompt:
      "Which complaint numbers are associated with water contamination, which county has the most complaints, and what related knowledge-base documents should an analyst review?"
  },
  {
    label: "Spill response",
    agent: "spill" as const,
    prompt:
      "Which complaints are associated with waste or oil incidents, and what response and remediation steps should be considered?"
  }
];

function inferSpecialist(prompt: string): SpecialistId {
  const normalized = prompt.toLowerCase();
  if (/water|contamin|watershed|discharge|drinking/.test(normalized)) return "water";
  if (/spill|oil|waste|leak|release|remedi|ldar/.test(normalized)) return "spill";
  return "complaint";
}

function SpecialistCard({
  specialist,
  active,
  loading
}: {
  specialist: (typeof specialists)[number];
  active: boolean;
  loading: boolean;
}) {
  const Icon = specialist.icon;
  return (
    <article
      className="relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300"
      style={{
        borderColor: active ? specialist.color : "#e2e8f0",
        boxShadow: active ? `0 16px 40px -24px ${specialist.color}` : "0 8px 28px -24px #0f172a"
      }}
    >
      {active && <div className="absolute inset-x-0 top-0 h-1" style={{ background: specialist.color }} />}
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: specialist.soft, color: specialist.color }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ background: active ? specialist.soft : "#f8fafc", color: active ? specialist.color : "#64748b" }}
        >
          {active && loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CircleDot className="h-3 w-3" />}
          {active ? (loading ? "Working" : "Selected") : "Available"}
        </span>
      </div>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{specialist.eyebrow}</p>
      <h3 className="mt-1 text-base font-bold text-slate-950">{specialist.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{specialist.description}</p>
    </article>
  );
}

export function TceqMultiAgentPanel() {
  const [prompt, setPrompt] = useState(promptPresets[1].prompt);
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [result, setResult] = useState<ConversationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const routedAgentId = useMemo(
    () => inferSpecialist(submittedPrompt || prompt),
    [prompt, submittedPrompt]
  );
  const routedAgent = specialists.find((specialist) => specialist.id === routedAgentId) || specialists[0];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt || loading) return;

    setSubmittedPrompt(nextPrompt);
    setResult(null);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ecoagency/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: nextPrompt })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The Select AI Agent request failed.");
      setResult({ prompt: body.prompt, response: body.response, history: body.history || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The Select AI Agent request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f2f6f5] text-slate-950">
      <header className="border-b border-white/10 bg-[#073b3a] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1b82d] text-[#073b3a] shadow-lg shadow-black/10">
              <Waves className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">TCEQ Intelligence</p>
              <h1 className="text-base font-semibold">MultiAgent SelectAI</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.12)]" />
              Oracle ADB · server-side
            </span>
            <Link
              href="/demo-mode"
              className="flex h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Demo menu
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0b6b66]">
              <Sparkles className="h-4 w-4" />
              Environmental operations workspace
            </div>
            <h2 className="max-w-3xl text-3xl font-bold tracking-[-0.03em] text-slate-950 md:text-4xl">
              One question. The right specialist. A grounded answer.
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              The Supervisor understands the request, delegates domain work, and returns an answer grounded in governed
              complaint data and available evidence.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {[
              ["1", "Supervisor"],
              ["3", "Specialists"],
              ["1", "Shared answer"]
            ].map(([value, label]) => (
              <div key={label} className="min-w-24 rounded-lg bg-slate-50 px-3 py-2 text-center">
                <div className="text-lg font-bold text-[#0b6b66]">{value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_#0f172a] md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#073b3a] text-white">
                    <Bot className="h-7 w-7" />
                    <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-[#f1b82d]" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">Supervisor Agent</h3>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Orchestrator
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Classifies intent, selects the specialist, coordinates tools, and assembles the final response.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-center text-xs font-semibold text-slate-500">
                  Route request
                  <ChevronRight className="h-4 w-4 text-[#0b6b66]" />
                  <span className="rounded-full bg-[#edf7f5] px-3 py-1.5 font-bold text-[#0b6b66]">{routedAgent.name}</span>
                </div>
              </div>
            </section>

            <div className="relative grid gap-4 lg:grid-cols-3">
              <div className="pointer-events-none absolute -top-6 left-1/2 hidden h-6 w-px bg-slate-300 lg:block" />
              {specialists.map((specialist) => (
                <SpecialistCard
                  key={specialist.id}
                  specialist={specialist}
                  active={specialist.id === routedAgentId}
                  loading={loading}
                />
              ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-40px_#0f172a]">
              <div className="border-b border-slate-100 px-5 py-4 md:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">Ask the Supervisor</h3>
                    <p className="mt-1 text-xs text-slate-500">Choose a briefing prompt or write an environmental operations question.</p>
                  </div>
                  <MessageSquareText className="h-5 w-5 text-[#0b6b66]" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {promptPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPrompt(preset.prompt);
                        setSubmittedPrompt("");
                      }}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#0b6b66]/40 hover:bg-[#edf7f5] hover:text-[#0b6b66]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={submit} className="p-5 md:p-6">
                <label htmlFor="tceq-prompt" className="sr-only">
                  Environmental operations question
                </label>
                <textarea
                  id="tceq-prompt"
                  value={prompt}
                  onChange={(event) => {
                    setPrompt(event.target.value);
                    setSubmittedPrompt("");
                  }}
                  rows={4}
                  placeholder="Ask about a complaint, water issue, or spill response..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b6b66] focus:bg-white focus:ring-4 focus:ring-[#0b6b66]/10"
                />
                <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Credentials and database access stay server-side.
                  </p>
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b6b66] px-5 text-sm font-bold text-white transition hover:bg-[#075752] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {loading ? "Coordinating agents" : "Run analysis"}
                  </button>
                </div>
              </form>
            </section>

            {(loading || result || error) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_#0f172a] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0b6b66]">Supervisor briefing</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-950">Grounded response</h3>
                  </div>
                  {result && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <Check className="h-3.5 w-3.5" /> Complete
                    </span>
                  )}
                </div>
                {loading && (
                  <div className="mt-5 flex min-h-40 items-center justify-center rounded-xl bg-slate-50 text-center">
                    <div>
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0b6b66]" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">{routedAgent.name} is analyzing the request</p>
                      <p className="mt-1 text-xs text-slate-500">Oracle Select AI Agent is coordinating data and tools.</p>
                    </div>
                  </div>
                )}
                {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</p>}
                {result && !loading && (
                  <pre className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-5 font-sans text-sm leading-7 text-slate-700">
                    {result.response}
                  </pre>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-2xl bg-[#092f2f] text-white shadow-xl shadow-[#073b3a]/10">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#f1b82d]" />
                  <h3 className="text-sm font-bold">Live orchestration</h3>
                </div>
                <p className="mt-1 text-xs text-emerald-100/60">Understand each handoff without exposing chain-of-thought.</p>
              </div>
              <div className="p-5">
                {[
                  {
                    title: "Supervisor",
                    text: "Interpret intent and choose a route",
                    state: submittedPrompt ? "done" : "next",
                    icon: Network
                  },
                  { title: routedAgent.name, text: "Run domain-specific analysis", state: loading ? "active" : result ? "done" : "next", icon: routedAgent.icon },
                  { title: "Oracle Autonomous Database", text: "Retrieve governed complaint data", state: loading ? "active" : result ? "done" : "next", icon: Database },
                  { title: "Supervisor", text: "Synthesize evidence and deliver answer", state: result ? "done" : "next", icon: Sparkles }
                ].map((step, index, steps) => (
                  <div key={`${step.title}-${index}`} className="relative flex gap-3 pb-6 last:pb-0">
                    {index < steps.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-1.75rem)] w-px bg-white/15" />}
                    <span
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                        step.state === "done"
                          ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                          : step.state === "active"
                            ? "border-[#f1b82d]/50 bg-[#f1b82d]/15 text-[#f1b82d]"
                            : "border-white/15 bg-white/5 text-white/40"
                      }`}
                    >
                      {step.state === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : <step.icon className="h-4 w-4" />}
                    </span>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      <p className="mt-1 text-xs leading-5 text-emerald-100/55">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[#0b6b66]" />
                <h3 className="text-sm font-bold text-slate-950">Tools & evidence</h3>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ["Select AI Agent", "Natural-language orchestration"],
                  ["TCEQ complaint data", "Governed ADB retrieval"],
                  ["Knowledge base", "Supporting program context"],
                  ["MCP tools", "External context when configured"]
                ].map(([title, text], index) => (
                  <div key={title} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#0b6b66] shadow-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {result && result.history.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-950">Oracle execution trace</h3>
                <p className="mt-1 text-xs text-slate-500">Latest records reported by the database agent history views.</p>
                <div className="mt-4 space-y-3">
                  {result.history.slice(0, 4).map((item, index) => (
                    <div key={`${item.startedAt}-${index}`} className="border-l-2 border-[#0b6b66]/30 pl-3">
                      <p className="text-xs font-bold text-slate-800">{item.agentName || item.taskName || "Agent task"}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{item.prompt || item.response || "Execution recorded"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Link
              href="/technical"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#0b6b66]/30 hover:text-[#0b6b66]"
            >
              View technical architecture
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
