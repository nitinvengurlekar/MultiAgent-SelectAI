import { EcoNav } from "@/components/eco-nav";
import { ScenarioCard } from "@/components/scenario-card";
import { ecoScenarios } from "@/lib/ecoagency-scenarios";

export default function ScenariosPage() {
  return (
    <>
      <EcoNav />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-[#8f3b2f]">RTF-derived prompt catalog</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950">EcoAgency Scenarios</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            Each card runs a curated Select AI Agent prompt through Oracle Autonomous Database and presents the result as a live customer demo.
          </p>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ecoScenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-sm text-stone-500">Powered by Oracle Select AI Agent.</footer>
    </>
  );
}
