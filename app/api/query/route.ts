import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runAsPersona } from "@/lib/db";
import { getPersona } from "@/lib/personas";
import { runComplaintQuery } from "@/lib/sql";
import { getOracleUserMessage } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in again." }, { status: 401 });
    }
    const persona = getPersona(session.personaId);
    if (!persona) {
      return NextResponse.json({ error: "Please log in again." }, { status: 401 });
    }
    const body = await request.json();
    const filters = body?.filters && typeof body.filters === "object" ? body.filters : {};
    const result = await runAsPersona(persona, (connection) => runComplaintQuery(connection, filters));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: getOracleUserMessage(error) }, { status: 500 });
  }
}
