"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Bot, CheckCircle2, CircleX, Loader2, MessageCircle, RotateCcw, Sparkles } from "lucide-react";
import {
  getTceqAgentRoute,
  getTceqAgentRoutes,
  getTceqRouteForAgentName,
  type TceqAgentRoute
} from "@/lib/tceq-agent-routing";
import type { EcoHistoryItem, EcoToolHistoryItem } from "@/lib/ecoagency-types";
import { FormattedAgentResponse } from "@/components/formatted-agent-response";
import { LiveOrchestrationPanel } from "@/components/live-orchestration-panel";
import { DeterministicResponseChart } from "@/components/deterministic-response-chart";
import { ToolEvidencePanel } from "@/components/tool-evidence-panel";
import { ConversationVisibilityPanel } from "@/components/conversation-visibility-panel";
import { KnowledgeGroundingGuidance } from "@/components/knowledge-grounding-guidance";
import { CrossDomainReport, isCrossDomainResponse } from "@/components/cross-domain-report";
import { OciGuardrailsControl } from "@/components/oci-guardrails-control";
import type { GuardrailRun, GuardrailServiceStatus } from "@/lib/guardrail-types";

type ConversationResult = {
  prompt: string;
  response: string;
  history: EcoHistoryItem[];
  toolHistory: EcoToolHistoryItem[];
  guardrails: GuardrailRun;
};

const showcasePrompts = [
  {
    label: "Complaint Caseworker · Air complaints",
    prompt:
      "List up to 5 air-related complaints in Johnson County. For each, provide the tracking number, status, location, and a one-sentence incident summary."
  },
  {
    label: "Water Quality Analyst · Barton Creek samples",
    prompt:
      "For the Barton Creek watershed, show up to 4 recent water-quality sampling records. Include site name, sample date, parameter, result, unit, and qualifier."
  },
  {
    label: "Spill Response Analyst · Johnson County spills",
    prompt:
      "For Johnson County, show up to 4 emergency-response spill records. Include incident number, location, receiving water body, released material, amount, status, and action taken."
  },
  {
    label: "Supervisor · Cross-domain counts",
    prompt:
      "Use all three specialists. Return exactly three source-labelled count lines and no causal conclusions: Complaint - count complaint records where COUNTY is TRAVIS; Spill Response - count distinct spill INCIDENTNUMBER records where COUNTY is TRAVIS; Water Quality - count measurement rows where WATERSHED is Lady Bird Lake, PARAMETER is DISSOLVED OXYGEN, and SAMPLE_DATE is in calendar year 2024. Do not use web search or RAG."
  },
  {
    label: "Complaint Caseworker · Tracking 422276",
    prompt:
      "Use the Complaint Caseworker and COMPLAINT_SQL only. Treat 422276 as a complaint tracking number in the complaint data, not as an emergency-response spill incident number. Retrieve the complete matching complaint record, including OVERALL_ASSESSMENT and any available action, referral, resolution, or follow-up fields. Respond under exactly three headings: Incident Summary; Response Assessment; Improvement Opportunities. Base every statement on the retrieved record. Assess the recorded response neutrally and do not assume that a referral resolved the underlying issue. If outcome, verification, or follow-up evidence is absent, identify that absence as the improvement opportunity. Do not invent technical corrective actions or facts."
  },
  {
    label: "OCI Guardrails · PII output test",
    prompt:
      "Use the Complaint Caseworker and COMPLAINT_SQL only. Treat 422276 as a complaint tracking number, not a spill incident number. Using the complete OVERALL_ASSESSMENT column for the matching complaint record, provide a detailed summary of the incident."
  },
  {
    label: "Complaint Caseworker · Water contamination comparison",
    prompt:
      "Which top 10 complaints numbers are associated with water contamination, which county has the highest complaints of this contamination and is it high compared to the county population."
  },
  {
    label: "Knowledge base · LDAR program guidance",
    prompt: "Explain the leak detection and repair program"
  },
  {
    label: "Follow-up · Manager email (run last)",
    prompt: "Create an email summarizing everything we discussed so I can send to my manager"
  }
] as const;

export function ConversationsAiPanel() {
  const conversationId = useRef<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ConversationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<TceqAgentRoute | null>(null);
  const [activeRoutes, setActiveRoutes] = useState<TceqAgentRoute[]>(getTceqAgentRoutes(""));
  const [turns, setTurns] = useState<ConversationResult[]>([]);
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(false);
  const [guardrailServiceStatus, setGuardrailServiceStatus] = useState<GuardrailServiceStatus | null>(null);
  const [latestGuardrailRun, setLatestGuardrailRun] = useState<GuardrailRun | null>(null);
  const resultFailed = Boolean(result && /(?:^|\n)\s*(?:task failed|ora-\d+)/i.test(result.response));
  const resultIsKnowledgeGuidance = Boolean(
    result && /\bldar\b|leak detection and repair|knowledge[ -]?base|program guidance|policy guidance|regulatory guidance|supporting document/i.test(result.prompt)
  );
  const resultIsCrossDomain = Boolean(result && isCrossDomainResponse(result.response));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ecoagency/guardrails/status")
      .then((response) => response.json())
      .then((status: GuardrailServiceStatus) => {
        if (!cancelled) setGuardrailServiceStatus(status);
      })
      .catch(() => {
        if (!cancelled) setGuardrailServiceStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function startNewConversation() {
    conversationId.current = null;
    setPrompt("");
    setResult(null);
    setError("");
    setActiveRoute(null);
    setActiveRoutes(getTceqAgentRoutes(""));
    setTurns([]);
    setLatestGuardrailRun(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;

    setActiveRoute(getTceqAgentRoute(nextPrompt));
    setActiveRoutes(getTceqAgentRoutes(nextPrompt));
    setPrompt("");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ecoagency/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: nextPrompt,
          conversationId: conversationId.current,
          guardrailsEnabled
        })
      });
      const body = await response.json();
      if (body?.guardrails) setLatestGuardrailRun(body.guardrails);
      if (!response.ok) throw new Error(body.error || "Prompt failed.");
      conversationId.current = body.conversationId;
      const history = Array.isArray(body.history) ? body.history : [];
      const toolHistory = Array.isArray(body.toolHistory) ? body.toolHistory : [];
      const executedRoutes = history
        .map((item: EcoHistoryItem) => getTceqRouteForAgentName(item.agentName))
        .filter((route: TceqAgentRoute | null): route is TceqAgentRoute => Boolean(route))
        .filter((route: TceqAgentRoute, index: number, routes: TceqAgentRoute[]) =>
          routes.findIndex((candidate) => candidate.id === route.id) === index
        );
      setActiveRoutes(executedRoutes);
      setActiveRoute(executedRoutes[0] || null);
      const nextResult = { prompt: body.prompt, response: body.response, history, toolHistory, guardrails: body.guardrails };
      setResult(nextResult);
      setTurns((currentTurns) => [...currentTurns, nextResult]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prompt failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <form onSubmit={submit} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
        <div className="flex items-end gap-3">
          <label className="sr-only" htmlFor="conversation-prompt">
            Ask ConversationsAI
          </label>
          <textarea
            id="conversation-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={2}
            placeholder="Ask an EcoAgency question..."
            className="min-h-14 flex-1 resize-none rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#8f3b2f] focus:bg-white focus:ring-2 focus:ring-[#8f3b2f]/15"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            aria-label="Run prompt"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#8f3b2f] text-white transition hover:bg-[#733126] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-stone-600">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#8f3b2f]" />
            <span className="shrink-0">Showcase prompt</span>
            <select
              value=""
              onChange={(event) => setPrompt(event.target.value)}
              disabled={loading}
              aria-label="Choose a showcase prompt"
              className="min-w-0 max-w-full rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-700 outline-none transition hover:bg-white focus:border-[#8f3b2f] focus:ring-2 focus:ring-[#8f3b2f]/15 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-md"
            >
              <option value="">Choose a validated example…</option>
              {showcasePrompts.map((example) => (
                <option key={example.label} value={example.prompt}>
                  {example.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${turns.length ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>
              <MessageCircle className="h-3.5 w-3.5" />
              {turns.length ? `Conversation active · ${turns.length} turn${turns.length === 1 ? "" : "s"}` : "New conversation"}
            </span>
            <button
              type="button"
              onClick={startNewConversation}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </form>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-h-80 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        {!result && !loading && (
          <div className="flex min-h-64 items-center justify-center text-center">
            <div>
              <h2 className="text-xl font-bold text-stone-950">ConversationsAI</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                Enter a prompt and the app will call Oracle Select AI Agent from the server.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex min-h-64 items-center justify-center text-center">
            <div className="w-full max-w-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff3ef] text-[#8f3b2f]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <p className="mt-4 text-base font-bold text-stone-950">
                Running {activeRoute?.agentName || "Select AI Agent"}...
              </p>
              {activeRoute && (
                <>
                  <p className="mt-2 text-sm text-stone-600">{activeRoute.task}</p>
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-stone-500">
                    <span className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
                      <Bot className="h-3.5 w-3.5" />
                      Supervisor
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#8f3b2f]" />
                    <span className="rounded-full bg-[#fff3ef] px-3 py-1.5 text-[#8f3b2f]">{activeRoute.agentName}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-5">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Submitted request</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-800">{result.prompt}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <div className="flex flex-col justify-between gap-3 border-b border-stone-200 bg-[#fcfbfa] px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      resultFailed ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {resultFailed ? <CircleX className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-stone-950">{resultFailed ? "Analysis failed" : "Analysis complete"}</div>
                  </div>
                </div>
                {activeRoutes.length > 0 && (
                  <div className="sm:max-w-sm sm:text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8f3b2f]/70">Executed by</div>
                    <div className="mt-0.5 text-xs font-bold text-[#8f3b2f]">
                      {activeRoutes.length > 1 ? `Supervisor + ${activeRoutes.length} specialists` : activeRoutes[0].agentName}
                    </div>
                    <div className="mt-0.5 text-[11px] leading-4 text-stone-600">
                      {activeRoutes.length > 1 ? "Coordinate source-separated cross-domain analysis" : activeRoutes[0].task}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 py-5 sm:px-6">
                {resultIsCrossDomain ? (
                  <CrossDomainReport response={result.response} toolHistory={result.toolHistory} />
                ) : (
                  <FormattedAgentResponse
                    response={result.response}
                    reportTitle={resultIsKnowledgeGuidance ? "Knowledge Base Guidance" : activeRoute?.reportTitle || "Analysis Summary"}
                    formatFindings={!resultIsKnowledgeGuidance}
                  />
                )}
                {!resultFailed && !resultIsCrossDomain && <DeterministicResponseChart response={result.response} />}
                {resultIsKnowledgeGuidance && (
                  <KnowledgeGroundingGuidance
                    ragObserved={result.toolHistory.some((item) => item.toolName === "COMPLAINT_RAG_TOOL")}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </section>
        <aside className="order-first space-y-5 xl:order-last xl:sticky xl:top-5">
          <LiveOrchestrationPanel
            routes={activeRoutes}
            status={loading ? "running" : error || resultFailed ? "error" : result ? "complete" : "idle"}
          />
          <ToolEvidencePanel
            routes={activeRoutes}
            history={result?.history || []}
            toolHistory={result?.toolHistory || []}
            response={result?.response}
          />
          <ConversationVisibilityPanel turns={turns} />
        </aside>
      </div>

      <OciGuardrailsControl
        enabled={guardrailsEnabled}
        onEnabledChange={(enabled) => {
          setGuardrailsEnabled(enabled);
          setLatestGuardrailRun(null);
        }}
        serviceStatus={guardrailServiceStatus}
        latestRun={latestGuardrailRun}
        disabled={loading}
      />
    </div>
  );
}
