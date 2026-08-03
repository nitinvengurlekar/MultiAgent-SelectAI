export type ScenarioId =
  | "waste-ldar"
  | "water-county-report"
  | "johnson-air-profile"
  | "johnson-air-assessment"
  | "johnson-air-count";

export type EcoScenario = {
  id: ScenarioId;
  title: string;
  shortTitle: string;
  category: string;
  prompt: string;
  summary: string;
  whatYouAreSeeing: string;
  whyItMatters: string;
  expectedResult: string;
  presenterNotes: string;
  badges: string[];
};

export type EcoHistoryItem = {
  teamName: string | null;
  taskName: string | null;
  agentName: string | null;
  prompt: string | null;
  response: string | null;
  startedAt: string | null;
};

export type EcoRunResult = {
  scenario: EcoScenario;
  response: string;
  sqlPreview: string;
  history: EcoHistoryItem[];
};
