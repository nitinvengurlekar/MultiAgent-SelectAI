import type { ReactNode } from "react";

type Finding = {
  location: string | null;
  status: string | null;
  details: string;
  impact: string | null;
};

function formatInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${part}-${index}`} className="font-bold text-stone-950">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

function parseFinding(text: string): Finding {
  const pipeSegments = text.split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
  if (pipeSegments.length > 1) {
    const fields = new Map(
      pipeSegments.map((segment) => {
        const match = segment.match(/^([^:]+):\s*(.*)$/);
        return [match?.[1]?.trim().toLowerCase() || "details", match?.[2]?.trim() || segment];
      })
    );

    return {
      location: fields.get("location") || null,
      status: fields.get("status") || null,
      details: fields.get("details") || fields.get("incident") || fields.get("summary") || "",
      impact: fields.get("impact") || fields.get("potential impact") || null
    };
  }

  const segments = text.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  const statusIndex = segments.findIndex((part) => /^status\s*:/i.test(part));
  const location = segments.length > 1 && statusIndex > 0 ? segments[0] : null;
  const status = statusIndex >= 0 ? segments[statusIndex].replace(/^status\s*:\s*/i, "") : null;
  const narrativeParts = segments.filter((_, index) => index !== statusIndex && (!location || index !== 0));
  const narrative = (narrativeParts.length ? narrativeParts : [text]).join(" — ");
  const impactMatch = narrative.match(/^(.*?)(?=\b(?:Potential|Possible|Environmental impact|Risk of)\b)(.*)$/i);

  return {
    location,
    status,
    details: impactMatch?.[1]?.trim() || narrative,
    impact: impactMatch?.[2]?.trim() || null
  };
}

function statusTone(status: string) {
  return /open|active|pending|investigat/i.test(status)
    ? "bg-amber-50 text-amber-800 ring-amber-200"
    : "bg-emerald-50 text-emerald-800 ring-emerald-200";
}

export function FormattedAgentResponse({ response, reportTitle }: { response: string; reportTitle: string }) {
  const lines = response.replace(/\r\n/g, "\n").split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());

  return (
    <div className="text-[15px] leading-7 text-stone-700">
      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f3b2f]">Environmental analysis</div>
        <h2 className="mt-1 text-xl font-bold tracking-[-0.01em] text-stone-950">{reportTitle}</h2>
      </div>
      <div className="space-y-3">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={`space-${index}`} className="h-1" aria-hidden="true" />;

        const markdownHeading = line.match(/^#{1,4}\s+(.+)$/);
        if (markdownHeading) {
          return (
            <h3 key={`heading-${index}`} className="border-b border-stone-200 pb-2 pt-3 text-base font-bold text-stone-950">
              {formatInline(markdownHeading[1])}
            </h3>
          );
        }

        const bullet = line.match(/^[-*•]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={`bullet-${index}`} className="flex gap-3 pl-1">
              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8f3b2f]" />
              <p>{formatInline(bullet[1])}</p>
            </div>
          );
        }

        const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (numbered) {
          const finding = parseFinding(numbered[2]);
          return (
            <article key={`number-${index}`} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_8px_24px_-22px_#1c1917]">
              <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 bg-stone-50/70 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8f3b2f] text-xs font-bold text-white">
                  {numbered[1]}
                </span>
                <h3 className="min-w-0 flex-1 text-sm font-bold text-stone-950">{finding.location || `Finding ${numbered[1]}`}</h3>
                {finding.status && (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusTone(finding.status)}`}>
                    {finding.status}
                  </span>
                )}
              </div>
              <div className="space-y-4 px-4 py-4">
                {finding.details && <p>{formatInline(finding.details)}</p>}
                {finding.impact && (
                  <div className="rounded-lg border-l-2 border-amber-400 bg-amber-50/70 px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">Incident & potential impact</div>
                    <p className="mt-1 text-sm leading-6 text-stone-700">{formatInline(finding.impact)}</p>
                  </div>
                )}
              </div>
            </article>
          );
        }

        const labeledLine = line.match(/^([A-Za-z][A-Za-z /&-]{1,28}):\s*(.+)$/);
        if (labeledLine) {
          return (
            <div key={`label-${index}`} className="grid gap-1 rounded-lg bg-stone-50 px-4 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{labeledLine[1]}</span>
              <p>{formatInline(labeledLine[2])}</p>
            </div>
          );
        }

        if (line.length < 72 && line.endsWith(":")) {
          return (
            <h3 key={`section-${index}`} className="pt-3 text-base font-bold text-stone-950">
              {formatInline(line.slice(0, -1))}
            </h3>
          );
        }

        if (index === firstContentIndex) {
          return (
            <p key={`lead-${index}`} className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-base font-medium leading-7 text-stone-800">
              {formatInline(line)}
            </p>
          );
        }

        return <p key={`paragraph-${index}`}>{formatInline(line)}</p>;
      })}
      </div>
    </div>
  );
}
