"use client";

import { useEffect, useState } from "react";
import { Code2, Play, RotateCcw } from "lucide-react";
import type { FilterOption, QueryResult } from "@/lib/types";
import { ResultsTable } from "@/components/results-table";

type QueryPanelProps = {
  initialResult: QueryResult;
};

export function QueryPanel({ initialResult }: QueryPanelProps) {
  const [result, setResult] = useState(initialResult);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showSql, setShowSql] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(initialResult);
  }, [initialResult]);

  async function runQuery(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: nextFilters })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Query failed.");
      }
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFilters({});
    void runQuery({});
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          {result.filters.map((filter: FilterOption) => (
            <label key={filter.key} className="space-y-2">
              <span className="text-xs font-bold uppercase text-stone-500">{filter.label}</span>
              <select
                value={filters[filter.key] || "all"}
                onChange={(event) => setFilters((current) => ({ ...current, [filter.key]: event.target.value }))}
                className="h-11 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition focus:border-[#b33f2d] focus:ring-2 focus:ring-[#b33f2d]/20"
              >
                <option value="all">All</option>
                {filter.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => runQuery()}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-md bg-[#b33f2d] px-4 text-sm font-bold text-white transition hover:bg-[#963322] disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            {loading ? "Running" : "Run Query"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowSql((current) => !current)}
            className="flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            <Code2 className="h-4 w-4" />
            Show SQL
          </button>
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
      </div>

      {showSql && (
        <pre className="overflow-x-auto rounded-lg border border-stone-800 bg-stone-950 p-4 text-sm leading-6 text-stone-100 shadow-sm">
          <code>{result.sql}</code>
        </pre>
      )}

      <ResultsTable rows={result.rows} columns={result.columns} />
    </div>
  );
}
