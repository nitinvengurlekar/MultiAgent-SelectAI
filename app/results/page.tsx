import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { QueryPanel } from "@/components/query-panel";
import { getSession } from "@/lib/auth";
import { getPersona } from "@/lib/personas";
import { runAsPersona } from "@/lib/db";
import { runComplaintQuery } from "@/lib/sql";

export default async function ResultsPage() {
  const session = await getSession();
  if (!session) redirect("/deepsec/login");
  const persona = getPersona(session.personaId);
  if (!persona) redirect("/deepsec/login");

  const result = await runAsPersona(persona, (connection) => runComplaintQuery(connection));

  return (
    <>
      <Nav user={session.displayName} />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-950">Complaint Data Explorer</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              Run the same query as another user to see how the result set changes.
            </p>
          </div>
          <span className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white">{session.displayName}</span>
        </div>
        <div className="mb-5 rounded-lg border border-[#b33f2d]/20 bg-[#fff8f5] px-5 py-4 text-sm leading-6 text-stone-700">
          {session.personaId === "naveen"
            ? "Naveen can see only his allowed region. For NOV rows, REGULATED_ENTITY_NAME is masked by Oracle Deep Data Security and returns as a blank value."
            : "Nisha is the highly privileged user. She can see broader rows and regulated entity names before the Naveen mask is applied."}
        </div>
        <QueryPanel initialResult={result} />
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-sm text-stone-500">Security enforced by Oracle Deep Data Security.</footer>
    </>
  );
}
