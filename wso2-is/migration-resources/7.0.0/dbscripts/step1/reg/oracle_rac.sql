DECLARE
  is_index_exists NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO is_index_exists FROM (
    SELECT INDEX_NAME FROM USER_INDEXES WHERE TABLE_NAME = 'REG_RESOURCE_PROPERTY' AND INDEX_NAME IN (
      SELECT INDEX_NAME FROM USER_IND_COLUMNS WHERE TABLE_NAME = 'REG_RESOURCE_PROPERTY'
        AND COLUMN_NAME = 'REG_TENANT_ID' AND COLUMN_POSITION = 1
      INTERSECT
      SELECT INDEX_NAME FROM USER_IND_COLUMNS WHERE TABLE_NAME = 'REG_RESOURCE_PROPERTY'
        AND COLUMN_NAME = 'REG_PROPERTY_ID' AND COLUMN_POSITION = 2
    )
  );
  IF is_index_exists = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX REG_RESC_PROP_BY_PROP_ID_TI ON REG_RESOURCE_PROPERTY (REG_TENANT_ID, REG_PROPERTY_ID)';
  END IF;
END;
/
