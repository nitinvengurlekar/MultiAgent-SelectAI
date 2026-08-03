import { notFound } from "next/navigation";
import { EcoNav } from "@/components/eco-nav";
import { EcoBadge } from "@/components/eco-badge";
import { ScenarioRunner } from "@/components/scenario-runner";
import { getScenario } from "@/lib/ecoagency-scenarios";
import { getAgentHistory } from "@/lib/ecoagency-agent";
import type { EcoHistoryItem } from "@/lib/ecoagency-types";

export default async function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = getScenario(id);
  if (!scenario) notFound();

  let history: EcoHistoryItem[] = [];
  try {
    history = await getAgentHistory(5);
  } catch {
    history = [];
  }

  return (
    <>
      <EcoNav />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#8f3b2f]">{scenario.category}</p>
              <h1 className="mt-2 text-3xl font-bold text-stone-950">{scenario.title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">{scenario.summary}</p>
            </div>
            <div className="flex max-w-md flex-wrap gap-2">
              {scenario.badges.map((badge) => (
                <EcoBadge key={badge} tone={badge.includes("Web") ? "amber" : badge.includes("Select") ? "blue" : "stone"}>
                  {badge}
                </EcoBadge>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.36fr_0.64fr]">
          <aside className="space-y-4">
            {[
              ["What you are seeing", scenario.whatYouAreSeeing],
              ["Why this matters", scenario.whyItMatters],
              ["Expected result", scenario.expectedResult],
              ["Presenter notes", scenario.presenterNotes]
            ].map(([title, text]) => (
              <section key={title} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-700">{text}</p>
              </section>
            ))}
            <section className="rounded-lg border border-stone-800 bg-stone-950 p-5 text-stone-100 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-400">Prompt</h2>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6">{scenario.prompt}</pre>
            </section>
          </aside>

          <ScenarioRunner scenario={scenario} initialHistory={history} />
        </div>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-sm text-stone-500">Powered by Oracle Select AI Agent.</footer>
    </>
  );
}
