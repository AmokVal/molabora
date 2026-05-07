const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'molabora',
  password: 'Q96sqG9?',
  port: 2000,
});

async function updateSchema() {
  try {
    // Agregar columnas faltantes a users
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS studies TEXT,
      ADD COLUMN IF NOT EXISTS experience TEXT,
      ADD COLUMN IF NOT EXISTS schedule TEXT,
      ADD COLUMN IF NOT EXISTS rates TEXT;
    `);
    console.log('Columnas agregadas a users');

    // Crear tabla messages si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Tabla messages creada');

    console.log('Esquema actualizado correctamente');
  } catch (err) {
    console.error('Error actualizando esquema:', err);
  } finally {
    pool.end();
  }
}

updateSchema();