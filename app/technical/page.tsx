import { EcoNav } from "@/components/eco-nav";
import { EcoBadge } from "@/components/eco-badge";
import { agentTeamName } from "@/lib/ecoagency-scenarios";

const setupSql = `EXEC DBMS_CLOUD_AI_AGENT.CLEAR_TEAM;
EXEC DBMS_CLOUD_AI_AGENT.SET_TEAM('${agentTeamName}');

select ai agent 'list the count of air related issues in Johnson County';`;

const historySql = `WITH latest_team AS (
  SELECT team_exec_id, team_name, start_date
  FROM user_ai_agent_team_history
  ORDER BY start_date DESC
  FETCH FIRST 1 ROW ONLY
),
latest_task AS (
  SELECT team_exec_id, task_name, agent_name, conversation_params, start_date,
         ROW_NUMBER() OVER (
           PARTITION BY team_exec_id, task_name, agent_name
           ORDER BY start_date DESC
         ) as rn
  FROM user_ai_agent_task_history
)
SELECT team.team_name, task.task_name, task.agent_name, p.prompt, p.prompt_response
FROM latest_team team
JOIN latest_task task
  ON team.team_exec_id = task.team_exec_id
 AND task.rn = 1
LEFT JOIN user_cloud_ai_conversation_prompts p
  ON p.conversation_id = JSON_VALUE(task.conversation_params, '$.conversation_id')
ORDER BY task.start_date DESC NULLS LAST, p.created DESC NULLS LAST;`;

export default function TechnicalPage() {
  return (
    <>
      <EcoNav />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-[#8f3b2f]">Behind the scenes</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950">Technical Details</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            The demo executes Oracle Select AI Agent calls from server-side Next.js routes. The database coordinates the configured agent team and records execution history.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <EcoBadge tone="blue">Select AI Agent</EcoBadge>
            <EcoBadge tone="amber">MCP Tools</EcoBadge>
            <EcoBadge>History views</EcoBadge>
            <EcoBadge tone="green">Server-side Oracle driver</EcoBadge>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {[["Agent setup and run", setupSql], ["Execution history query", historySql]].map(([title, sql]) => (
            <section key={title} className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950 shadow-sm">
              <div className="border-b border-white/10 px-5 py-3 text-sm font-bold text-white">{title}</div>
              <pre className="overflow-x-auto p-5 text-sm leading-6 text-stone-100">
                <code>{sql}</code>
              </pre>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-950">What this proves</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-700">
            The application is intentionally thin. It sends curated prompts to Oracle Autonomous Database, then displays the agent response and history.
            The orchestration, grounding, MCP tool usage, and prompt traceability live in the database layer.
          </p>
        </section>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-sm text-stone-500">Powered by Oracle Select AI Agent.</footer>
    </>
  );
}
