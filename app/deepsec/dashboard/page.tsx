import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/nav";
import { getSession } from "@/lib/auth";
import { getPersona } from "@/lib/personas";

export default async function DeepSecDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/deepsec/login");
  const persona = getPersona(session.personaId);
  if (!persona) redirect("/deepsec/login");

  return (
    <>
      <Nav user={session.displayName} />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-950">Welcome, {session.displayName}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
                You are now connected to the Oracle ADB demo environment. Deep Data Security controls what you can see at
                query time.
              </p>
            </div>
            <span className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white">{persona.role}</span>
          </div>
        </section>

        <section>
          <div className="rounded-lg border border-[#b33f2d]/25 bg-[#fff8f5] p-6 shadow-sm">
            <ShieldCheck className="mb-4 h-6 w-6 text-[#b33f2d]" />
            <h2 className="text-xl font-bold text-stone-950">Database-enforced access</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              The same SQL can return different results for different users because Oracle Deep Data Security applies row
              access rules based on the logged-in database user.
            </p>
            <Link
              href="/deepsec/results"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-[#b33f2d] px-4 text-sm font-bold text-white transition hover:bg-[#963322]"
            >
              Open complaint explorer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-sm text-stone-500">
        Security enforced by Oracle Deep Data Security.
      </footer>
    </>
  );
}
