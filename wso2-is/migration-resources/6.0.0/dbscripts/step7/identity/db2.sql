CREATE OR REPLACE PROCEDURE ADD_PRIMARY_KEY_COLUMN(IN TABLE_NAME VARCHAR (255))
     DYNAMIC RESULT SETS 0
     MODIFIES SQL DATA
     LANGUAGE SQL
BEGIN
    DECLARE SEQUENCE_NAME VARCHAR(100);
    DECLARE TRIGGER_NAME VARCHAR(100);
    DECLARE ADD_COLUMN_STATEMENT VARCHAR(300);
    DECLARE SEQ_STATEMENT VARCHAR(400);
    DECLARE TRIG_STATEMENT VARCHAR(600);
    DECLARE REORG_STATEMENT VARCHAR(300);
    DECLARE UPDATE_STATEMENT VARCHAR(300);
    DECLARE PK_STATEMENT VARCHAR(300);

    IF (NOT EXISTS(
    SELECT 1 FROM SYSCAT.COLUMNS WHERE TABNAME = TABLE_NAME AND COLNAME = 'ID'))
    THEN
        SET SEQUENCE_NAME = TABLE_NAME || '_PK_SEQUENCE';
        SET TRIGGER_NAME = TABLE_NAME || '_PK_TRIGGER';

        SET ADD_COLUMN_STATEMENT = 'ALTER TABLE ' || TABLE_NAME || ' ADD ID INTEGER NOT NULL DEFAULT 0';
        SET SEQ_STATEMENT = 'CREATE OR REPLACE SEQUENCE ' || SEQUENCE_NAME || ' START WITH 1 INCREMENT BY 1 NOCACHE';
        SET TRIG_STATEMENT = 'CREATE OR REPLACE TRIGGER ' || TRIGGER_NAME || ' NO CASCADE BEFORE INSERT ON ' || TABLE_NAME || ' REFERENCING NEW AS NEW FOR EACH ROW MODE DB2SQL BEGIN ATOMIC SET (NEW.ID) = (NEXTVAL FOR ' || SEQUENCE_NAME || '); END';
        SET REORG_STATEMENT = 'CALL SYSPROC.ADMIN_CMD(''REORG TABLE ' || TABLE_NAME || ''')';
        SET UPDATE_STATEMENT = 'UPDATE ' || TABLE_NAME || ' SET ID = ' || SEQUENCE_NAME || '.NEXTVAL';
        SET PK_STATEMENT = 'ALTER TABLE ' || TABLE_NAME || ' ADD PRIMARY KEY (ID)';

        EXECUTE IMMEDIATE ADD_COLUMN_STATEMENT;
        EXECUTE IMMEDIATE SEQ_STATEMENT;
        EXECUTE IMMEDIATE TRIG_STATEMENT;
        EXECUTE IMMEDIATE REORG_STATEMENT;
        EXECUTE IMMEDIATE UPDATE_STATEMENT;
        EXECUTE IMMEDIATE PK_STATEMENT;
    END IF;
END
/

CALL ADD_PRIMARY_KEY_COLUMN('IDN_OAUTH2_ACCESS_TOKEN_AUDIT')
/

CALL ADD_PRIMARY_KEY_COLUMN('IDN_OAUTH2_SCOPE_BINDING')
/

CALL ADD_PRIMARY_KEY_COLUMN('IDN_AUTH_USER_SESSION_MAPPING')
/

CALL ADD_PRIMARY_KEY_COLUMN('IDN_OAUTH2_CIBA_REQUEST_SCOPES')
/

-- Add the column if it doesn't exist
CREATE OR REPLACE PROCEDURE ALTER_IDN_OAUTH2_ACCESS_TOKEN
BEGIN ATOMIC
    IF EXISTS(SELECT * FROM SYSCAT.TABLES WHERE TABNAME='IDN_OAUTH2_ACCESS_TOKEN')
    THEN
        IF NOT EXISTS(SELECT * FROM SYSCAT.COLUMNS WHERE TABNAME='IDN_OAUTH2_ACCESS_TOKEN' AND COLNAME='CONSENTED_TOKEN')
        THEN
            EXECUTE IMMEDIATE 'ALTER TABLE IDN_OAUTH2_ACCESS_TOKEN ADD COLUMN CONSENTED_TOKEN VARCHAR(6)';
        END IF;
    END IF;
END
/

CALL ALTER_IDN_OAUTH2_ACCESS_TOKEN
/

DROP PROCEDURE ALTER_IDN_OAUTH2_ACCESS_TOKEN
/

CALL SYSPROC.ADMIN_CMD('REORG TABLE IDN_OAUTH2_ACCESS_TOKEN')
/

CREATE OR REPLACE PROCEDURE ALTER_IDN_FED_AUTH_SESSION_MAPPING_PRIMARY_KEY
BEGIN ATOMIC
    IF EXISTS(SELECT * FROM SYSCAT.TABLES WHERE TABNAME='IDN_FED_AUTH_SESSION_MAPPING')
    THEN
        IF NOT EXISTS(SELECT * FROM SYSCAT.COLUMNS WHERE TABNAME='IDN_FED_AUTH_SESSION_MAPPING' AND COLNAME='ID')
        THEN
            EXECUTE IMMEDIATE 'ALTER TABLE IDN_FED_AUTH_SESSION_MAPPING DROP PRIMARY KEY';
        END IF;
    END IF;
END
/

CALL ALTER_IDN_FED_AUTH_SESSION_MAPPING_PRIMARY_KEY
/

DROP PROCEDURE ALTER_IDN_FED_AUTH_SESSION_MAPPING_PRIMARY_KEY
/

CALL ADD_PRIMARY_KEY_COLUMN('IDN_FED_AUTH_SESSION_MAPPING')
/

CREATE OR REPLACE PROCEDURE ALTER_IDN_FED_AUTH_SESSION_MAPPING
BEGIN ATOMIC
    IF EXISTS(SELECT * FROM SYSCAT.TABLES WHERE TABNAME='IDN_FED_AUTH_SESSION_MAPPING')
    THEN
        IF NOT EXISTS(SELECT * FROM SYSCAT.COLUMNS WHERE TABNAME='IDN_FED_AUTH_SESSION_MAPPING' AND COLNAME='TENANT_ID')
        THEN
            EXECUTE IMMEDIATE 'ALTER TABLE IDN_FED_AUTH_SESSION_MAPPING ADD COLUMN TENANT_ID INTEGER NOT NULL DEFAULT 0';
            EXECUTE IMMEDIATE 'ALTER TABLE IDN_FED_AUTH_SESSION_MAPPING ADD UNIQUE (IDP_SESSION_ID, TENANT_ID)';
        END IF;
    END IF;
END
/

CALL ALTER_IDN_FED_AUTH_SESSION_MAPPING
/

DROP PROCEDURE ALTER_IDN_FED_AUTH_SESSION_MAPPING
/

DROP PROCEDURE ADD_PRIMARY_KEY_COLUMN
/
