-- Migration 008: código propio del proyecto Aire Escolar (ej. AE-01).
-- La fecha de alta usa la columna que ya existe: fecha_instalacion.
-- Ejecutar ANTES de desplegar el Worker que lee s.codigo.

ALTER TABLE sensores ADD COLUMN codigo TEXT;

-- Único, pero permite NULL en los sensores que todavía no tienen código.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sensores_codigo ON sensores (codigo);
