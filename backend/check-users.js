const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'molabora',
  password: 'Q96sqG9?',
  port: 2000,
});

pool.query('SELECT id, name, email, role FROM users;', (err, res) => {
  if (err) {
    console.error('Error consultando usuarios:', err);
  } else {
    console.log('Usuarios en la base de datos:');
    console.table(res.rows);
  }
  pool.end();
});