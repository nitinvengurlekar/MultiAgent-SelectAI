import Link from "next/link";
import { ArrowRight, Bot, Database, ShieldCheck } from "lucide-react";
import { EcoNav } from "@/components/eco-nav";
import { EcoBadge } from "@/components/eco-badge";

export default function Home() {
  return (
    <>
      <EcoNav />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <section>
          <div className="mb-5 flex flex-wrap gap-2">
            <EcoBadge tone="green">Autonomous Database</EcoBadge>
            <EcoBadge tone="blue">Select AI Agent</EcoBadge>
            <EcoBadge tone="amber">MCP Tools</EcoBadge>
          </div>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-stone-950 md:text-5xl">
            EcoAgency Agentic Intelligence Demo
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-600">
            Run environmental complaint assessment prompts through Oracle Select AI Agent, backed by governed database data,
            knowledge-base evidence, and MCP-enabled external context.
          </p>
          <div className="mt-8">
            <Link
              href="/conversations-ai"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-[#8f3b2f] px-5 text-sm font-bold text-white transition hover:bg-[#733126]"
            >
              Enter demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Bot,
                title: "Agentic analysis",
                text: "Natural-language prompts coordinate database retrieval, MCP tools, and report generation."
              },
              {
                icon: Database,
                title: "Grounded in Oracle",
                text: "The app calls Oracle Autonomous Database from server routes using the Oracle Node driver."
              },
              {
                icon: ShieldCheck,
                title: "Presenter ready",
                text: "Concise screens make the security and agent workflow clear during live demos."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <item.icon className="mb-3 h-5 w-5 text-[#8f3b2f]" />
                <h2 className="font-bold text-stone-950">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-sm text-stone-500">Powered by Oracle Select AI Agent.</footer>
    </>
  );
}
