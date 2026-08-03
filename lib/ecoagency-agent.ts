import "server-only";

import type oracledb from "oracledb";
import { agentTeamName, getScenario } from "@/lib/ecoagency-scenarios";
import type { EcoHistoryItem, EcoRunResult } from "@/lib/ecoagency-types";
import { withEcoConnection } from "@/lib/ecoagency-db";

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function valueOf(row: Record<string, unknown>, key: string) {
  return row[key] ?? row[key.toUpperCase()] ?? row[key.toLowerCase()] ?? null;
}

function textOf(value: unknown) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  return String(value);
}

function stringifyResponse(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const first = rows[0];
  const firstValue = Object.values(first)[0];
  if (firstValue === null || firstValue === undefined) return "";
  return String(firstValue);
}

export async function resetAgentTeam(connection?: oracledb.Connection) {
  const run = async (conn: oracledb.Connection) => {
    await conn.execute(`BEGIN DBMS_CLOUD_AI_AGENT.CLEAR_TEAM; END;`);
    await conn.execute(`BEGIN DBMS_CLOUD_AI_AGENT.SET_TEAM(:teamName); END;`, { teamName: agentTeamName });
    return { ok: true, teamName: agentTeamName };
  };

  if (connection) return run(connection);
  return withEcoConnection(run);
}

export async function getAgentHistory(limit = 8): Promise<EcoHistoryItem[]> {
  return withEcoConnection(async (connection) => {
    const result = await connection.execute<Record<string, unknown>>(
      `WITH latest_team AS (
          SELECT team_exec_id, team_name, start_date
          FROM user_ai_agent_team_history
          ORDER BY start_date DESC
          FETCH FIRST 10 ROWS ONLY
        ),
        latest_task AS (
          SELECT team_exec_id, task_name, agent_name, conversation_params, start_date,
                 ROW_NUMBER() OVER (
                   PARTITION BY team_exec_id, task_name, agent_name
                   ORDER BY start_date DESC
                 ) as rn
          FROM user_ai_agent_task_history
        )
        SELECT
          team.team_name as "teamName",
          task.task_name as "taskName",
          task.agent_name as "agentName",
          p.prompt as "prompt",
          p.prompt_response as "response",
          TO_CHAR(task.start_date, 'YYYY-MM-DD HH24:MI:SS') as "startedAt"
        FROM latest_team team
        JOIN latest_task task
          ON team.team_exec_id = task.team_exec_id
         AND task.rn = 1
        LEFT JOIN user_cloud_ai_conversation_prompts p
          ON p.conversation_id = JSON_VALUE(task.conversation_params, '$.conversation_id')
        ORDER BY task.start_date DESC NULLS LAST,
                 p.created DESC NULLS LAST
        FETCH FIRST :limit ROWS ONLY`,
      { limit }
    );

    return (result.rows || []).map((row) => ({
      teamName: textOf(valueOf(row, "teamName")),
      taskName: textOf(valueOf(row, "taskName")),
      agentName: textOf(valueOf(row, "agentName")),
      prompt: textOf(valueOf(row, "prompt")),
      response: textOf(valueOf(row, "response")),
      startedAt: textOf(valueOf(row, "startedAt"))
    }));
  });
}

export async function runScenario(scenarioId: string): Promise<EcoRunResult> {
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    throw new Error("Unknown EcoAgency scenario.");
  }

  return withEcoConnection(async (connection) => {
    await resetAgentTeam(connection);
    const sql = `select ai agent ${sqlLiteral(scenario.prompt)}`;
    const result = await connection.execute<Record<string, unknown>>(sql);
    const response = stringifyResponse(result.rows || []);
    const history = await getAgentHistory(8);

    return {
      scenario,
      response,
      sqlPreview: `select ai agent ${sqlLiteral(scenario.prompt.slice(0, 280))}${scenario.prompt.length > 280 ? " ..." : ""}`,
      history
    };
  });
}

export async function runFreeformPrompt(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error("Prompt is required.");
  }
  if (trimmed.length > 4000) {
    throw new Error("Prompt is too long for this demo. Keep it under 4,000 characters.");
  }

  return withEcoConnection(async (connection) => {
    await resetAgentTeam(connection);
    const sql = `select ai agent ${sqlLiteral(trimmed)}`;
    const result = await connection.execute<Record<string, unknown>>(sql);
    const response = stringifyResponse(result.rows || []);
    const history = await getAgentHistory(6);

    return {
      prompt: trimmed,
      response,
      history
    };
  });
}
