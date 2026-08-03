import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import type { EcoScenario } from "@/lib/ecoagency-types";
import { EcoBadge } from "@/components/eco-badge";

export function ScenarioCard({ scenario }: { scenario: EcoScenario }) {
  return (
    <Link
      href={`/scenarios/${scenario.id}`}
      className="group rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#8f3b2f]/40 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff3ef] text-[#8f3b2f]">
          <Bot className="h-5 w-5" />
        </span>
        <EcoBadge tone="blue">{scenario.category}</EcoBadge>
      </div>
      <h3 className="text-lg font-bold text-stone-950">{scenario.title}</h3>
      <p className="mt-2 min-h-16 text-sm leading-6 text-stone-600">{scenario.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {scenario.badges.slice(0, 3).map((badge) => (
          <EcoBadge key={badge}>{badge}</EcoBadge>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#8f3b2f]">
        Open scenario
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
