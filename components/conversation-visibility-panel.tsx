import { MessageCircle } from "lucide-react";
import type { EcoHistoryItem } from "@/lib/ecoagency-types";

export type VisibleConversationTurn = {
  prompt: string;
  history: EcoHistoryItem[];
};

export function ConversationVisibilityPanel({ turns }: { turns: VisibleConversationTurn[] }) {
  if (!turns.length) return null;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#0b6b66]" />
          <h3 className="text-sm font-bold text-stone-950">Conversation</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
          Context active
        </span>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        {turns.length} turn{turns.length === 1 ? "" : "s"} retained in this Oracle conversation.
      </p>
      <ol className="mt-4 space-y-3">
        {turns.map((turn, index) => {
          const agents = Array.from(new Set(turn.history.map((item) => item.agentName).filter(Boolean))) as string[];
          return (
            <li key={`${index}-${turn.prompt}`} className="border-l-2 border-[#0b6b66]/25 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#0b6b66]">Turn {index + 1}</span>
                {agents.length > 0 && <span className="truncate text-[10px] text-stone-400">{agents.join(" · ")}</span>}
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-stone-600">{turn.prompt}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
