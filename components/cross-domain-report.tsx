import { CheckCircle2, ClipboardList, Droplets, ShieldAlert } from "lucide-react";
import type { EcoToolHistoryItem } from "@/lib/ecoagency-types";

type CrossDomainMetric = {
  id: "complaint" | "spill" | "water";
  label: string;
  count: number;
  countLabel: string;
  detail: string;
  toolName: string;
};

const domainConfig = {
  complaint: {
    label: "Complaint",
    countLabel: "complaint records",
    toolName: "COMPLAINT_SQL",
    icon: ClipboardList
  },
  spill: {
    label: "Spill Response",
    countLabel: "distinct spill incidents",
    toolName: "TCEQ_SPILL_RESPONSE_SQL_TOOL_V1",
    icon: ShieldAlert
  },
  water: {
    label: "Water Quality",
    countLabel: "measurement rows",
    toolName: "TCEQ_WATER_QUALITY_SQL_TOOL_V1",
    icon: Droplets
  }
} as const;

function domainId(label: string): CrossDomainMetric["id"] | null {
  const normalized = label.toLowerCase();
  if (normalized === "complaint") return "complaint";
  if (normalized === "spill response") return "spill";
  if (normalized === "water quality") return "water";
  return null;
}

export function extractCrossDomainMetrics(response: string): CrossDomainMetric[] {
  const metrics: CrossDomainMetric[] = [];
  const matches = response
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s*/, "").replace(/^\*\*(.+?)\*\*\s*/, "$1 "))
    .map((line) => line.match(/^(Complaint|Spill Response|Water Quality)\s*[-:\u2013\u2014]\s*([\d,]+)\s+(.+)$/i))
    .filter((match): match is RegExpMatchArray => Boolean(match));

  for (const match of matches) {
    const id = domainId(match[1]);
    const count = Number(match[2].replace(/,/g, ""));
    if (!id || !Number.isFinite(count)) continue;
    const config = domainConfig[id];
    metrics.push({
      id,
      label: config.label,
      count,
      countLabel: config.countLabel,
      detail: match[3].replace(/\s+/g, " ").trim(),
      toolName: config.toolName
    });
  }

  return Array.from(new Map(metrics.map((metric) => [metric.id, metric])).values());
}

export function isCrossDomainResponse(response: string) {
  return extractCrossDomainMetrics(response).length === 3;
}

export function CrossDomainReport({
  response,
  toolHistory
}: {
  response: string;
  toolHistory: EcoToolHistoryItem[];
}) {
  const metrics = extractCrossDomainMetrics(response);
  if (metrics.length !== 3) return null;

  const observedTools = new Set(toolHistory.map((item) => item.toolName).filter(Boolean));

  return (
    <section aria-labelledby="cross-domain-report-title">
      <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f3b2f]">Supervisor synthesis</p>
          <h2 id="cross-domain-report-title" className="mt-1 text-xl font-bold tracking-tight text-stone-950">
            Cross-domain executive report
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
            Source-separated results from complaint, spill-response, and water-quality specialists.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          3 sources reconciled
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = domainConfig[metric.id].icon;
          const toolObserved = observedTools.has(metric.toolName);
          return (
            <article key={metric.id} className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#0b6b66] ring-1 ring-inset ring-stone-200">
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${toolObserved ? "text-emerald-700" : "text-amber-700"}`}>
                  {toolObserved ? "Tool observed" : "Unverified"}
                </span>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-stone-500">{metric.label}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-stone-950">{metric.count.toLocaleString("en-US")}</p>
              <p className="mt-1 text-xs font-semibold text-stone-700">{metric.countLabel}</p>
              <p className="mt-3 border-t border-stone-200 pt-3 text-[11px] leading-5 text-stone-500">{metric.detail}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-[#0b6b66]/20 bg-[#f2f8f7] px-4 py-3.5">
        <p className="text-xs font-bold text-stone-900">Interpretation boundary</p>
        <p className="mt-1 text-xs leading-5 text-stone-600">
          These are side-by-side source results with different units and scopes. They support a coordinated briefing, but they do not by themselves establish relative severity or causation between complaints, spill incidents, and water measurements.
        </p>
      </div>
    </section>
  );
}
