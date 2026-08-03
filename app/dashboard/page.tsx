import Link from "next/link";
import { ArrowRight, Bot, Database, Globe2, History, LibraryBig } from "lucide-react";
import { EcoNav } from "@/components/eco-nav";
import { EcoBadge } from "@/components/eco-badge";
import { ScenarioCard } from "@/components/scenario-card";
import { HistoryTable } from "@/components/history-table";
import { ecoScenarios } from "@/lib/ecoagency-scenarios";
import { getEcoConfigStatus } from "@/lib/ecoagency-db";
import { getAgentHistory } from "@/lib/ecoagency-agent";
import type { EcoHistoryItem } from "@/lib/ecoagency-types";

export default async function DashboardPage() {
  const status = getEcoConfigStatus();
  let history: EcoHistoryItem[] = [];
  try {
    history = await getAgentHistory(5);
  } catch {
    history = [];
  }

  const metrics = [
    { label: "Guided scenarios", value: ecoScenarios.length, icon: Bot },
    { label: "Agent team", value: "1", icon: Database },
    { label: "Context sources", value: "3", icon: Globe2 },
    { label: "History records", value: history.length, icon: History }
  ];

  return (
    <>
      <EcoNav />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#8f3b2f]">EcoAgency demo control room</p>
              <h1 className="mt-2 text-3xl font-bold text-stone-950">Select AI Agent Dashboard</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
                Show how an environmental agency can ask complex complaint questions and let Oracle coordinate governed data,
                MCP tools, web context, and knowledge-base evidence.
              </p>
            </div>
            <EcoBadge tone={status.configured ? "green" : "amber"}>
              {status.configured ? `DB configured: ${status.user}` : "DB config incomplete"}
            </EcoBadge>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-stone-500">{metric.label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#fff3ef] text-[#8f3b2f]">
                  <metric.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-stone-950">{metric.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.72fr_0.28fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-950">Featured scenarios</h2>
              <Link href="/scenarios" className="flex items-center gap-2 text-sm font-bold text-[#8f3b2f]">
                All scenarios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {ecoScenarios.slice(0, 2).map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} />
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-[#8f3b2f]/20 bg-[#fff8f5] p-5">
            <LibraryBig className="mb-4 h-6 w-6 text-[#8f3b2f]" />
            <h2 className="text-lg font-bold text-stone-950">What this proves</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              Oracle Autonomous Database can act as the secure execution point for agentic workflows, combining internal
              complaint data with MCP-accessible context and knowledge-base evidence.
            </p>
          </aside>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-950">Recent agent activity</h2>
            <EcoBadge>Execution history</EcoBadge>
          </div>
          <HistoryTable history={history} />
        </section>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-sm text-stone-500">Powered by Oracle Select AI Agent.</footer>
    </>
  );
}
