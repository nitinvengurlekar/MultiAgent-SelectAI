"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, LockKeyhole } from "lucide-react";
import { personas } from "@/lib/personas";
import type { PersonaId } from "@/lib/types";
import { UserCard } from "@/components/user-card";

export default function LoginPage() {
  const router = useRouter();
  const [personaId, setPersonaId] = useState<PersonaId>("nisha");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedPersona = personas[personaId];

  function choosePersona(nextPersonaId: PersonaId) {
    setPersonaId(nextPersonaId);
    setPassword("");
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId, password })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Login failed.");
      }
      router.push("/deepsec/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-[#b33f2d] text-white shadow-sm">
            <Database className="h-7 w-7" />
          </div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#b33f2d]">Autonomous Database 26ai</p>
          <h1 className="text-4xl font-bold text-stone-950 md:text-5xl">Oracle Deep Data Security Demo</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-650">
            Sign in as Nisha or Naveen to see how the same data returns different results based on database-enforced access.
          </p>
          <p className="mt-5 max-w-xl text-sm leading-6 text-stone-600">
            This demo uses local database users and Oracle Deep Data Security. No IAM or OAuth in this version.
          </p>
          <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
            Access is enforced in the database, not by the UI.
          </div>
        </section>

        <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white/90 p-5 shadow-xl shadow-stone-200/70">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.values(personas).map((persona) => (
              <UserCard
                key={persona.id}
                persona={persona}
                selected={personaId === persona.id}
                onSelect={() => choosePersona(persona.id)}
              />
            ))}
          </div>
          <label className="mt-5 block space-y-2">
            <span className="text-sm font-bold text-stone-800">Database password for {selectedPersona.displayName}</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-12 w-full rounded-md border border-stone-200 bg-white pl-10 pr-3 text-stone-900 outline-none transition focus:border-[#b33f2d] focus:ring-2 focus:ring-[#b33f2d]/20"
                placeholder={`Password for ${selectedPersona.displayName}`}
              />
            </div>
          </label>
          {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 h-12 w-full rounded-md bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {loading ? "Connecting" : `Login as ${selectedPersona.displayName}`}
          </button>
        </form>
      </div>
    </main>
  );
}
