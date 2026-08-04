"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowUp, Bot, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { getTceqAgentRoute, type TceqAgentRoute } from "@/lib/tceq-agent-routing";
import { FormattedAgentResponse } from "@/components/formatted-agent-response";

type ConversationResult = {
  prompt: string;
  response: string;
};

export function ConversationsAiPanel() {
  const conversationId = useRef<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ConversationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<TceqAgentRoute | null>(null);

  function startNewConversation() {
    conversationId.current = null;
    setPrompt("");
    setResult(null);
    setError("");
    setActiveRoute(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;

    setActiveRoute(getTceqAgentRoute(nextPrompt));
    setPrompt("");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ecoagency/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: nextPrompt, conversationId: conversationId.current })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Prompt failed.");
      conversationId.current = body.conversationId;
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
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={startNewConversation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New conversation
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
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Submitted request</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-800">{result.prompt}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <div className="flex flex-col justify-between gap-3 border-b border-stone-200 bg-[#fcfbfa] px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-stone-950">Analysis complete</div>
                  </div>
                </div>
                {activeRoute && (
                  <div className="sm:max-w-sm sm:text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8f3b2f]/70">Executed by</div>
                    <div className="mt-0.5 text-xs font-bold text-[#8f3b2f]">{activeRoute.agentName}</div>
                    <div className="mt-0.5 text-[11px] leading-4 text-stone-600">{activeRoute.task}</div>
                  </div>
                )}
              </div>
              <div className="px-5 py-5 sm:px-6">
                <FormattedAgentResponse response={result.response} reportTitle={activeRoute?.reportTitle || "Analysis Summary"} />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
