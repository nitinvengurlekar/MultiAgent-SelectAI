import { NextResponse } from "next/server";
import { getOciGuardrailsStatus } from "@/lib/oci-guardrails";

export async function GET() {
  return NextResponse.json(getOciGuardrailsStatus());
}
