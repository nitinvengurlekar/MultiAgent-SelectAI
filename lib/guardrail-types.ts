export type GuardrailStageResult = {
  status: "passed" | "flagged" | "unavailable";
  contentModerationFlagged: boolean;
  promptInjectionFlagged: boolean;
  piiCount: number;
  piiLabels: string[];
  version: string | null;
  requestId: string | null;
  latencyMs: number;
};

export type GuardrailRun = {
  enabled: boolean;
  configured: boolean;
  mode: "protect";
  input?: GuardrailStageResult;
  output?: GuardrailStageResult;
  redactedCount: number;
};

export type GuardrailServiceStatus = {
  configured: boolean;
  compartmentConfigured: boolean;
  authenticationConfigured: boolean;
  region: string;
  version: string | null;
  mode: "protect";
};
