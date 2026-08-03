# EcoAgency Agentic Intelligence Demo

A Next.js 15 demo for Oracle Autonomous Database `SELECT AI AGENT` workflows. The app presents curated EcoAgency scenarios based on the prompts in `Build-SelectAI-Agents-SQL.rtf`, executes them from server-side route handlers, and displays agent responses plus execution history.

The earlier DeepSec demo code remains in the workspace, but the primary app flow is now the EcoAgency Select AI Agent demo.

## ADB Connection Reference

The reusable wallet-based ADB connection pattern is documented in [docs/ADBConnector.md](/Users/NVENGURL/Documents/TCEQ_Query_Agents/docs/ADBConnector.md).

Secrets are stored in macOS Keychain under stable lookup names. The reference file documents the lookup names, wallet filename, known wallet paths, and recovery flow without storing raw passwords.

The Naveen `NOTICE_TYPE = NOV` regulated-entity masking extension is documented in [docs/deepsec-naveen-regulated-entity-mask.sql](/Users/NVENGURL/Documents/TCEQ_Query_Agents/docs/deepsec-naveen-regulated-entity-mask.sql).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure `.env.local` with server-only Oracle values:

   ```bash
   VECTORDB_USER=VECTORDB
   VECTORDB_PASSWORD=replace-with-vectordb-password
   ORACLE_DB_CONNECT_STRING=genairagdb_low
   ORACLE_DB_WALLET_LOCATION=/path/to/wallet
   ORACLE_DB_CONFIG_DIR=/path/to/wallet
   ORACLE_DB_WALLET_PASSWORD=replace-with-wallet-password-if-needed
   SESSION_SECRET=replace-with-long-random-string
   ```

   Existing wallet/connect-string values from the DeepSec app can be reused. Do not expose database credentials to browser code.

3. Run the app:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3001](http://localhost:3001) if port 3000 is already in use.

## Primary Routes

- `/` - EcoAgency demo entry page
- `/conversations-ai` - primary conversational Select AI Agent interface
- `/demo-mode` - launcher for demo tracks, including DeepSec
- `/deepsec/login` - Deep Data Security persona login
- `/deepsec/dashboard` - database-enforced access summary
- `/deepsec/results` - complaint explorer for the active DeepSec user

## API Routes

- `GET /api/ecoagency/status`
- `GET /api/ecoagency/scenarios`
- `POST /api/ecoagency/scenarios/[id]/run`
- `GET /api/ecoagency/history`
- `POST /api/ecoagency/team/reset`

## Security Notes

- Oracle connectivity uses `oracledb` only from server-side code.
- The EcoAgency app requires explicit `VECTORDB_USER` and `VECTORDB_PASSWORD` values.
- User-facing copy uses “EcoAgency”; original database object names only appear in technical context.
- SQL prompts are built server-side. User input is limited to known scenario IDs.
