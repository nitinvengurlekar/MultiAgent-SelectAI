import { NextRequest, NextResponse } from "next/server";
import { runFreeformPrompt } from "@/lib/ecoagency-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const result = await runFreeformPrompt(prompt);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Select AI Agent prompt failed." },
      { status: 500 }
    );
  }
}
