import "server-only";

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as common from "oci-common";
import * as generativeaiinference from "oci-generativeaiinference";
import type { GuardrailRun, GuardrailStageResult } from "@/lib/guardrail-types";

export type { GuardrailRun, GuardrailStageResult } from "@/lib/guardrail-types";

type GuardrailEvaluation = GuardrailStageResult & {
  detections: Array<{ offset: number; length: number; label: string }>;
};

type GuardrailConfig = {
  compartmentId: string;
  region: string;
  version?: string;
  authMode: "resource-principal" | "config-file";
  configFile?: string;
  profile?: string;
};

function textEnv(key: string) {
  return process.env[key]?.trim().replace(/^["']|["']$/g, "") || undefined;
}

function resolveConfigFile() {
  return textEnv("OCI_CONFIG_FILE") || join(homedir(), ".oci", "config");
}

export function getOciGuardrailsStatus() {
  const compartmentConfigured = Boolean(textEnv("OCI_GUARDRAILS_COMPARTMENT_ID"));
  const resourcePrincipalConfigured = Boolean(process.env.OCI_RESOURCE_PRINCIPAL_VERSION);
  const configFile = resolveConfigFile();
  const configFileConfigured = existsSync(configFile);
  const configured = compartmentConfigured && (resourcePrincipalConfigured || configFileConfigured);

  return {
    configured,
    compartmentConfigured,
    authenticationConfigured: resourcePrincipalConfigured || configFileConfigured,
    region: textEnv("OCI_GUARDRAILS_REGION") || "us-chicago-1",
    version: textEnv("OCI_GUARDRAILS_VERSION") || null,
    mode: "protect" as const
  };
}

function getConfig(): GuardrailConfig {
  const status = getOciGuardrailsStatus();
  const compartmentId = textEnv("OCI_GUARDRAILS_COMPARTMENT_ID");
  if (!status.configured || !compartmentId) {
    throw new Error("OCI Guardrails is not configured on this server.");
  }

  const resourcePrincipalConfigured = Boolean(process.env.OCI_RESOURCE_PRINCIPAL_VERSION);
  return {
    compartmentId,
    region: status.region,
    version: status.version || undefined,
    authMode: resourcePrincipalConfigured ? "resource-principal" : "config-file",
    configFile: resourcePrincipalConfigured ? undefined : resolveConfigFile(),
    profile: textEnv("OCI_CONFIG_PROFILE") || "DEFAULT"
  };
}

function getProvider(config: GuardrailConfig): common.AuthenticationDetailsProvider {
  if (config.authMode === "resource-principal") {
    return common.ResourcePrincipalAuthenticationDetailsProvider.builder();
  }
  return new common.ConfigFileAuthenticationDetailsProvider(config.configFile, config.profile);
}

export async function applyOciGuardrails(content: string): Promise<GuardrailEvaluation> {
  const config = getConfig();
  const client = new generativeaiinference.GenerativeAiInferenceClient({
    authenticationDetailsProvider: getProvider(config)
  });
  client.regionId = config.region;
  const startedAt = Date.now();

  try {
    const response = await client.applyGuardrails({
      applyGuardrailsDetails: {
        compartmentId: config.compartmentId,
        input: { type: "TEXT", content, languageCode: "en" },
        guardrailConfigs: {
          contentModerationConfig: { categories: ["OVERALL"] },
          promptInjectionConfig: {},
          // OCI's REST contract uses an empty configuration to run the supported PII detectors.
          // The generated TypeScript SDK currently marks `types` as required, so cast only at
          // this boundary while preserving the documented wire shape.
          personallyIdentifiableInformationConfig:
            {} as generativeaiinference.models.PersonallyIdentifiableInformationConfiguration
        },
        ...(config.version
          ? { guardrailVersionConfig: { guardrailVersion: config.version } }
          : {})
      }
    });

    const result = response.applyGuardrailsResult;
    const pii = result.results.personallyIdentifiableInformation || [];
    const contentModerationFlagged = Boolean(
      result.results.contentModeration?.categories.some((category) => category.score >= 1)
    );
    const promptInjectionFlagged = (result.results.promptInjection?.score || 0) >= 1;
    const piiLabels = Array.from(new Set(pii.map((item) => item.label))).sort();

    return {
      status: contentModerationFlagged || promptInjectionFlagged || pii.length ? "flagged" : "passed",
      contentModerationFlagged,
      promptInjectionFlagged,
      piiCount: pii.length,
      piiLabels,
      version: result.guardrailVersion?.version || null,
      requestId: response.opcRequestId || null,
      latencyMs: Date.now() - startedAt,
      detections: pii.map((item) => ({ offset: item.offset, length: item.length, label: item.label }))
    };
  } catch {
    return {
      status: "unavailable",
      contentModerationFlagged: false,
      promptInjectionFlagged: false,
      piiCount: 0,
      piiLabels: [],
      version: config.version || null,
      requestId: null,
      latencyMs: Date.now() - startedAt,
      detections: []
    };
  } finally {
    client.close();
  }
}

export function redactGuardrailDetections(
  content: string,
  detections: Array<{ offset: number; length: number; label: string }>
) {
  const normalized = detections
    .filter((item) => Number.isInteger(item.offset) && Number.isInteger(item.length) && item.offset >= 0 && item.length > 0)
    .sort((a, b) => b.offset - a.offset || b.length - a.length);
  let redacted = content;
  let boundary = content.length;
  let redactedCount = 0;

  for (const detection of normalized) {
    const end = Math.min(content.length, detection.offset + detection.length);
    if (detection.offset >= boundary || end > boundary) continue;
    redacted = `${redacted.slice(0, detection.offset)}[${detection.label} REDACTED]${redacted.slice(end)}`;
    boundary = detection.offset;
    redactedCount += 1;
  }

  return { content: redacted, redactedCount };
}

export function publicGuardrailResult(result: GuardrailEvaluation): GuardrailStageResult {
  return {
    status: result.status,
    contentModerationFlagged: result.contentModerationFlagged,
    promptInjectionFlagged: result.promptInjectionFlagged,
    piiCount: result.piiCount,
    piiLabels: result.piiLabels,
    version: result.version,
    requestId: result.requestId,
    latencyMs: result.latencyMs
  };
}
