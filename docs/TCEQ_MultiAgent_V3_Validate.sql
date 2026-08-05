-- TCEQ Multi-Agent V3 validation
-- Run only after TCEQ_MultiAgent_V3_Deploy.sql completes successfully.
-- This script changes only the current SQL session team; it does not alter objects.

SET LONG 32767
SET LONGCHUNKSIZE 32767

EXEC DBMS_CLOUD_AI_AGENT.SET_TEAM('TCEQ_MULTIAGENT_TEAM_V3');

-- Test 1: required RAG route.
SELECT AI AGENT
  'Explain the Leak Detection and Repair Program using the TCEQ knowledge base. Identify the supporting document names or sources.';

-- Immediately verify the most recent V3 execution. Expected specialist/tool:
-- TCEQ_COMPLAINT_ADVISOR -> COMPLAINT_RAG_TOOL.
SELECT team_exec_id, team_name, state, start_date, end_date
FROM user_ai_agent_team_history
WHERE team_name = 'TCEQ_MULTIAGENT_TEAM_V3'
ORDER BY start_date DESC
FETCH FIRST 1 ROW ONLY;

SELECT task_order, agent_name, task_name, state, start_date, end_date, result
FROM user_ai_agent_task_history
WHERE team_exec_id = (
  SELECT team_exec_id
  FROM user_ai_agent_team_history
  WHERE team_name = 'TCEQ_MULTIAGENT_TEAM_V3'
  ORDER BY start_date DESC
  FETCH FIRST 1 ROW ONLY
)
ORDER BY task_order, start_date;

SELECT task_order, tool_name, agent_name, task_name, input, output, start_date, end_date
FROM user_ai_agent_tool_history
WHERE team_exec_id = (
  SELECT team_exec_id
  FROM user_ai_agent_team_history
  WHERE team_name = 'TCEQ_MULTIAGENT_TEAM_V3'
  ORDER BY start_date DESC
  FETCH FIRST 1 ROW ONLY
)
ORDER BY start_date, task_order;

-- Tests 2-5 are templates. Run one at a time after Test 1 passes, then repeat
-- the history queries above so each route has its own captured evidence.
--
-- Complaint SQL route: expect TCEQ_COMPLAINT_ADVISOR -> COMPLAINT_SQL.
-- SELECT AI AGENT
--   'List up to 2 air-related complaints in Johnson County. Include tracking number, status, location, and incident summary.';
--
-- Water route: expect TCEQ_WATER_QUALITY_ANALYST_V1 -> TCEQ_WATER_QUALITY_SQL_TOOL_V1.
-- SELECT AI AGENT
--   'For the Barton Creek watershed, show up to 2 recent water-quality sampling records. Include site, sample date, parameter, result, unit, and qualifier.';
--
-- Spill route: expect TCEQ_SPILL_RESPONSE_ANALYST_V1 -> TCEQ_SPILL_RESPONSE_SQL_TOOL_V1.
-- SELECT AI AGENT
--   'For Johnson County, show up to 2 emergency-response spill records. Include incident number, location, released material, status, and action taken.';
--
-- Cross-domain route: use compact count results to stay within the Oracle orchestration
-- buffer. Expect all three specialists and their appropriate SQL tools.
-- SELECT AI AGENT
--   'Use all three specialists. Return exactly three source-labelled count lines and no causal conclusions: Complaint - count complaint records where COUNTY is TRAVIS; Spill Response - count distinct spill INCIDENTNUMBER records where COUNTY is TRAVIS; Water Quality - count measurement rows where WATERSHED is Lady Bird Lake, PARAMETER is DISSOLVED OXYGEN, and SAMPLE_DATE is in calendar year 2024. Do not use web search or RAG.';

-- V2 remains available. Do not drop V2 until all V3 routes pass both SQL and UI tests.
