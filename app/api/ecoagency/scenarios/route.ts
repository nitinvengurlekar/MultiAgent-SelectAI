import { NextResponse } from "next/server";
import { ecoScenarios } from "@/lib/ecoagency-scenarios";

export async function GET() {
  return NextResponse.json({ scenarios: ecoScenarios });
}
