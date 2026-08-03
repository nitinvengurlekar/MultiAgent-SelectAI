import type { EcoScenario, ScenarioId } from "@/lib/ecoagency-types";

export const agentTeamName = "OVERALL_COMPLAINT_AGENT_SEARCH_TEAM";

export const ecoScenarios: EcoScenario[] = [
  {
    id: "waste-ldar",
    title: "Waste and Oil Complaint Analysis",
    shortTitle: "Waste + LDAR",
    category: "Complaint intelligence",
    prompt:
      "which complaints numbers are associated with waste and how would the Leak Detection and Repair Program address these incidents",
    summary:
      "Find complaint numbers associated with waste or oil incidents and connect them to a practical remediation program.",
    whatYouAreSeeing:
      "Oracle Select AI Agent coordinates database search and knowledge context to answer a business question in natural language.",
    whyItMatters:
      "A presenter can show that operational complaint data and program knowledge can be joined at answer time without hand-built dashboards for every question.",
    expectedResult:
      "A list of relevant complaint numbers plus a plain-English explanation of how LDAR-style inspection, detection, repair, and documentation applies.",
    presenterNotes:
      "Use this scenario first. It is concise, easy to understand, and demonstrates database grounding plus policy/program explanation.",
    badges: ["Select AI Agent", "Complaint Data", "Knowledge Base", "MCP Tools"]
  },
  {
    id: "water-county-report",
    title: "Water Contamination County Report",
    shortTitle: "Water report",
    category: "Executive report",
    prompt:
      "which complaints numbers are associated with water contamination, which county has the highest complaints, and is this number high compared to the population of the county. Finally produce a email type format for this report and list any documents from the knowledgebase that are related to these water issues",
    summary:
      "Generate an executive-style email report that combines complaint counts, county context, population comparison, and supporting documents.",
    whatYouAreSeeing:
      "The agent turns a multi-step analytical request into a composed report with data retrieval, web/population context, and evidence references.",
    whyItMatters:
      "This shows the customer-facing value: the database is not only storing data, it is orchestrating grounded analysis across internal and external sources.",
    expectedResult:
      "An email-style report with complaint numbers, the highest-volume county, population-normalized context, and relevant knowledge-base documents.",
    presenterNotes:
      "Good for leadership audiences. Emphasize that the response format is requested by the prompt and produced from the same agent workflow.",
    badges: ["Select AI Agent", "Web Search", "Knowledge Base", "Autonomous Database"]
  },
  {
    id: "johnson-air-profile",
    title: "Johnson County Air Issue Profile",
    shortTitle: "Air profile",
    category: "Risk assessment",
    prompt:
      "Your task is to perform an initial assessment of Johnson County's air issue profile.\n1. Retrieve the most recent total population figure for this Texas county.\n2. Using the database report the total count of air related incidents within the county.\n3. Based on your findings, evaluate the per capita incident rate and determine if the frequency of air issues appears unusually high or acceptably low, providing a comparative context or benchmark if available.\n4. List these air related incidents",
    summary:
      "Assess a county-level air issue profile using complaint data and population-aware context.",
    whatYouAreSeeing:
      "A complex prompt is decomposed into data retrieval, contextual research, rate calculation, and a final incident list.",
    whyItMatters:
      "Agency staff can move from raw complaint search to a defensible first-pass assessment without leaving the governed database workflow.",
    expectedResult:
      "A population figure, air-related incident count, per-capita interpretation, and a list of relevant incidents.",
    presenterNotes:
      "Use this scenario when you want to show multi-step reasoning and the value of web context in the MCP-backed flow.",
    badges: ["Select AI Agent", "Web Search", "Complaint Data", "Risk Context"]
  },
  {
    id: "johnson-air-assessment",
    title: "Johnson County Air Incident Assessment",
    shortTitle: "Air assessment",
    category: "Analyst workflow",
    prompt:
      "perform an assessment of Johnson County air related incidents, and using the recent total population figure for this Texas county evaluate the per capita incident rate and determine if the frequency of air issues appears unusually high or acceptably low, providing a comparative context or benchmark if available",
    summary:
      "A shorter analyst prompt for county-level air incident rate interpretation.",
    whatYouAreSeeing:
      "The agent produces an assessment answer from a compact natural-language request.",
    whyItMatters:
      "This is a realistic prompt a program manager could ask during a live operational review.",
    expectedResult:
      "A concise assessment of Johnson County air incidents with per-capita interpretation.",
    presenterNotes:
      "Use when time is short. It shows the same capability as the profile scenario with less output.",
    badges: ["Select AI Agent", "Web Search", "Autonomous Database"]
  },
  {
    id: "johnson-air-count",
    title: "Johnson County Air Issue Count",
    shortTitle: "Air count",
    category: "Fast lookup",
    prompt: "list the count of air related issues in Johnson County",
    summary:
      "A quick database-grounded count request for a specific issue type and county.",
    whatYouAreSeeing:
      "The agent handles a targeted count question against governed complaint data.",
    whyItMatters:
      "Simple fact retrieval is often the opening move before deeper investigation.",
    expectedResult:
      "A count of air-related issues for Johnson County.",
    presenterNotes:
      "Use this as a quick warm-up or as a fallback if you want a shorter live run.",
    badges: ["Select AI Agent", "Complaint Data", "Fast Lookup"]
  }
];

export function getScenario(id: string): EcoScenario | null {
  return ecoScenarios.find((scenario) => scenario.id === id) || null;
}

export function isScenarioId(id: string): id is ScenarioId {
  return ecoScenarios.some((scenario) => scenario.id === id);
}
