CREATE OR REPLACE PROCEDURE ALTER_CM_SP_PURPOSE_PII_CAT_ASSOC
IS
  BEGIN
    declare
      column_count INTEGER;
    begin
      select count(*) INTO column_count
      FROM ALL_TAB_COLUMNS
      WHERE OWNER = (SELECT USER FROM DUAL)
        AND TABLE_NAME = 'CM_SP_PURPOSE_PII_CAT_ASSOC'
        AND COLUMN_NAME = 'IS_CONSENTED';
      IF column_count = 0
      THEN
        EXECUTE IMMEDIATE 'ALTER TABLE CM_SP_PURPOSE_PII_CAT_ASSOC ADD IS_CONSENTED NUMBER(1) DEFAULT 1 NOT NULL';
      END IF;
    end;
  END;
/

CALL ALTER_CM_SP_PURPOSE_PII_CAT_ASSOC()
/

DROP PROCEDURE ALTER_CM_SP_PURPOSE_PII_CAT_ASSOC
/
