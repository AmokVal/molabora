const pool = require('./db');

async function initializeDatabase() {
  try {
    console.log('Inicializando base de datos...');
    
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creando tabla users...');
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'normal',
          studies TEXT,
          experience TEXT,
          schedule TEXT,
          rates TEXT,
          bio TEXT,
          photo BYTEA,
          is_premium BOOLEAN DEFAULT false,
          email_verified BOOLEAN DEFAULT true,
          verification_token VARCHAR(255),
          is_banned BOOLEAN DEFAULT false,
          ban_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Tabla users creada');
    } else {
      console.log('✓ Tabla users ya existe');
      
      const columnsToAdd = [
        { name: 'email_verified', type: 'BOOLEAN DEFAULT true' },
        { name: 'is_premium', type: 'BOOLEAN DEFAULT false' },
        { name: 'is_banned', type: 'BOOLEAN DEFAULT false' },
        { name: 'ban_reason', type: 'TEXT' },
        { name: 'bio', type: 'TEXT' },
        { name: 'photo', type: 'BYTEA' },
        { name: 'tarifa_por_hora', type: 'DECIMAL(10,2)' },
        { name: 'tarifa_minima', type: 'DECIMAL(10,2)' }
      ];
      
      for (const col of columnsToAdd) {
        const check = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='${col.name}'`
        );
        if (check.rows.length === 0) {
          console.log(`Agregando columna ${col.name}...`);
          await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
          console.log(`✓ Columna ${col.name} agregada`);
        }
      }
    }
    
    const messagesCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages')"
    );
    
    if (!messagesCheck.rows[0].exists) {
      console.log('Creando tabla messages...');
      await pool.query(`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES users(id),
          receiver_id INTEGER NOT NULL REFERENCES users(id),
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Tabla messages creada');
    }
    
    const contractsCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contracts')"
    );
    
    if (!contractsCheck.rows[0].exists) {
      console.log('Creando tabla contracts...');
      await pool.query(`
        CREATE TABLE contracts (
          id SERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL REFERENCES users(id),
          professional_id INTEGER NOT NULL REFERENCES users(id),
          status VARCHAR(50) DEFAULT 'active',
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Tabla contracts creada');
    }
    
    const stripe_customersCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stripe_customers')"
    );
    
    if (!stripe_customersCheck.rows[0].exists) {
      console.log('Creando tabla stripe_customers...');
      await pool.query(`
        CREATE TABLE stripe_customers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
          stripe_customer_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Tabla stripe_customers creada');
    }

    // Añadir columna verification_token si no existe
    const verTokenCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='verification_token'`
    );
    if (verTokenCheck.rows.length === 0) {
      await pool.query(`ALTER TABLE users ADD COLUMN verification_token VARCHAR(255)`);
      console.log('✓ Columna verification_token agregada');
    }

    // Añadir columna premium_expires_at si no existe
    const premiumExpiresCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='premium_expires_at'`
    );
    if (premiumExpiresCheck.rows.length === 0) {
      console.log('Agregando columna premium_expires_at...');
      await pool.query(`ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMP`);
      console.log('✓ Columna premium_expires_at agregada');
    }

    // Crear tabla subscription_plans si no existe
    const plansCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscription_plans')"
    );
    if (!plansCheck.rows[0].exists) {
      console.log('Creando tabla subscription_plans...');
      await pool.query(`
        CREATE TABLE subscription_plans (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          duration_months INTEGER,
          is_permanent BOOLEAN DEFAULT false,
          price_cents INTEGER NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Insertar planes por defecto
      await pool.query(`
        INSERT INTO subscription_plans (name, duration_months, is_permanent, price_cents, description) VALUES
        ('1 Mes',    1,    false, 299,  'Premium durante 1 mes'),
        ('3 Meses',  3,    false, 699,  'Premium durante 3 meses'),
        ('9 Meses',  9,    false, 1099, 'Premium durante 9 meses'),
        ('Permanente', NULL, true, 1800, 'Premium de por vida')
      `);
      console.log('✓ Tabla subscription_plans creada con planes por defecto');
    }
    
    console.log('✓ Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error inicializando base de datos:', err);
  }
}

module.exports = initializeDatabase;