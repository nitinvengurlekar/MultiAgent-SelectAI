import { EcoNav } from "@/components/eco-nav";
import { ConversationsAiPanel } from "@/components/conversations-ai-panel";

export default function ConversationsAiPage() {
  return (
    <>
      <EcoNav />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-[#8f3b2f]">Oracle Select AI Agent</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950">ConversationsAI</h1>
        </section>
        <ConversationsAiPanel />
      </main>
    </>
  );
}
