# TCEQ Supervisor Multi-Agent Notebook

## Purpose

This notebook is the canonical technical and demo reference for the TCEQ Select AI multi-agent experience. It reflects the V3 objects currently used by the application and validated in Oracle Autonomous Database.

The deployment is additive. It reuses the existing specialist agents, tasks, tools, AI profiles, complaint data, water-quality data, spill-response data, and RAG vector store. It does not contain database passwords, wallet files, API keys, or credential values.

## Active Application Baseline

| Role | Active Oracle object | Status |
| --- | --- | --- |
| Application team | `TCEQ_MULTIAGENT_TEAM_V3` | Enabled; application default |
| Supervisor | `TCEQ_MULTIAGENT_SUPERVISOR_V3` | Enabled |
| Complaint specialist | `TCEQ_COMPLAINT_ADVISOR` | Enabled |
| Water-quality specialist | `TCEQ_WATER_QUALITY_ANALYST_V1` | Enabled |
| Spill-response specialist | `TCEQ_SPILL_RESPONSE_ANALYST_V1` | Enabled |

The previous `TCEQ_MULTIAGENT_TEAM_V2` and `TCEQ_MULTIAGENT_SUPERVISOR_V2` are superseded. They are not application defaults and may be retired after the guarded V2 cleanup is approved. Do not remove shared objects merely because their names contain a lower version suffix.

## Architecture

```text
TCEQ_MULTIAGENT_TEAM_V3
└── TCEQ_MULTIAGENT_SUPERVISOR_V3
    ├── TCEQ_COMPLAINT_ADVISOR
    │   └── TCEQ_COMPLAINT_MULTIAGENT_TASK_V1
    │       ├── COMPLAINT_SQL
    │       ├── COMPLAINT_RAG_TOOL
    │       └── WEBSEARCH_TCEQ
    ├── TCEQ_WATER_QUALITY_ANALYST_V1
    │   └── TCEQ_WATER_QUALITY_ANALYSIS_TASK_V2
    │       └── TCEQ_WATER_QUALITY_SQL_TOOL_V1
    └── TCEQ_SPILL_RESPONSE_ANALYST_V1
        └── TCEQ_SPILL_RESPONSE_ANALYSIS_TASK_V1
            └── TCEQ_SPILL_RESPONSE_SQL_TOOL_V1
```

The team uses a sequential Supervisor process. The Supervisor delegates each requested specialist at most once, accepts a successful specialist result without retrying it, and synthesizes the final response.

## Current Object Inventory

The following inventory was checked against the live `VECTORDB` schema on 2026-08-06. Every listed object was enabled, and the latest recorded V3 team execution succeeded.

### AI profiles

| Purpose | Profile |
| --- | --- |
| Supervisor and agent language model | `OPENAI_4MY_AGENT` |
| Complaint knowledge-base retrieval | `TCEQ_RAG_AGENT_PROFILE` |
| Water-quality NL2SQL | `TCEQ_WATER_QUALITY_SQL_PROFILE_V1` |
| Spill-response NL2SQL | `TCEQ_SPILL_RESPONSE_SQL_PROFILE_V1` |

The complaint RAG profile uses vector index `TCEQ_RAG_AGENT_INDEX`, backed by the configured Oracle vector store. Keep provider credentials, OCI identifiers, and secrets outside this notebook.

### Agents and tasks

| Display role | Agent | Assigned task |
| --- | --- | --- |
| Supervisor | `TCEQ_MULTIAGENT_SUPERVISOR_V3` | Oracle-generated Supervisor task |
| Complaint Caseworker | `TCEQ_COMPLAINT_ADVISOR` | `TCEQ_COMPLAINT_MULTIAGENT_TASK_V1` |
| Water Quality Analyst | `TCEQ_WATER_QUALITY_ANALYST_V1` | `TCEQ_WATER_QUALITY_ANALYSIS_TASK_V2` |
| Spill Response Analyst | `TCEQ_SPILL_RESPONSE_ANALYST_V1` | `TCEQ_SPILL_RESPONSE_ANALYSIS_TASK_V1` |

`TCEQ_WATER_QUALITY_ANALYSIS_TASK_V2` is intentionally retained. Although its name ends in V2, it is a live dependency of `TCEQ_MULTIAGENT_TEAM_V3` and must not be dropped during V2 cleanup.

### Tools

| Specialist | Tool | Evidence type |
| --- | --- | --- |
| Complaint Caseworker | `COMPLAINT_SQL` | Governed complaint data |
| Complaint Caseworker | `COMPLAINT_RAG_TOOL` | Vectorized TCEQ knowledge-base retrieval |
| Complaint Caseworker | `WEBSEARCH_TCEQ` | Current external context when explicitly needed |
| Water Quality Analyst | `TCEQ_WATER_QUALITY_SQL_TOOL_V1` | Governed sampling measurements |
| Spill Response Analyst | `TCEQ_SPILL_RESPONSE_SQL_TOOL_V1` | Governed emergency-response spill records |

## Supervisor Routing Contract

`TCEQ_MULTIAGENT_SUPERVISOR_V3` applies these routing rules:

1. Complaint records and complaint analysis route to `TCEQ_COMPLAINT_ADVISOR`.
2. TCEQ knowledge-base, document, program-guidance, policy, compliance, and LDAR questions route to `TCEQ_COMPLAINT_ADVISOR`, with an explicit instruction to invoke `COMPLAINT_RAG_TOOL`.
3. Water sampling and measurement questions route to `TCEQ_WATER_QUALITY_ANALYST_V1`.
4. Specific emergency-response spill, release, material, response-action, and remediation-record questions route to `TCEQ_SPILL_RESPONSE_ANALYST_V1`.
5. Cross-domain requests route once to every requested specialist.
6. The final response labels each specialist source, keeps unlike record counts separate, and does not infer causation between complaint, spill, and water-sampling evidence.

LDAR and leak-detection-program guidance are knowledge-base requests. They are not spill-response requests unless the prompt explicitly concerns a particular spill, release, or emergency-response incident.

## Deployment and Validation

The canonical applied SQL is maintained alongside this notebook:

- [V3 deployment](../TCEQ_MultiAgent_V3_Deploy.sql)
- [V3 validation](../TCEQ_MultiAgent_V3_Validate.sql)

The deployment script validates all reused dependencies before creating the V3 Supervisor and team. It does not overwrite or drop existing objects.

To select the active team in a SQL worksheet session:

```sql
EXEC DBMS_CLOUD_AI_AGENT.SET_TEAM('TCEQ_MULTIAGENT_TEAM_V3');
```

The application does not depend on a worksheet session default. It passes `TCEQ_MULTIAGENT_TEAM_V3` explicitly when running a conversation.

## Validated Demo Prompts

### Complaint SQL

```text
List up to 5 air-related complaints in Johnson County. For each, provide the tracking number, status, location, and a one-sentence incident summary.
```

Expected route: `TCEQ_COMPLAINT_ADVISOR` → `COMPLAINT_SQL`.

### Water quality

```text
For the Barton Creek watershed, show up to 4 recent water-quality sampling records. Include site name, sample date, parameter, result, unit, and qualifier.
```

Expected route: `TCEQ_WATER_QUALITY_ANALYST_V1` → `TCEQ_WATER_QUALITY_SQL_TOOL_V1`.

### Spill response

```text
For Johnson County, show up to 4 emergency-response spill records. Include incident number, location, receiving water body, released material, amount, status, and action taken.
```

Expected route: `TCEQ_SPILL_RESPONSE_ANALYST_V1` → `TCEQ_SPILL_RESPONSE_SQL_TOOL_V1`.

### Knowledge-base RAG

```text
Explain the leak detection and repair program.
```

Expected route: `TCEQ_COMPLAINT_ADVISOR` → `COMPLAINT_RAG_TOOL`. The UI should show RAG as observed only when Oracle tool history confirms that invocation.

### Cross-domain Supervisor report

```text
Use all three specialists. Return exactly three source-labelled count lines and no causal conclusions: Complaint - count complaint records where COUNTY is TRAVIS; Spill Response - count distinct spill INCIDENTNUMBER records where COUNTY is TRAVIS; Water Quality - count measurement rows where WATERSHED is Lady Bird Lake, PARAMETER is DISSOLVED OXYGEN, and SAMPLE_DATE is in calendar year 2024. Do not use web search or RAG.
```

Expected routes and deterministic baseline:

1. `TCEQ_COMPLAINT_ADVISOR` → `COMPLAINT_SQL` → 7,352 complaint records.
2. `TCEQ_SPILL_RESPONSE_ANALYST_V1` → `TCEQ_SPILL_RESPONSE_SQL_TOOL_V1` → 590 distinct spill incidents.
3. `TCEQ_WATER_QUALITY_ANALYST_V1` → `TCEQ_WATER_QUALITY_SQL_TOOL_V1` → 224 measurement rows.
4. `TCEQ_MULTIAGENT_SUPERVISOR_V3` → source-separated final synthesis.

These values have different units and scopes. Present them side by side, but do not place them on a shared quantitative scale or claim relative severity or causation.

## Observability

Correlate all execution evidence using the exact `TEAM_EXEC_ID`:

| View | Evidence |
| --- | --- |
| `USER_AI_AGENT_TEAM_HISTORY` | Team, state, start time, end time, duration |
| `USER_AI_AGENT_TASK_HISTORY` | Supervisor and specialist delegation order and state |
| `USER_AI_AGENT_TOOL_HISTORY` | Actual tool invocation, owning agent/task, input, and output |

```sql
SELECT team_exec_id, team_name, state, start_date, end_date
FROM user_ai_agent_team_history
WHERE team_name = 'TCEQ_MULTIAGENT_TEAM_V3'
ORDER BY start_date DESC
FETCH FIRST 1 ROW ONLY;
```

Use the returned `TEAM_EXEC_ID` to filter both task and tool history. Do not combine unbounded latest rows from different executions, and do not display internal reasoning or chain-of-thought in the application.

## V2 Cleanup Boundary

The only superseded V2 orchestration objects currently identified for guarded retirement are:

- `TCEQ_MULTIAGENT_TEAM_V2`
- `TCEQ_MULTIAGENT_SUPERVISOR_V2`
- The Supervisor-generated `TCEQ_MULTIAGENT_SUPERVISOR_V2$TASK`, which should be handled by the agent drop rather than dropped independently

Preserve these shared dependencies:

- `TCEQ_WATER_QUALITY_ANALYSIS_TASK_V2`
- All three specialist agents
- All SQL, RAG, and web-search tools
- All AI profiles and vector-index structures
- Oracle execution history

Run a complete V3 smoke test before and after any approved cleanup. Never place cleanup statements in the deployment or validation scripts.
