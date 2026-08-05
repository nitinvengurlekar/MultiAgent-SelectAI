import type { ReactNode } from "react";

export type ResponseFinding = {
  trackingNumber: string | null;
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

export function parseResponseFinding(text: string): ResponseFinding {
  const parseText = text.replace(/\*\*/g, "");
  const pipeSegments = parseText.split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
  if (pipeSegments.length > 1) {
    const fields = new Map(
      pipeSegments.map((segment) => {
        const match = segment.match(/^([^:]+):\s*(.*)$/);
        return [match?.[1]?.trim().toLowerCase() || "details", match?.[2]?.trim() || segment];
      })
    );

    return {
      trackingNumber:
        fields.get("tracking number") ||
        fields.get("complaint tracking number") ||
        fields.get("tracking no") ||
        fields.get("tracking #") ||
        null,
      location: fields.get("location") || null,
      status: fields.get("status") || null,
      details:
        fields.get("incident summary") ||
        fields.get("details") ||
        fields.get("incident") ||
        fields.get("summary") ||
        "",
      impact: fields.get("impact") || fields.get("potential impact") || null
    };
  }

  const labeledFields = new Map<string, string>();
  const fieldPattern = /\b(Tracking Number|Complaint Tracking Number|Tracking No|Tracking #|Location|Status|Incident Summary|Incident|Summary|Potential Impact|Impact):\s*(.*?)(?=,\s*(?:Tracking Number|Complaint Tracking Number|Tracking No|Tracking #|Location|Status|Incident Summary|Incident|Summary|Potential Impact|Impact):|$)/gi;
  for (const match of parseText.matchAll(fieldPattern)) {
    labeledFields.set(match[1].toLowerCase(), match[2].trim());
  }
  if (labeledFields.size > 1) {
    return {
      trackingNumber:
        labeledFields.get("tracking number") ||
        labeledFields.get("complaint tracking number") ||
        labeledFields.get("tracking no") ||
        labeledFields.get("tracking #") ||
        null,
      location: labeledFields.get("location") || null,
      status: labeledFields.get("status") || null,
      details:
        labeledFields.get("incident summary") ||
        labeledFields.get("incident") ||
        labeledFields.get("summary") ||
        "",
      impact: labeledFields.get("potential impact") || labeledFields.get("impact") || null
    };
  }

  const segments = parseText.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  const statusIndex = segments.findIndex((part) => /^status\s*:/i.test(part));
  const location = segments.length > 1 && statusIndex > 0 ? segments[0] : null;
  const status = statusIndex >= 0 ? segments[statusIndex].replace(/^status\s*:\s*/i, "") : null;
  const narrativeParts = segments.filter((_, index) => index !== statusIndex && (!location || index !== 0));
  const narrative = (narrativeParts.length ? narrativeParts : [parseText]).join(" — ");
  const impactMatch = narrative.match(/^(.*?)(?=\b(?:Potential|Possible|Environmental impact|Risk of)\b)(.*)$/i);

  return {
    trackingNumber: null,
    location,
    status,
    details: impactMatch?.[1]?.trim() || narrative,
    impact: impactMatch?.[2]?.trim() || null
  };
}

export function extractResponseFindings(response: string): ResponseFinding[] {
  const normalized = response.replace(/\r\n/g, "\n");
  const inlineMarkers = Array.from(normalized.matchAll(/(?:^|\s)(\d+)[.)]\s+(?=(?:\*\*)?(?:Tracking|Complaint Tracking|Location|Status|Incident)\b)/g));
  if (inlineMarkers.length) {
    return inlineMarkers.map((marker, index) => {
      const start = (marker.index || 0) + marker[0].length;
      const end = inlineMarkers[index + 1]?.index ?? normalized.length;
      return parseResponseFinding(normalized.slice(start, end).trim());
    });
  }

  const records: string[] = [];
  let current = "";

  for (const rawLine of normalized.split("\n")) {
    const numbered = rawLine.trim().match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      if (current) records.push(current);
      current = numbered[1];
    } else if (current && rawLine.trim() && !/^#{1,4}\s+/.test(rawLine.trim())) {
      current += ` ${rawLine.trim()}`;
    } else if (current && /^#{1,4}\s+/.test(rawLine.trim())) {
      records.push(current);
      current = "";
    }
  }

  if (current) records.push(current);
  return records.map(parseResponseFinding);
}

function statusTone(status: string) {
  return /open|active|pending|investigat/i.test(status)
    ? "bg-amber-50 text-amber-800 ring-amber-200"
    : "bg-emerald-50 text-emerald-800 ring-emerald-200";
}

export function FormattedAgentResponse({
  response,
  reportTitle,
  formatFindings = true
}: {
  response: string;
  reportTitle: string;
  formatFindings?: boolean;
}) {
  const normalizedResponse = response.replace(/\r\n/g, "\n");
  const lines = (formatFindings
    ? normalizedResponse.replace(/\s+(?=\d+[.)]\s+(?:\*\*)?(?:Tracking|Complaint Tracking|Location|Status|Incident)\b)/g, "\n")
    : normalizedResponse
  ).split("\n");
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
          if (!formatFindings) {
            return (
              <div key={`number-${index}`} className="flex gap-3 py-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-[#8f3b2f]">
                  {numbered[1]}
                </span>
                <p className="min-w-0 flex-1">{formatInline(numbered[2])}</p>
              </div>
            );
          }
          const finding = parseResponseFinding(numbered[2]);
          return (
            <article key={`number-${index}`} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_8px_24px_-22px_#1c1917]">
              <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 bg-stone-50/70 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8f3b2f] text-xs font-bold text-white">
                  {numbered[1]}
                </span>
                <h3 className="min-w-0 flex-1 text-sm font-bold text-stone-950">
                  {finding.trackingNumber ? `Tracking #${finding.trackingNumber}` : finding.location || `Finding ${numbered[1]}`}
                </h3>
                {finding.status && (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusTone(finding.status)}`}>
                    {finding.status}
                  </span>
                )}
              </div>
              <div className="space-y-4 px-4 py-4">
                {finding.location && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Location</div>
                    <p className="mt-1 text-sm font-semibold text-stone-800">{formatInline(finding.location)}</p>
                  </div>
                )}
                {finding.details && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Incident summary</div>
                    <p className="mt-1">{formatInline(finding.details)}</p>
                  </div>
                )}
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
