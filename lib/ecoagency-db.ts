import "server-only";

import oracledb from "oracledb";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim().replace(/^['"]|['"]$/g, "");
    if (value) return value;
  }
  return undefined;
}

function getConfig() {
  const explicitUser = readEnv("VECTORDB_USER", "ORACLE_VECTORDB_USER");
  const oracleDbUser = readEnv("ORACLE_DB_USER");
  const user = explicitUser || (oracleDbUser?.toUpperCase() === "VECTORDB" ? oracleDbUser : undefined);
  const password =
    readEnv("VECTORDB_PASSWORD", "ORACLE_VECTORDB_PASSWORD") ||
    (oracleDbUser?.toUpperCase() === "VECTORDB" ? readEnv("ORACLE_DB_PASSWORD") : undefined);
  const connectString = readEnv("ORACLE_CONNECT_STRING", "ORACLE_DB_CONNECT_STRING");
  const walletLocation = readEnv("ORACLE_WALLET_LOCATION", "ORACLE_DB_WALLET_LOCATION");
  const configDir = readEnv("ORACLE_DB_CONFIG_DIR") || walletLocation;
  const walletPassword = readEnv("ORACLE_WALLET_PASSWORD", "ORACLE_DB_WALLET_PASSWORD");

  const missing = [
    ["VECTORDB_USER", user],
    ["VECTORDB_PASSWORD", password],
    ["ORACLE_DB_CONNECT_STRING", connectString],
    ["ORACLE_DB_WALLET_LOCATION", walletLocation]
  ].flatMap(([key, value]) => (value ? [] : [key]));

  if (missing.length) {
    throw new Error(`Missing EcoAgency database configuration: ${missing.join(", ")}`);
  }

  return {
    user: user as string,
    password: password as string,
    connectString: connectString as string,
    configDir,
    walletLocation,
    walletPassword
  };
}

export async function withEcoConnection<T>(fn: (connection: oracledb.Connection) => Promise<T>) {
  const connection = await oracledb.getConnection(getConfig());
  try {
    return await fn(connection);
  } finally {
    await connection.close();
  }
}

export async function executeEcoSql<T extends Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = {}
) {
  return withEcoConnection(async (connection) => {
    const result = await connection.execute<T>(sql, binds);
    return result.rows || [];
  });
}

export function getEcoConfigStatus() {
  try {
    const config = getConfig();
    return {
      configured: true,
      user: config.user,
      connectString: config.connectString,
      walletConfigured: Boolean(config.walletLocation),
      walletPasswordConfigured: Boolean(config.walletPassword)
    };
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : "EcoAgency database configuration is incomplete."
    };
  }
}
