"use client";

import { useState } from "react";
import { ArrowRight, ArrowUp, Bot, Loader2 } from "lucide-react";
import { getTceqAgentRoute, type TceqAgentRoute } from "@/lib/tceq-agent-routing";

type ConversationResult = {
  prompt: string;
  response: string;
};

export function ConversationsAiPanel() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ConversationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<TceqAgentRoute | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;

    setActiveRoute(getTceqAgentRoute(nextPrompt));
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ecoagency/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: nextPrompt })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Prompt failed.");
      setResult({ prompt: body.prompt, response: body.response });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prompt failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <form onSubmit={submit} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
        <div className="flex items-end gap-3">
          <label className="sr-only" htmlFor="conversation-prompt">
            Ask ConversationsAI
          </label>
          <textarea
            id="conversation-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={2}
            placeholder="Ask an EcoAgency question..."
            className="min-h-14 flex-1 resize-none rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#8f3b2f] focus:bg-white focus:ring-2 focus:ring-[#8f3b2f]/15"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            aria-label="Run prompt"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#8f3b2f] text-white transition hover:bg-[#733126] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </form>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}

      <section className="min-h-80 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        {!result && !loading && (
          <div className="flex min-h-64 items-center justify-center text-center">
            <div>
              <h2 className="text-xl font-bold text-stone-950">ConversationsAI</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                Enter a prompt and the app will call Oracle Select AI Agent from the server.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex min-h-64 items-center justify-center text-center">
            <div className="w-full max-w-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff3ef] text-[#8f3b2f]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <p className="mt-4 text-base font-bold text-stone-950">
                Running {activeRoute?.agentName || "Select AI Agent"}...
              </p>
              {activeRoute && (
                <>
                  <p className="mt-2 text-sm text-stone-600">{activeRoute.task}</p>
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-stone-500">
                    <span className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
                      <Bot className="h-3.5 w-3.5" />
                      Supervisor
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#8f3b2f]" />
                    <span className="rounded-full bg-[#fff3ef] px-3 py-1.5 text-[#8f3b2f]">{activeRoute.agentName}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-5">
            <div className="rounded-lg bg-stone-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-stone-500">Prompt</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-800">{result.prompt}</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-stone-500">Response</div>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-base leading-7 text-stone-800">{result.response}</pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
