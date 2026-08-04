export type TceqSpecialistId = "complaint" | "water" | "spill";

export type TceqAgentRoute = {
  id: TceqSpecialistId;
  agentName: string;
  task: string;
  reportTitle: string;
};

const routes: Record<TceqSpecialistId, TceqAgentRoute> = {
  complaint: {
    id: "complaint",
    agentName: "Complaint Caseworker",
    task: "Retrieve complaint records and case context",
    reportTitle: "Complaint Intelligence Summary"
  },
  water: {
    id: "water",
    agentName: "Water Quality Analyst",
    task: "Analyze water-quality complaints and supporting evidence",
    reportTitle: "Water Quality Analysis"
  },
  spill: {
    id: "spill",
    agentName: "Spill Response Analyst",
    task: "Assess spill, waste, or release incidents and response actions",
    reportTitle: "Spill Response Assessment"
  }
};

export function getTceqAgentRoutes(prompt: string): TceqAgentRoute[] {
  const normalized = prompt.toLowerCase();
  const matches = [
    /complaint|tracking|regulated entit|caseworker|intake|air-related|air quality/.test(normalized) ? routes.complaint : null,
    /water|contamin|watershed|discharge|drinking|sampling/.test(normalized) ? routes.water : null,
    /spill|oil|waste|leak|release|remedi|ldar|emergency-response/.test(normalized) ? routes.spill : null
  ].filter((route): route is TceqAgentRoute => Boolean(route));

  return matches.length ? matches : [routes.complaint];
}

export function getTceqRouteForAgentName(agentName: string | null | undefined): TceqAgentRoute | null {
  const normalized = agentName?.toLowerCase() || "";
  if (normalized.includes("complaint")) return routes.complaint;
  if (normalized.includes("water_quality") || normalized.includes("water quality")) return routes.water;
  if (normalized.includes("spill_response") || normalized.includes("spill response")) return routes.spill;
  return null;
}

export function getTceqAgentRoute(prompt: string): TceqAgentRoute {
  const normalized = prompt.toLowerCase();
  if (/water|contamin|watershed|discharge|drinking/.test(normalized)) return routes.water;
  if (/spill|oil|waste|leak|release|remedi|ldar/.test(normalized)) return routes.spill;
  return routes.complaint;
}
