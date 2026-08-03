import "server-only";

import oracledb from "oracledb";
import type { Persona } from "@/lib/types";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let thickModeInitialized = false;

function maybeInitOracleClient() {
  if (thickModeInitialized || process.env.ORACLE_THICK_MODE !== "true") {
    return;
  }
  const libDir = firstEnv("ORACLE_CLIENT_LIB_DIR");
  oracledb.initOracleClient(libDir ? { libDir } : undefined);
  thickModeInitialized = true;
}

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) {
      return value.trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return undefined;
}

export function getPersonaCredentials(persona: Persona, passwordOverride?: string) {
  const user = firstEnv(persona.envUserKey);
  const configuredPassword = firstEnv(persona.envPasswordKey);
  if (!user) {
    throw new Error(`${persona.envUserKey} is not configured.`);
  }
  const password = passwordOverride || configuredPassword;
  if (!password) {
    throw new Error(`${persona.envPasswordKey} is not configured.`);
  }
  return { user, password };
}

export function getConnectionConfig(user: string, password: string) {
  const connectString = firstEnv("ORACLE_CONNECT_STRING", "ORACLE_DB_CONNECT_STRING");
  const walletLocation = firstEnv("ORACLE_WALLET_LOCATION", "ORACLE_DB_WALLET_LOCATION");
  const configDir = firstEnv("ORACLE_DB_CONFIG_DIR") || walletLocation;
  const walletPassword = firstEnv("ORACLE_WALLET_PASSWORD", "ORACLE_DB_WALLET_PASSWORD");

  if (!connectString) {
    throw new Error("ORACLE_CONNECT_STRING or ORACLE_DB_CONNECT_STRING is required.");
  }

  return {
    user,
    password,
    connectString,
    configDir,
    walletLocation,
    walletPassword
  };
}

export async function withConnection<T>(
  user: string,
  password: string,
  fn: (connection: oracledb.Connection) => Promise<T>
) {
  maybeInitOracleClient();
  const connection = await oracledb.getConnection(getConnectionConfig(user, password));
  try {
    return await fn(connection);
  } finally {
    await connection.close();
  }
}

export async function validateLogin(persona: Persona, password: string) {
  const credentials = getPersonaCredentials(persona, password);
  return withConnection(credentials.user, credentials.password, async (connection) => {
    await connection.execute("select 1 from dual");
    return credentials.user;
  });
}

export async function runAsPersona<T>(persona: Persona, fn: (connection: oracledb.Connection) => Promise<T>) {
  const credentials = getPersonaCredentials(persona);
  return withConnection(credentials.user, credentials.password, fn);
}
