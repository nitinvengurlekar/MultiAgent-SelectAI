export type PersonaId = "nisha" | "naveen";

export type Persona = {
  id: PersonaId;
  displayName: string;
  role: string;
  description: string;
  envUserKey: string;
  envPasswordKey: string;
};

export type SessionUser = {
  personaId: PersonaId;
  displayName: string;
  dbUser: string;
  loginAt: number;
};

export type TableColumn = {
  name: string;
  dataType: string;
};

export type FilterOption = {
  key: string;
  label: string;
  column: string;
  values: string[];
};

export type QueryFilters = Record<string, string>;

export type QueryResult = {
  rows: Record<string, unknown>[];
  columns: string[];
  sql: string;
  summary: {
    rowCount: number;
    uniqueRegions: number;
    uniqueCounties: number;
  };
  filters: FilterOption[];
};
