import Link from "next/link";
import { ArrowRight, Bot, Database, Network, ShieldCheck } from "lucide-react";
import { EcoNav } from "@/components/eco-nav";
import { EcoBadge } from "@/components/eco-badge";
import { getSession } from "@/lib/auth";

export default async function DemoModePage() {
  const session = await getSession();
  const deepSecHref = session ? "/deepsec/dashboard" : "/deepsec/login";

  return (
    <>
      <EcoNav />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-[#8f3b2f]">Demo mode</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950">Choose the live demo path</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            Run the conversational agent flow, or switch into Deep Data Security to show database-enforced row access with
            local end users.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-lg border border-[#0b6b66]/25 bg-[#f2fbf9] p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#0b6b66]">
                <Network className="h-6 w-6" />
              </span>
              <EcoBadge tone="green">MultiAgent</EcoBadge>
            </div>
            <h2 className="text-2xl font-bold text-stone-950">TCEQ Control Room</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              See the Supervisor route environmental questions to complaint, water quality, and spill response specialists,
              with a clear tool and execution trace.
            </p>
            <Link
              href="/tceq"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#0b6b66] px-4 text-sm font-bold text-white transition hover:bg-[#075752]"
            >
              Open TCEQ experience
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fff3ef] text-[#8f3b2f]">
                <Bot className="h-6 w-6" />
              </span>
              <EcoBadge tone="blue">Select AI Agent</EcoBadge>
            </div>
            <h2 className="text-2xl font-bold text-stone-950">ConversationsAI</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Ask EcoAgency questions in natural language and let Oracle Select AI Agent coordinate data, tools, and
              evidence.
            </p>
            <Link
              href="/conversations-ai"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-md border border-stone-200 bg-white px-4 text-sm font-bold text-stone-800 transition hover:bg-stone-100"
            >
              Open ConversationsAI
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-lg border border-[#b33f2d]/25 bg-[#fff8f5] p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#b33f2d]">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <EcoBadge tone="amber">Deep Data Security</EcoBadge>
            </div>
            <h2 className="text-2xl font-bold text-stone-950">DeepSec</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              Log in as Nisha or Naveen and run the same complaint query. Oracle Deep Data Security controls which rows are
              visible at query time.
            </p>
            <div className="mt-4 rounded-md border border-[#b33f2d]/15 bg-white px-4 py-3">
              <h3 className="text-sm font-bold text-stone-950">What to show live</h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Log out, switch users, and run the same query again. The visible row set changes without adding UI-side
                filtering logic.
              </p>
            </div>
            {session && (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                DeepSec session active: {session.displayName}
              </div>
            )}
            <Link
              href={deepSecHref}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#b33f2d] px-4 text-sm font-bold text-white transition hover:bg-[#963322]"
            >
              {session ? "Open DeepSec dashboard" : "Start DeepSec login"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Database className="mt-1 h-5 w-5 text-stone-500" />
            <p className="text-sm leading-6 text-stone-600">
              Both paths keep database access on the server. The DeepSec path uses local database users only, with no IAM or
              OAuth in this version.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
