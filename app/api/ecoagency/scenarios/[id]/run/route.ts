import { NextResponse } from "next/server";
import { runScenario } from "@/lib/ecoagency-agent";
import { getScenario } from "@/lib/ecoagency-scenarios";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getScenario(id)) {
    return NextResponse.json({ error: "Unknown EcoAgency scenario." }, { status: 404 });
  }

  try {
    const result = await runScenario(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Select AI Agent execution failed." },
      { status: 500 }
    );
  }
}
