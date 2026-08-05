-- TCEQ Multi-Agent V3: explicit complaint RAG routing
-- Applied and validated on 2026-08-05. Additive only: this script does not alter or drop V2 objects.

SET SERVEROUTPUT ON
SET LONG 32767

DECLARE
  l_count PLS_INTEGER;

  PROCEDURE require_count(
    p_sql      IN VARCHAR2,
    p_expected IN PLS_INTEGER,
    p_message  IN VARCHAR2
  ) IS
  BEGIN
    EXECUTE IMMEDIATE p_sql INTO l_count;
    IF l_count != p_expected THEN
      RAISE_APPLICATION_ERROR(-20041, p_message);
    END IF;
  END;

  PROCEDURE require_describable_tool(p_tool_name IN VARCHAR2) IS
    l_description CLOB;
  BEGIN
    l_description := DBMS_CLOUD_AI_AGENT.DESCRIBE_TOOL(p_tool_name);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(
        -20042,
        'Tool is not supervisor-compatible: ' || p_tool_name || '. ' || SQLERRM
      );
  END;
BEGIN
  -- Existing dependencies are validated but never modified.
  require_count(q'[SELECT COUNT(*) FROM user_cloud_ai_profiles WHERE profile_name = 'OPENAI_4MY_AGENT']', 1,
    'Missing AI profile: OPENAI_4MY_AGENT');

  require_count(q'[SELECT COUNT(*) FROM user_ai_agents WHERE agent_name = 'TCEQ_COMPLAINT_ADVISOR' AND status = 'ENABLED']', 1,
    'Missing or disabled agent: TCEQ_COMPLAINT_ADVISOR');
  require_count(q'[SELECT COUNT(*) FROM user_ai_agents WHERE agent_name = 'TCEQ_WATER_QUALITY_ANALYST_V1' AND status = 'ENABLED']', 1,
    'Missing or disabled agent: TCEQ_WATER_QUALITY_ANALYST_V1');
  require_count(q'[SELECT COUNT(*) FROM user_ai_agents WHERE agent_name = 'TCEQ_SPILL_RESPONSE_ANALYST_V1' AND status = 'ENABLED']', 1,
    'Missing or disabled agent: TCEQ_SPILL_RESPONSE_ANALYST_V1');

  require_count(q'[SELECT COUNT(*) FROM user_ai_agent_tasks WHERE task_name = 'TCEQ_COMPLAINT_MULTIAGENT_TASK_V1' AND status = 'ENABLED']', 1,
    'Missing or disabled task: TCEQ_COMPLAINT_MULTIAGENT_TASK_V1');
  require_count(q'[SELECT COUNT(*) FROM user_ai_agent_tasks WHERE task_name = 'TCEQ_WATER_QUALITY_ANALYSIS_TASK_V2' AND status = 'ENABLED']', 1,
    'Missing or disabled task: TCEQ_WATER_QUALITY_ANALYSIS_TASK_V2');
  require_count(q'[SELECT COUNT(*) FROM user_ai_agent_tasks WHERE task_name = 'TCEQ_SPILL_RESPONSE_ANALYSIS_TASK_V1' AND status = 'ENABLED']', 1,
    'Missing or disabled task: TCEQ_SPILL_RESPONSE_ANALYSIS_TASK_V1');

  require_count(q'[SELECT COUNT(*) FROM user_ai_agent_task_attributes
                    WHERE task_name = 'TCEQ_COMPLAINT_MULTIAGENT_TASK_V1'
                      AND attribute_name = 'tools'
                      AND DBMS_LOB.INSTR(attribute_value, '"COMPLAINT_RAG_TOOL"') > 0]', 1,
    'TCEQ_COMPLAINT_MULTIAGENT_TASK_V1 does not include COMPLAINT_RAG_TOOL');
  require_count(q'[SELECT COUNT(*) FROM user_ai_agent_tools WHERE tool_name = 'COMPLAINT_RAG_TOOL' AND status = 'ENABLED']', 1,
    'Missing or disabled tool: COMPLAINT_RAG_TOOL');
  require_describable_tool('COMPLAINT_RAG_TOOL');

  -- Versioned names must be unused. The script never overwrites an existing V3.
  require_count(q'[SELECT COUNT(*) FROM user_ai_agents WHERE agent_name = 'TCEQ_MULTIAGENT_SUPERVISOR_V3']', 0,
    'TCEQ_MULTIAGENT_SUPERVISOR_V3 already exists; do not overwrite it.');
  require_count(q'[SELECT COUNT(*) FROM user_ai_agent_teams WHERE agent_team_name = 'TCEQ_MULTIAGENT_TEAM_V3']', 0,
    'TCEQ_MULTIAGENT_TEAM_V3 already exists; do not overwrite it.');
END;
/

BEGIN
  DBMS_CLOUD_AI_AGENT.CREATE_AGENT(
    agent_name => 'TCEQ_MULTIAGENT_SUPERVISOR_V3',
    attributes => '{
      "profile_name": "OPENAI_4MY_AGENT",
      "supervisor": true,
      "role": "You are the TCEQ multi-agent demonstration coordinator. Always delegate a sufficiently specified request to the appropriate specialist instead of asking the requester to supply the answer. Delegate complaint records, complaint analysis, TCEQ knowledge-base documents, regulatory-program guidance, policy guidance, compliance guidance, and Leak Detection and Repair or LDAR questions to TCEQ_COMPLAINT_ADVISOR. For every knowledge-base, document, program-guidance, or LDAR delegation, explicitly tell TCEQ_COMPLAINT_ADVISOR to invoke COMPLAINT_RAG_TOOL before answering and to identify supporting document names or sources. Treat LDAR and leak-detection-program questions as knowledge-base requests, not emergency spill requests, unless the request explicitly concerns a specific spill, release, or emergency-response incident. Delegate water-sampling and measurement questions to TCEQ_WATER_QUALITY_ANALYST_V1. Delegate specific emergency-response spill, release, material, response-action, or remediation-record questions to TCEQ_SPILL_RESPONSE_ANALYST_V1. For cross-domain requests, delegate to every requested specialist and preserve explicit filters and row limits verbatim. Do not use tools directly. Never invent evidence. If a specialist reports no relevant evidence, say so rather than asking the requester to provide the answer. In the final response, label each specialist source, keep record counts separate, and never infer causation between complaint, spill, and water-sampling records. Follow every requested output format exactly."
    }',
    description => 'V3 TCEQ supervisor with explicit complaint knowledge-base and LDAR routing.'
  );
END;
/

BEGIN
  DBMS_CLOUD_AI_AGENT.CREATE_TEAM(
    team_name => 'TCEQ_MULTIAGENT_TEAM_V3',
    attributes => '{
      "process": "sequential",
      "supervisor_agent": "TCEQ_MULTIAGENT_SUPERVISOR_V3",
      "agents": [
        {"name": "TCEQ_COMPLAINT_ADVISOR", "task": "TCEQ_COMPLAINT_MULTIAGENT_TASK_V1"},
        {"name": "TCEQ_WATER_QUALITY_ANALYST_V1", "task": "TCEQ_WATER_QUALITY_ANALYSIS_TASK_V2"},
        {"name": "TCEQ_SPILL_RESPONSE_ANALYST_V1", "task": "TCEQ_SPILL_RESPONSE_ANALYSIS_TASK_V1"}
      ]
    }',
    description => 'Additive V3 TCEQ team with explicit SQL, RAG, water-quality, and spill-response routing.'
  );
END;
/

-- Read-only deployment confirmation.
SELECT agent_name, status, description
FROM user_ai_agents
WHERE agent_name = 'TCEQ_MULTIAGENT_SUPERVISOR_V3';

SELECT agent_team_name, status, description
FROM user_ai_agent_teams
WHERE agent_team_name = 'TCEQ_MULTIAGENT_TEAM_V3';

SELECT DBMS_CLOUD_AI_AGENT.DESCRIBE_TEAM('TCEQ_MULTIAGENT_TEAM_V3') AS team_description
FROM dual;
