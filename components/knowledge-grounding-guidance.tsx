import { BookOpenCheck, CheckCircle2, ShieldCheck, TriangleAlert } from "lucide-react";

export function KnowledgeGroundingGuidance({ ragObserved }: { ragObserved: boolean }) {
  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-[#0b6b66]/20 bg-[#f2f8f7]" aria-labelledby="knowledge-grounding-title">
      <div className="flex flex-col justify-between gap-3 border-b border-[#0b6b66]/10 px-4 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-[#0b6b66]" />
          <h3 id="knowledge-grounding-title" className="text-sm font-bold text-stone-950">Knowledge-base grounding</h3>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${ragObserved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
          {ragObserved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
          {ragObserved ? "RAG observed" : "RAG not observed"}
        </span>
      </div>
      <div className="grid gap-3 px-4 py-4 text-xs leading-5 text-stone-600 sm:grid-cols-2">
        <div className="rounded-lg bg-white/80 p-3 ring-1 ring-inset ring-[#0b6b66]/10">
          <div className="flex items-center gap-2 font-bold text-stone-800">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0b6b66]" />
            Bounded source scope
          </div>
          <p className="mt-1.5">Guidance is bounded to evidence retrieved from the configured TCEQ knowledge-base repository.</p>
        </div>
        <div className="rounded-lg bg-white/80 p-3 ring-1 ring-inset ring-[#0b6b66]/10">
          <div className="font-bold text-stone-800">Grounding status</div>
          <p className="mt-1.5">
            {ragObserved
              ? "Oracle execution history confirms COMPLAINT_RAG_TOOL was invoked for this response."
              : "Oracle execution history did not confirm a RAG invocation; treat this response as unverified."}
          </p>
        </div>
      </div>
      <p className="border-t border-[#0b6b66]/10 px-4 py-3 text-[11px] leading-5 text-stone-500">
        Program guidance is informational and is not a regulatory determination. Confirm current rule applicability, permit conditions, and enforcement requirements with authoritative TCEQ sources.
      </p>
    </section>
  );
}
