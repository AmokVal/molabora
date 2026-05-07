const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'molabora',
  password: 'Q96sqG9?',
  port: 2000,
});

async function recreateSchema() {
  try {
    // Dropear tablas si existen
    await pool.query('DROP TABLE IF EXISTS messages CASCADE;');
    console.log('Tabla messages eliminada');
    
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    console.log('Tabla users eliminada');

    // Recrear tabla users
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'normal',
        studies TEXT,
        experience TEXT,
        schedule TEXT,
        rates TEXT
      );
    `);
    console.log('Tabla users creada');

    // Recrear tabla messages
    await pool.query(`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Tabla messages creada');

    console.log('Esquema recreado correctamente');
  } catch (err) {
    console.error('Error recreando esquema:', err);
  } finally {
    pool.end();
  }
}

recreateSchema();