export type TceqSpecialistId = "complaint" | "water" | "spill";

export type TceqAgentRoute = {
  id: TceqSpecialistId;
  agentName: string;
  task: string;
};

const routes: Record<TceqSpecialistId, TceqAgentRoute> = {
  complaint: {
    id: "complaint",
    agentName: "Complaint Caseworker",
    task: "Retrieve complaint records and case context"
  },
  water: {
    id: "water",
    agentName: "Water Quality Analyst",
    task: "Analyze water-quality complaints and supporting evidence"
  },
  spill: {
    id: "spill",
    agentName: "Spill Response Analyst",
    task: "Assess spill, waste, or release incidents and response actions"
  }
};

export function getTceqAgentRoute(prompt: string): TceqAgentRoute {
  const normalized = prompt.toLowerCase();
  if (/water|contamin|watershed|discharge|drinking/.test(normalized)) return routes.water;
  if (/spill|oil|waste|leak|release|remedi|ldar/.test(normalized)) return routes.spill;
  return routes.complaint;
}
