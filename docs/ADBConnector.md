# ADBConnector Reference

This project has a reusable Oracle Autonomous Database connection pattern captured as a Codex skill:

```text
/Users/NVENGURL/.codex/skills/adb-connector
```

Use it for future Oracle ADB work that needs wallet-based `oracledb` connectivity, especially Next.js server routes.

## Keychain Entries

Sensitive values are stored in macOS Keychain, not in this repository or in the skill files.

```text
Wallet password
service: oracle-adb-wallet
account: GenAIRAGDb-SEAssist

VECTORDB password
service: oracle-adb-user
account: VECTORDB
```

To retrieve a value manually:

```bash
security find-generic-password -a "GenAIRAGDb-SEAssist" -s "oracle-adb-wallet" -w
security find-generic-password -a "VECTORDB" -s "oracle-adb-user" -w
```

Do not paste retrieved values into committed files, screenshots, logs, or chat unless intentionally rotating or repairing credentials.

## Wallet Locations

Known wallet archive:

```text
Wallet_GenAIRAGDb-SEAssist.zip
```

Known local locations:

```text
/Users/NVENGURL/Downloads/Wallet_GenAIRAGDb-SEAssist.zip
/Users/NVENGURL/.oracle/wallets/genairagdb-seassist
/private/tmp/tceq-dds-wallet-genairagdb-seassist
```

Use the home-folder wallet path for normal development because it survives reboots. If the extracted wallet folder is missing, extract the zip again and point `.env.local` to the extracted folder.

## Expected Environment Variables

This project supports the following names:

```env
VECTORDB_USER=VECTORDB
VECTORDB_PASSWORD="[from Keychain if missing]"
ORACLE_DB_CONNECT_STRING=genairagdb_low
ORACLE_DB_WALLET_LOCATION=/Users/NVENGURL/.oracle/wallets/genairagdb-seassist
ORACLE_DB_CONFIG_DIR=/Users/NVENGURL/.oracle/wallets/genairagdb-seassist
ORACLE_DB_WALLET_PASSWORD="[from Keychain if missing]"
```

Aliases also supported by the app helpers:

```env
ORACLE_CONNECT_STRING
ORACLE_WALLET_LOCATION
ORACLE_WALLET_PASSWORD
ORACLE_VECTORDB_USER
ORACLE_VECTORDB_PASSWORD
```

## Future Recovery Flow

1. Check whether `.env.local` already has working ADB values.
2. Check whether the wallet folder exists at `/Users/NVENGURL/.oracle/wallets/genairagdb-seassist`.
3. If missing, extract `/Users/NVENGURL/Downloads/Wallet_GenAIRAGDb-SEAssist.zip` there.
4. Retrieve missing passwords from Keychain using the service/account names above.
5. Run a minimal server-side connection test such as `select user from dual`.
6. Keep all Oracle access server-side.

## Safety Notes

- Do not commit `.env.local`.
- Do not commit wallet files.
- Do not store raw wallet passwords in Codex skills.
- Use bind variables for user input.
- For CLOB responses returned as JSON, set `oracledb.fetchAsString = [oracledb.CLOB]`.
