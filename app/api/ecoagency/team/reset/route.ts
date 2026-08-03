import { NextResponse } from "next/server";
import { resetAgentTeam } from "@/lib/ecoagency-agent";

export async function POST() {
  try {
    const result = await resetAgentTeam();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reset the Select AI Agent team." },
      { status: 500 }
    );
  }
}
