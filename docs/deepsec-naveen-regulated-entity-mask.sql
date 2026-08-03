--------------------------------------------------------------------------------
-- DeepSec extension: mask REGULATED_ENTITY_NAME for Naveen on NOV rows
--------------------------------------------------------------------------------
-- Run this as a user that can create/replace data grants in DDS_USER and
-- administer data grants on DDS_USER.SHORTENED_TCEQ_COMP.
--
-- Business rule:
-- Naveen can still see allowed NOV rows, but for those rows the database masks
-- REGULATED_ENTITY_NAME. Nisha can continue to see broader data and the
-- regulated entity name.
--
-- Why this is split:
-- Data grants are additive. If Naveen keeps a broad SELECT grant that includes
-- REGULATED_ENTITY_NAME for NOV rows, a second masked grant will not hide the
-- column. Replace the existing Naveen regional grant with a non-NOV full grant,
-- then add a NOV grant that excludes REGULATED_ENTITY_NAME.

--------------------------------------------------------------------------------
-- 0) Inspect active grants
--------------------------------------------------------------------------------
-- If Naveen still sees REGULATED_ENTITY_NAME on NOV rows, there is still a
-- TCEQ_CASEWORKER_ROLE grant covering those rows that includes that column.
-- Look for grants whose predicate still includes NOTICE_TYPE = 'NOV' or has no
-- NOTICE_TYPE restriction.

SELECT owner,
       grant_name,
       privilege,
       column_name,
       granted_with_all_columns_except,
       object_owner,
       object_name,
       predicate,
       grantee,
       grantee_type
FROM all_data_grants
WHERE object_owner = 'DDS_USER'
  AND object_name = 'SHORTENED_TCEQ_COMP'
ORDER BY grantee, grant_name, privilege, column_name NULLS FIRST;

--------------------------------------------------------------------------------
-- Optional cleanup
--------------------------------------------------------------------------------
-- Run only the DROP statements for grants that exist in the diagnostic output.
--
-- If the original broad Naveen grant exists, drop it before recreating it with
-- the corrected non-NOV predicate:
--
-- DROP DATA GRANT DDS_USER.NAVEEN_REGION_11;
--
-- If the corrected NOV entity mask grant exists and you want a clean reset:
--
-- DROP DATA GRANT DDS_USER.NAVEEN_REGION_11_NOV_ENTITY_MASK;
--
-- If the earlier incorrect draft grant exists, drop it. That older grant
-- excluded NOTICE_TYPE but still granted REGULATED_ENTITY_NAME, which would
-- defeat this corrected mask:
--
-- DROP DATA GRANT DDS_USER.NAVEEN_REGION_11_NOV_MASK;

--------------------------------------------------------------------------------
-- 1) Non-NOV rows: Naveen keeps full visibility within his mapped region
--------------------------------------------------------------------------------
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

--------------------------------------------------------------------------------
-- 2) NOV rows: Naveen can see the row, but REGULATED_ENTITY_NAME is masked
--------------------------------------------------------------------------------
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

--------------------------------------------------------------------------------
-- Optional validation
--------------------------------------------------------------------------------
-- As NISHA:
-- REGULATED_ENTITY_NAME should be visible for NOTICE_TYPE = 'NOV' rows.
--
-- As NAVEEN:
-- NOTICE_TYPE = 'NOV' rows should still appear, but REGULATED_ENTITY_NAME
-- should be returned as NULL because the database did not grant that column.

SELECT TCEQ_REGION,
       COUNTY,
       STATUS,
       NOTICE_TYPE,
       REGULATED_ENTITY_NAME,
       COMPLAINT_TRACKING_NUMBER
FROM DDS_USER.SHORTENED_TCEQ_COMP
WHERE TCEQ_REGION = 'REGION 11 - AUSTIN'
  AND NOTICE_TYPE = 'NOV'
ORDER BY COMPLAINT_TRACKING_NUMBER
FETCH FIRST 25 ROWS ONLY;
