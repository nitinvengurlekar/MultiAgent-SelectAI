import { AlertTriangle, CheckCircle2, ShieldCheck, ShieldOff } from "lucide-react";
import type { GuardrailRun, GuardrailServiceStatus, GuardrailStageResult } from "@/lib/guardrail-types";

function stageSummary(label: string, result?: GuardrailStageResult) {
  if (!result) return { label, value: "Not evaluated", tone: "text-stone-500" };
  if (result.status === "unavailable") return { label, value: "Unavailable", tone: "text-amber-800" };
  if (result.contentModerationFlagged) return { label, value: "Content flagged", tone: "text-red-700" };
  if (result.promptInjectionFlagged) return { label, value: "Injection flagged", tone: "text-red-700" };
  if (result.piiCount) {
    return {
      label,
      value: `${result.piiCount} PII item${result.piiCount === 1 ? "" : "s"} · ${result.piiLabels.join(", ")}`,
      tone: "text-amber-800"
    };
  }
  return { label, value: "Passed", tone: "text-emerald-700" };
}

export function OciGuardrailsControl({
  enabled,
  onEnabledChange,
  serviceStatus,
  latestRun,
  disabled
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  serviceStatus: GuardrailServiceStatus | null;
  latestRun: GuardrailRun | null;
  disabled?: boolean;
}) {
  const configured = serviceStatus?.configured === true;
  const statusPending = serviceStatus === null;
  const input = stageSummary("Input", latestRun?.input);
  const output = stageSummary("Output", latestRun?.output);
  const action = !configured
    ? { value: statusPending ? "Checking deployment" : "Configuration required", warning: true }
    : latestRun?.redactedCount
      ? {
          value: `${latestRun.redactedCount} sensitive item${latestRun.redactedCount === 1 ? "" : "s"} redacted`,
          warning: true
        }
      : latestRun?.output
        ? { value: "No sensitive output detected", warning: false }
        : { value: "Awaiting execution", warning: false };

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" aria-labelledby="oci-guardrails-title">
      <div className="flex flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
            {enabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="oci-guardrails-title" className="text-sm font-bold text-stone-950">OCI Guardrails</h3>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${configured ? "bg-emerald-50 text-emerald-800" : statusPending ? "bg-stone-100 text-stone-600" : "bg-amber-50 text-amber-900"}`}>
                {configured ? "Deployed" : statusPending ? "Checking deployment" : "Configuration required"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              {enabled
                ? configured
                  ? "Inspect the prompt and generated response; redact detected output PII before display."
                  : "Protection is selected, but server-side OCI authentication and compartment configuration are missing."
                : "Guardrails are off. Prompts and generated responses follow the standard demo path."}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle OCI Guardrails"
          disabled={disabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${enabled ? "bg-[#0b6b66]" : "bg-stone-300"} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      {enabled && (
        <div className="grid gap-px border-t border-stone-200 bg-stone-200 sm:grid-cols-3">
          {[input, output].map((item) => (
            <div key={item.label} className="bg-stone-50 px-5 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{item.label} inspection</p>
              <p className={`mt-1 text-xs font-bold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
          <div className="bg-stone-50 px-5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Protection action</p>
            <div className="mt-1 flex items-center gap-1.5">
              {action.warning ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <p className={`text-xs font-bold ${action.warning ? "text-amber-800" : "text-stone-600"}`}>
                {action.value}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
