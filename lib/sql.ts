import "server-only";

import type oracledb from "oracledb";
import type { FilterOption, QueryFilters, QueryResult, TableColumn } from "@/lib/types";

const owner = "DDS_USER";
const table = "SHORTENED_TCEQ_COMP";
const maxRows = 75;

const filterCandidates = {
  region: ["TCEQ_REGION", "REGION", "REGION_NAME", "REGION_NUMBER", "TCEQ_REG"],
  county: ["COUNTY", "COUNTY_NAME"],
  complaintType: ["COMPLAINT_TYPE", "COMPLAINT_TYPE_DESC", "COMPLAINT_CATEGORY", "TYPE"],
  status: ["STATUS", "COMPLAINT_STATUS", "INVESTIGATION_STATUS", "CURRENT_STATUS"]
};

const labelMap: Record<string, string> = {
  region: "Region",
  county: "County",
  complaintType: "Complaint type",
  status: "Status"
};

const priorityColumns = [
  "COMPLAINT_ID",
  "INCIDENT_ID",
  "CASE_ID",
  "TRACKING_NUMBER",
  "RECEIVED_DATE",
  "COMPLAINT_DATE",
  "TCEQ_REGION",
  "REGION",
  "COUNTY",
  "COMPLAINT_TYPE",
  "COMPLAINT_STATUS",
  "STATUS",
  "NOTICE_TYPE",
  "REGULATED_ENTITY_NAME",
  "PROGRAM",
  "SUMMARY",
  "DESCRIPTION"
];

function quoteName(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function normalize(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function rowValue(row: Record<string, unknown>, column: string) {
  return row[column] ?? row[column.toUpperCase()] ?? row[column.toLowerCase()];
}

export async function getTableColumns(connection: oracledb.Connection): Promise<TableColumn[]> {
  const result = await connection.execute<Record<string, string>>(
    `select column_name as "name", data_type as "dataType"
       from all_tab_columns
      where owner = :owner and table_name = :tableName
      order by column_id`,
    { owner, tableName: table }
  );
  const dictionaryColumns = (result.rows || []).map((row) => ({
    name: row.name,
    dataType: row.dataType
  }));
  if (dictionaryColumns.length > 0) {
    return dictionaryColumns;
  }

  const sample = await connection.execute(`select * from ${owner}.${table} fetch first 1 row only`);
  return (sample.metaData || []).map((column) => ({
    name: column.name,
    dataType: String(column.dbTypeName || column.dbType || "UNKNOWN")
  }));
}

function findColumn(columns: TableColumn[], candidates: string[]) {
  const byExact = new Map(columns.map((column) => [column.name.toUpperCase(), column.name]));
  for (const candidate of candidates) {
    const exact = byExact.get(candidate);
    if (exact) return exact;
  }

  const normalized = columns.map((column) => ({ name: column.name, key: normalize(column.name) }));
  for (const candidate of candidates.map(normalize)) {
    const partial = normalized.find((column) => column.key.includes(candidate) || candidate.includes(column.key));
    if (partial) return partial.name;
  }
  return null;
}

function getFilterColumns(columns: TableColumn[]) {
  return Object.fromEntries(
    Object.entries(filterCandidates)
      .map(([key, candidates]) => [key, findColumn(columns, candidates)])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function getDisplayColumns(columns: TableColumn[], filterColumns: Record<string, string>) {
  const available = new Set(columns.map((column) => column.name));
  const selected: string[] = [];

  for (const candidate of priorityColumns) {
    const match = columns.find((column) => column.name.toUpperCase() === candidate);
    if (match && !selected.includes(match.name)) selected.push(match.name);
  }

  for (const column of Object.values(filterColumns)) {
    if (available.has(column) && !selected.includes(column)) selected.push(column);
  }

  for (const column of columns) {
    if (selected.length >= 9) break;
    if (!selected.includes(column.name)) selected.push(column.name);
  }

  return selected.slice(0, 9);
}

async function getFilterOptions(
  connection: oracledb.Connection,
  filterColumns: Record<string, string>
): Promise<FilterOption[]> {
  const options: FilterOption[] = [];
  for (const [key, column] of Object.entries(filterColumns)) {
    const result = await connection.execute<Record<string, unknown>>(
      `select ${quoteName(column)} as "value"
         from (
           select distinct ${quoteName(column)}
             from ${owner}.${table}
            where ${quoteName(column)} is not null
            order by ${quoteName(column)}
         )
        where rownum <= 50`
    );
    options.push({
      key,
      label: labelMap[key] || key,
      column,
      values: (result.rows || []).map((row) => String(row.value)).filter(Boolean)
    });
  }
  return options;
}

export async function runComplaintQuery(
  connection: oracledb.Connection,
  filters: QueryFilters = {}
): Promise<QueryResult> {
  const columns = await getTableColumns(connection);
  if (columns.length === 0) {
    throw new Error(`${owner}.${table} was not found or is not visible to this user.`);
  }

  const filterColumns = getFilterColumns(columns);
  const displayColumns = getDisplayColumns(columns, filterColumns);
  const binds: Record<string, string> = {};
  const where: string[] = [];

  for (const [key, column] of Object.entries(filterColumns)) {
    const value = filters[key];
    if (value && value !== "all") {
      const bindName = `b_${key}`;
      where.push(`${quoteName(column)} = :${bindName}`);
      binds[bindName] = value;
    }
  }

  const whereSql = where.length ? ` where ${where.join(" and ")}` : "";
  const selectList = displayColumns.map((column) => `${quoteName(column)} as "${column}"`).join(", ");
  const orderColumn = displayColumns[0];
  const sql = `select ${selectList} from ${owner}.${table}${whereSql} order by ${quoteName(orderColumn)} fetch first ${maxRows} rows only`;

  const result = await connection.execute<Record<string, unknown>>(sql, binds);
  const rows = result.rows || [];
  const filtersForUi = await getFilterOptions(connection, filterColumns);
  const regionColumn = filterColumns.region;
  const countyColumn = filterColumns.county;
  const uniqueRegions = regionColumn ? new Set(rows.map((row) => rowValue(row, regionColumn)).filter(Boolean)).size : 0;
  const uniqueCounties = countyColumn ? new Set(rows.map((row) => rowValue(row, countyColumn)).filter(Boolean)).size : 0;

  return {
    rows,
    columns: displayColumns,
    sql,
    summary: {
      rowCount: rows.length,
      uniqueRegions,
      uniqueCounties
    },
    filters: filtersForUi
  };
}
