-- AQ-02: aplicar solo con autorización, respaldo y revisión de duplicados.
-- No fusiona identidades, no modifica IDs ni lecturas. Si hay seriales
-- duplicados, CREATE UNIQUE INDEX falla y exige reconciliación humana.
CREATE UNIQUE INDEX idx_sensores_airgradient_serial
ON sensores(serial_externo)
WHERE proveedor = 'airgradient' AND serial_externo IS NOT NULL;

-- Impide que un INSERT/UPSERT de otro proveedor reutilice un ID ocupado.
-- También protege el camino Python, que usa DEFAULT purpleair.
CREATE TRIGGER sensores_proveedor_insert_guard
BEFORE INSERT ON sensores
WHEN EXISTS (SELECT 1 FROM sensores s WHERE s.sensor_index = NEW.sensor_index
             AND (s.proveedor <> NEW.proveedor OR (s.proveedor = 'airgradient'
             AND s.serial_externo IS NOT NEW.serial_externo)))
BEGIN
  SELECT RAISE(ABORT, 'AQ-02: ID ocupado por otro proveedor');
END;

-- Una identidad registrada es inmutable; su reparación exige un plan separado.
CREATE TRIGGER sensores_identidad_update_guard
BEFORE UPDATE OF proveedor, serial_externo, sensor_index ON sensores
WHEN OLD.proveedor <> NEW.proveedor OR OLD.sensor_index <> NEW.sensor_index
  OR (OLD.proveedor = 'airgradient' AND OLD.serial_externo IS NOT NEW.serial_externo)
BEGIN
  SELECT RAISE(ABORT, 'AQ-02: identidad registrada inmutable');
END;
