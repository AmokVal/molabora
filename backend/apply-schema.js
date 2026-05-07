const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'molabora',
  password: 'Q96sqG9?',
  port: 2000,
});

const sql = fs.readFileSync('../molabora.sql', 'utf8');

pool.query(sql, (err, res) => {
  if (err) {
    console.error('Error aplicando esquema:', err);
  } else {
    console.log('Esquema aplicado correctamente');
  }
  pool.end();
});