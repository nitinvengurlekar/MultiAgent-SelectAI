import type { ReactNode } from "react";

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

export function FormattedAgentResponse({ response }: { response: string }) {
  const lines = response.replace(/\r\n/g, "\n").split("\n");

  return (
    <div className="space-y-3 text-[15px] leading-7 text-stone-700">
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
          return (
            <div key={`number-${index}`} className="flex gap-3 pl-1">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff3ef] text-xs font-bold text-[#8f3b2f]">
                {numbered[1]}
              </span>
              <p>{formatInline(numbered[2])}</p>
            </div>
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

        return <p key={`paragraph-${index}`}>{formatInline(line)}</p>;
      })}
    </div>
  );
}
