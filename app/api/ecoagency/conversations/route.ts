import { NextRequest, NextResponse } from "next/server";
import { runFreeformPrompt } from "@/lib/ecoagency-agent";

const conversationIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const requestedConversationId = typeof body?.conversationId === "string" ? body.conversationId.trim() : "";
    const conversationId = conversationIdPattern.test(requestedConversationId) ? requestedConversationId : undefined;
    const result = await runFreeformPrompt(prompt, conversationId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Select AI Agent prompt failed." },
      { status: 500 }
    );
  }
}
