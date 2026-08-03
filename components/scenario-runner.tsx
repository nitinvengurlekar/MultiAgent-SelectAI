"use client";

import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import type { EcoHistoryItem, EcoRunResult, EcoScenario } from "@/lib/ecoagency-types";
import { HistoryTable } from "@/components/history-table";

type ScenarioRunnerProps = {
  scenario: EcoScenario;
  initialHistory: EcoHistoryItem[];
};

export function ScenarioRunner({ scenario, initialHistory }: ScenarioRunnerProps) {
  const [result, setResult] = useState<EcoRunResult | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  async function runScenario() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/ecoagency/scenarios/${scenario.id}/run`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Scenario run failed.");
      setResult(body);
      setHistory(body.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scenario run failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resetTeam() {
    setResetting(true);
    setError("");
    try {
      const response = await fetch("/api/ecoagency/team/reset", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Team reset failed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Team reset failed.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runScenario}
            disabled={loading}
            className="flex h-11 items-center gap-2 rounded-md bg-[#8f3b2f] px-4 text-sm font-bold text-white transition hover:bg-[#733126] disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            {loading ? "Running agent" : "Run Select AI Agent"}
          </button>
          <button
            type="button"
            onClick={resetTeam}
            disabled={resetting}
            className="flex h-11 items-center gap-2 rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            {resetting ? "Resetting" : "Reset agent team"}
          </button>
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-stone-950">Agent response</h2>
        <div className="mt-4 min-h-40 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm leading-7 text-stone-700">
          {loading ? (
            <p>Oracle Select AI Agent is coordinating the database, MCP tools, and evidence sources...</p>
          ) : result?.response ? (
            <pre className="whitespace-pre-wrap font-sans">{result.response}</pre>
          ) : (
            <p className="text-stone-500">Run the scenario to show the grounded agent response here.</p>
          )}
        </div>
      </section>

      {result?.sqlPreview && (
        <section className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950 shadow-sm">
          <div className="border-b border-white/10 px-5 py-3 text-sm font-bold text-white">SQL preview</div>
          <pre className="overflow-x-auto p-5 text-sm leading-6 text-stone-100">
            <code>{result.sqlPreview}</code>
          </pre>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-950">Recent agent history</h2>
          <span className="text-xs font-bold uppercase text-stone-500">Database execution trace</span>
        </div>
        <HistoryTable history={history} />
      </section>
    </div>
  );
}
