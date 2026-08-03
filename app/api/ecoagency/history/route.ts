import { NextResponse } from "next/server";
import { getAgentHistory } from "@/lib/ecoagency-agent";

export async function GET() {
  try {
    const history = await getAgentHistory(12);
    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load agent history." },
      { status: 500 }
    );
  }
}
