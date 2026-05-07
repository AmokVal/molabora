const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'molabora',
  password: 'Q96sqG9?',
  port: 2000,
});

pool.query('DELETE FROM messages; DELETE FROM users;', (err) => {
  if (err) {
    console.error('Error limpiando base de datos:', err);
  } else {
    console.log('Base de datos limpiada correctamente');
  }
  pool.end();
});