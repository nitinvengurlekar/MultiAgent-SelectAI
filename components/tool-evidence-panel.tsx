import { CheckCircle2, CircleDashed, Database, FileSearch, Wrench } from "lucide-react";
import type { EcoHistoryItem, EcoToolHistoryItem } from "@/lib/ecoagency-types";
import type { TceqAgentRoute, TceqSpecialistId } from "@/lib/tceq-agent-routing";

const configuredTools: Record<TceqSpecialistId, string[]> = {
  complaint: ["COMPLAINT_SQL", "COMPLAINT_RAG_TOOL", "WEBSEARCH_TCEQ"],
  water: ["TCEQ_WATER_QUALITY_SQL_TOOL_V1"],
  spill: ["TCEQ_SPILL_RESPONSE_SQL_TOOL_V1"]
};

export function ToolEvidencePanel({
  routes,
  history,
  toolHistory,
  response
}: {
  routes: TceqAgentRoute[];
  history: EcoHistoryItem[];
  toolHistory: EcoToolHistoryItem[];
  response?: string;
}) {
  const tools = Array.from(new Set(routes.flatMap((route) => configuredTools[route.id])));
  const observedTools = new Set(toolHistory.map((item) => item.toolName).filter(Boolean));
  const observedAgents = Array.from(new Set(history.map((item) => item.agentName).filter(Boolean))) as string[];
  const hasKnowledgeCitation = Boolean(response && /\b(?:evidence|source|reference|document)s?\s*:/i.test(response));

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-[#0b6b66]" />
        <h3 className="text-sm font-bold text-stone-950">Tools &amp; evidence</h3>
      </div>
      <p className="mt-1 text-xs leading-5 text-stone-500">Configured capabilities are separated from execution evidence.</p>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-[#0b6b66]" />
              <p className="text-xs font-bold text-stone-800">Configured tools</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Available</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tools.map((tool) => (
              <span key={tool} className={`rounded-md px-2 py-1 font-mono text-[9px] ring-1 ring-inset ${observedTools.has(tool) ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-stone-600 ring-stone-200"}`}>
                {tool}{observedTools.has(tool) ? " · observed" : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
          <div className="flex items-center gap-2">
            {observedAgents.length ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <CircleDashed className="h-3.5 w-3.5 text-stone-400" />
            )}
            <p className="text-xs font-bold text-stone-800">Oracle execution history</p>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-stone-500">
            {observedAgents.length ? observedAgents.join(" · ") : "No completed execution observed yet."}
          </p>
        </div>

        <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
          <div className="flex items-center gap-2">
            <FileSearch className={`h-3.5 w-3.5 ${hasKnowledgeCitation ? "text-emerald-600" : "text-stone-400"}`} />
            <p className="text-xs font-bold text-stone-800">Knowledge-base evidence</p>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-stone-500">
            {observedTools.has("COMPLAINT_RAG_TOOL")
              ? "COMPLAINT_RAG_TOOL invocation observed in Oracle history."
              : hasKnowledgeCitation
                ? "Citation labels observed in the response."
                : "No RAG invocation or citation label observed."}
          </p>
        </div>
      </div>
    </section>
  );
}
