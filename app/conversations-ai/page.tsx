import { EcoNav } from "@/components/eco-nav";
import { ConversationsAiPanel } from "@/components/conversations-ai-panel";
import { Sparkles } from "lucide-react";

export default function ConversationsAiPage() {
  return (
    <>
      <EcoNav />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mx-auto mb-7 max-w-6xl text-center font-sans">
          <div className="flex items-center justify-center gap-2 text-xs font-normal uppercase tracking-[0.16em] text-[#0b6b66]">
            <Sparkles className="h-4 w-4" />
            Environmental operations workspace
          </div>
          <h1 className="mt-3 text-3xl font-normal leading-tight tracking-[-0.02em] text-stone-950 md:text-[2.15rem]">
            One question. The right specialist. A grounded answer.
          </h1>
          <p className="mx-auto mt-3 max-w-4xl text-base font-normal leading-7 text-stone-600">
            Supervisor Agent - Classifies intent, selects the specialist, coordinates tools, and assembles the final response
          </p>
        </section>
        <ConversationsAiPanel />
      </main>
    </>
  );
}
