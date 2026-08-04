import {
  Activity,
  AlertTriangle,
  Database,
  Droplets,
  FileSearch,
  Loader2,
  Network,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import type { TceqAgentRoute, TceqSpecialistId } from "@/lib/tceq-agent-routing";

type OrchestrationStatus = "idle" | "running" | "complete" | "error";
type StepState = "next" | "active" | "done";

const specialistIcons: Record<TceqSpecialistId, LucideIcon> = {
  complaint: FileSearch,
  water: Droplets,
  spill: AlertTriangle
};

export function LiveOrchestrationPanel({
  routes,
  status
}: {
  routes: TceqAgentRoute[];
  status: OrchestrationStatus;
}) {
  const started = status !== "idle";
  const completed = status === "complete";
  const workerState: StepState = status === "running" ? "active" : completed || status === "error" ? "done" : "next";
  const steps: Array<{ title: string; text: string; state: StepState; icon: LucideIcon }> = [
    {
      title: "Supervisor",
      text: routes.length > 1 ? `Interpret intent and coordinate ${routes.length} specialists` : "Interpret intent and choose a route",
      state: started ? "done" : "next",
      icon: Network
    },
    ...routes.map((route) => ({
      title: route.agentName,
      text: route.task,
      state: workerState,
      icon: specialistIcons[route.id]
    })),
    {
      title: "AI Data Platform",
      text: "Retrieve governed environmental data",
      state: workerState,
      icon: Database
    },
    {
      title: "Supervisor",
      text: status === "error" ? "Review the execution error" : "Synthesize evidence and deliver answer",
      state: completed ? "done" : "next",
      icon: Sparkles
    }
  ];

  return (
    <section className="overflow-hidden rounded-2xl bg-[#092f2f] text-white shadow-xl shadow-[#073b3a]/10">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#f1b82d]" />
          <h3 className="text-sm font-bold">Live orchestration</h3>
        </div>
      </div>
      <div className="p-5">
        {steps.map((step, index) => (
          <div key={`${step.title}-${index}`} className="relative flex gap-3 pb-6 last:pb-0">
            {index < steps.length - 1 && (
              <span className="absolute left-[17px] top-9 h-[calc(100%-1.75rem)] w-px bg-white/15" />
            )}
            <span
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                step.state === "done"
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                  : step.state === "active"
                    ? "border-[#f1b82d]/50 bg-[#f1b82d]/15 text-[#f1b82d]"
                    : "border-white/15 bg-white/5 text-white/40"
              }`}
            >
              {step.state === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : <step.icon className="h-4 w-4" />}
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-emerald-100/55">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
