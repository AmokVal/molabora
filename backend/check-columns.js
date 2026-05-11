const pool = require('./db');

async function checkColumns() {
  try {
    const result = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
    );
    console.log('Columnas en tabla users:');
    result.rows.forEach(row => console.log(' -', row.column_name));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkColumns();