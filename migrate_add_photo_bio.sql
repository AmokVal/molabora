-- Script para agregar las columnas photo y bio a la tabla users
-- Ejecuta este script en tu base de datos PostgreSQL

ALTER TABLE users ADD COLUMN IF NOT EXISTS photo BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Verifica que las columnas se han agregado correctamente
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;
