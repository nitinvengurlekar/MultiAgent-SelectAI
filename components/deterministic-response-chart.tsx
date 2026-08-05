import { BarChart3 } from "lucide-react";
import { extractResponseFindings } from "@/components/formatted-agent-response";

export function DeterministicResponseChart({ response }: { response: string }) {
  const statuses = extractResponseFindings(response)
    .map((finding) => finding.status?.trim())
    .filter((status): status is string => Boolean(status));

  if (!statuses.length) return null;

  const counts = Array.from(
    statuses.reduce((result, status) => {
      const label = status.replace(/\s+/g, " ").trim();
      result.set(label, (result.get(label) || 0) + 1);
      return result;
    }, new Map<string, number>())
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const maximum = Math.max(...counts.map((item) => item.count));

  return (
    <section className="mt-6 rounded-xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5" aria-labelledby="status-chart-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#0b6b66]">
            <BarChart3 className="h-4 w-4" />
            <h3 id="status-chart-title" className="text-sm font-bold text-stone-950">
              Displayed records by status
            </h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Deterministically calculated from {statuses.length} displayed record{statuses.length === 1 ? "" : "s"} with an explicit status.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0b6b66] ring-1 ring-inset ring-stone-200">
          Verified data
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {counts.map(({ label, count }) => (
          <div key={label} className="grid grid-cols-[minmax(5rem,8rem)_1fr_1.5rem] items-center gap-3">
            <span className="truncate text-xs font-semibold text-stone-700" title={label}>
              {label}
            </span>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
              <div
                className="h-full rounded-full bg-[#0b6b66]"
                style={{ width: `${Math.max(8, (count / maximum) * 100)}%` }}
              />
            </div>
            <span className="text-right text-xs font-bold tabular-nums text-stone-800">{count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
