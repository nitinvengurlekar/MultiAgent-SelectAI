import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { getPersona } from "@/lib/personas";
import { validateLogin } from "@/lib/db";
import { getOracleUserMessage } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const persona = getPersona(body?.personaId);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!persona || !password) {
      return NextResponse.json({ error: "Choose a persona and enter the database password." }, { status: 400 });
    }

    const dbUser = await validateLogin(persona, password);
    await setSession({
      personaId: persona.id,
      displayName: persona.displayName,
      dbUser,
      loginAt: Date.now()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getOracleUserMessage(error) }, { status: 401 });
  }
}
