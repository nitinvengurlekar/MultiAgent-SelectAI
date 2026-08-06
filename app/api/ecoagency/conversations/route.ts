import { NextRequest, NextResponse } from "next/server";
import { runFreeformPrompt } from "@/lib/ecoagency-agent";
import {
  applyOciGuardrails,
  getOciGuardrailsStatus,
  publicGuardrailResult,
  redactGuardrailDetections,
  type GuardrailRun
} from "@/lib/oci-guardrails";

const conversationIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function protectedAgentResult<T extends { response: string; history?: Array<Record<string, unknown>> }>(
  result: T,
  response: string,
  guardrails: GuardrailRun
) {
  return {
    ...result,
    response,
    // Preserve agent/task observability without sending raw intermediate model or tool output.
    history: result.history?.map((item) => ({ ...item, response: null })) || [],
    guardrails
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const guardrailsEnabled = body?.guardrailsEnabled === true;
    const requestedConversationId = typeof body?.conversationId === "string" ? body.conversationId.trim() : "";
    const conversationId = conversationIdPattern.test(requestedConversationId) ? requestedConversationId : undefined;
    const status = getOciGuardrailsStatus();
    const guardrails: GuardrailRun = {
      enabled: guardrailsEnabled,
      configured: status.configured,
      mode: "protect",
      redactedCount: 0
    };

    if (!guardrailsEnabled) {
      const result = await runFreeformPrompt(prompt, conversationId);
      return NextResponse.json({ ...result, guardrails });
    }
    if (!status.configured) {
      return NextResponse.json(
        { error: "OCI Guardrails is enabled but not configured on this server.", guardrails },
        { status: 503 }
      );
    }

    const inputEvaluation = await applyOciGuardrails(prompt);
    guardrails.input = publicGuardrailResult(inputEvaluation);
    if (inputEvaluation.status === "unavailable") {
      return NextResponse.json(
        { error: "OCI Guardrails could not evaluate this prompt. Agent execution was not started.", guardrails },
        { status: 502 }
      );
    }
    if (inputEvaluation.contentModerationFlagged || inputEvaluation.promptInjectionFlagged) {
      return NextResponse.json(
        { error: "OCI Guardrails blocked this prompt before agent execution.", guardrails },
        { status: 422 }
      );
    }

    const result = await runFreeformPrompt(prompt, conversationId);
    const outputEvaluation = await applyOciGuardrails(result.response);
    guardrails.output = publicGuardrailResult(outputEvaluation);
    if (outputEvaluation.status === "unavailable") {
      return NextResponse.json(
        { error: "OCI Guardrails could not evaluate the generated response, so it was not displayed.", guardrails },
        { status: 502 }
      );
    }
    if (outputEvaluation.contentModerationFlagged) {
      return NextResponse.json(
        protectedAgentResult(
          result,
          "OCI Guardrails blocked the generated response because it matched the configured content policy.",
          guardrails
        )
      );
    }

    const redacted = redactGuardrailDetections(result.response, outputEvaluation.detections);
    guardrails.redactedCount = redacted.redactedCount;
    return NextResponse.json(protectedAgentResult(result, redacted.content, guardrails));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Select AI Agent prompt failed." },
      { status: 500 }
    );
  }
}
