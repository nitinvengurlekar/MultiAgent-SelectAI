import { NextResponse } from "next/server";
import { getEcoConfigStatus, withEcoConnection } from "@/lib/ecoagency-db";

export async function GET() {
  const config = getEcoConfigStatus();
  if (!config.configured) {
    return NextResponse.json({ configured: false, ok: false, error: config.error }, { status: 503 });
  }

  try {
    const db = await withEcoConnection(async (connection) => {
      const result = await connection.execute<Record<string, unknown>>(
        `select user as "databaseUser", sys_context('USERENV', 'CURRENT_SCHEMA') as "schemaName" from dual`
      );
      return result.rows?.[0] || {};
    });
    return NextResponse.json({ configured: true, ok: true, config, db });
  } catch (error) {
    return NextResponse.json(
      { configured: true, ok: false, error: error instanceof Error ? error.message : "Database status check failed." },
      { status: 500 }
    );
  }
}
