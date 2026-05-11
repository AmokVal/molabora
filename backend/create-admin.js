const pool = require('./db');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    const hash = await bcrypt.hash('root', 10);
    
    const check = await pool.query('SELECT id FROM users WHERE email = $1', ['root@molabora.net']);
    
    if (check.rows.length > 0) {
      const result = await pool.query(
        'UPDATE users SET name = $1, password = $2, role = $3, email_verified = true, is_banned = false WHERE email = $4 RETURNING id, name, email, role',
        ['Admin Root', hash, 'administrador', 'root@molabora.net']
      );
      console.log('✓ Admin actualizado:', result.rows[0]);
    } else {
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING id, name, email, role',
        ['Admin Root', 'root@molabora.net', hash, 'administrador']
      );
      console.log('✓ Admin creado:', result.rows[0]);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdmin();