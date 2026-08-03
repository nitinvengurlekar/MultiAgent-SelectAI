import "server-only";

export function getOracleUserMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("ewallet.pem") || message.includes("tnsnames.ora") || message.includes("NJS-512")) {
    return "The database wallet path is not usable by the Oracle Node driver. Check ORACLE_WALLET_LOCATION and ORACLE_DB_CONFIG_DIR.";
  }

  if (message.includes("bad decrypt") || message.includes("NJS-505")) {
    return "The database wallet could not be decrypted. Check ORACLE_DB_WALLET_PASSWORD or use a wallet that matches it.";
  }

  if (message.includes("ORA-01017") || message.includes("invalid username/password")) {
    return "The database rejected that user name or password.";
  }

  return "Could not connect to Oracle Autonomous Database. Check the server-side database configuration.";
}
