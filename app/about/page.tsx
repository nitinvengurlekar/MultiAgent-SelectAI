import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getSession } from "@/lib/auth";

const buildSql = `CREATE USER DDS_USER NO AUTHENTICATION default tablespace users;
ALTER USER DDS_USER QUOTA UNLIMITED ON users;

create table DDS_USER.shortened_tceq_comp as select * from vectordb.TCEQ_COMPLAINTS ;

--------------------------------------------------------------------------------
-- 1) Create local end users for direct login in SQL Developer
--------------------------------------------------------------------------------
CREATE END USER NISHA  IDENTIFIED BY "[password hidden]";
CREATE END USER NAVEEN IDENTIFIED BY "[password hidden]";

--------------------------------------------------------------------------------
-- 2) Create local data roles
--------------------------------------------------------------------------------
CREATE DATA ROLE TCEQ_SUPERVISOR_ROLE;
CREATE DATA ROLE TCEQ_CASEWORKER_ROLE;

--------------------------------------------------------------------------------
-- 3) Create a generic database role that allows direct logon
--------------------------------------------------------------------------------
CREATE ROLE DDS_LOGIN_ROLE;
GRANT CREATE SESSION TO DDS_LOGIN_ROLE;
--------------------------------------------------------------------------------
-- 4) Map users to the roles they should get
--------------------------------------------------------------------------------
GRANT DATA ROLE TCEQ_SUPERVISOR_ROLE TO NISHA;
GRANT DATA ROLE TCEQ_CASEWORKER_ROLE TO NAVEEN;
--------------------------------------------------------------------------------
-- 5) Optional lookup table for the caseworker scope
--------------------------------------------------------------------------------
CREATE TABLE DDS_USER.CASEWORKER_REGION_MAP (
  USER_NAME   VARCHAR2(30) PRIMARY KEY,
  TCEQ_REGION VARCHAR2(100) NOT NULL
);

INSERT INTO DDS_USER.CASEWORKER_REGION_MAP VALUES
  ('NAVEEN', 'REGION 11 - AUSTIN');

COMMIT;

--------------------------------------------------------------------------------
-- 6) Data grants
--------------------------------------------------------------------------------
-- Nisha: higher privilege; can query all complaint rows
CREATE OR REPLACE DATA GRANT DDS_USER.NISHA_ALL_REGIONS
  AS SELECT
  ON DDS_USER.SHORTENED_TCEQ_COMP
  TO TCEQ_SUPERVISOR_ROLE;

-- Naveen: can see only the rows mapped to his username.
-- Non-NOV rows keep full column visibility.
CREATE OR REPLACE DATA GRANT DDS_USER.NAVEEN_REGION_11
  AS SELECT
  ON DDS_USER.SHORTENED_TCEQ_COMP
  WHERE TCEQ_Region IN (
    SELECT TCEQ_REGION
    FROM DDS_USER.CASEWORKER_REGION_MAP
    WHERE UPPER(USER_NAME) = UPPER(ORA_END_USER_CONTEXT.USERNAME)
  )
  AND (NOTICE_TYPE <> 'NOV' OR NOTICE_TYPE IS NULL)
  TO TCEQ_CASEWORKER_ROLE;

-- Naveen: NOV rows are still visible, but REGULATED_ENTITY_NAME is masked by the database.
CREATE OR REPLACE DATA GRANT DDS_USER.NAVEEN_REGION_11_NOV_ENTITY_MASK
  AS SELECT (ALL COLUMNS EXCEPT REGULATED_ENTITY_NAME)
  ON DDS_USER.SHORTENED_TCEQ_COMP
  WHERE TCEQ_Region IN (
    SELECT TCEQ_REGION
    FROM DDS_USER.CASEWORKER_REGION_MAP
    WHERE UPPER(USER_NAME) = UPPER(ORA_END_USER_CONTEXT.USERNAME)
  )
  AND NOTICE_TYPE = 'NOV'
  TO TCEQ_CASEWORKER_ROLE;

SELECT COMPLAINT_TRACKING_NUMBER, TCEQ_Region, STATUS
FROM DDS_USER.SHORTENED_TCEQ_COMP
ORDER BY COMPLAINT_TRACKING_NUMBER;

-- Optional validation
SELECT ORA_END_USER_CONTEXT.USERNAME AS CURRENT_USER FROM DUAL;

GRANT DDS_LOGIN_ROLE to TCEQ_SUPERVISOR_ROLE, TCEQ_CASEWORKER_ROLE`;

export default async function AboutPage() {
  const session = await getSession();
  if (!session) redirect("/deepsec/login");

  return (
    <>
      <Nav user={session.displayName} />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-[#b33f2d]">Reference build script</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950">DDS Build</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            This page captures the local-user Deep Data Security setup used by the demo. Database passwords are intentionally hidden.
          </p>
        </section>

        <section className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="text-sm font-bold text-white">Oracle SQL</span>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">Passwords hidden</span>
          </div>
          <pre className="overflow-x-auto p-5 text-sm leading-6 text-stone-100">
            <code>{buildSql}</code>
          </pre>
        </section>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-sm text-stone-500">Security enforced by Oracle Deep Data Security.</footer>
    </>
  );
}
