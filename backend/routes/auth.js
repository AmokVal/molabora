const express = require('express');
require('dotenv').config();
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'secreto';
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '8h';
const VALID_ROLES = ['normal', 'administrador'];

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('verifyToken called - authHeader:', authHeader ? 'present' : 'missing');

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// REGISTRO
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const roleValue = 'normal';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido. Debe tener formato: usuario@dominio.terminacion' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const checkEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email ya existe' });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, email_verified) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role',
      [name, email, hashedPassword, roleValue, true]
    );

    res.json({
      message: 'Usuario registrado correctamente',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error en registro:', err.message);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});



// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const userResult = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    return res.status(400).json({ error: 'Usuario no encontrado' });
  }

  const user = userResult.rows[0];

  if (user.is_banned) {
    return res.status(403).json({ error: `Tu cuenta ha sido baneada. Razón: ${user.ban_reason || 'No especificada'}` });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json({ error: 'Contraseña incorrecta' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email, isPremium: user.is_premium },
    SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.is_premium
    }
  });
});

router.get('/me', verifyToken, async (req, res) => {
  console.log('GET /me called, user id:', req.user.id);
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, studies, experience, schedule, rates, bio, photo, email_verified, is_premium FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      console.log('ERROR: Usuario no encontrado con id:', req.user.id);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    // Convertir foto a base64 para la respuesta si existe
    if (user.photo) {
      user.photo = `data:image/png;base64,${user.photo.toString('base64')}`;
    }
    
    // Asegurarse de que bio existe (null si no existe la columna)
    if (!user.bio) {
      user.bio = null;
    }

    console.log('✓ GET /me - Returning user:', user.id, user.name);
    res.json(user);
  } catch (err) {
    console.error('ERROR en GET /me:', err.message);
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil: ' + err.message });
  }
});

router.post('/verify-email-manual', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET email_verified = true WHERE id = $1 RETURNING id, name, email, email_verified',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Email verificado correctamente',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error al verificar email:', err);
    res.status(500).json({ error: 'Error al verificar email' });
  }
});

router.put('/me', verifyToken, async (req, res) => {
  const { studies, experience, schedule, rates, bio, photo } = req.body;

  try {
    // Convertir foto base64 a Buffer si existe y no es muy grande
    let photoBuffer = null;
    if (photo && photo.length < 5000000) { // Máximo 5MB
      try {
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
        photoBuffer = Buffer.from(base64Data, 'base64');
      } catch (err) {
        console.warn('Error procesando foto:', err.message);
      }
    }

    // Construir query dinámicamente para actualizar solo la foto si es válida
    let query, params;
    if (photoBuffer) {
      query = 'UPDATE users SET studies = $1, experience = $2, schedule = $3, rates = $4, bio = $5, photo = $6 WHERE id = $7 RETURNING id, name, email, role, studies, experience, schedule, rates, bio, photo, email_verified, is_premium';
      params = [studies || '', experience || '', schedule || '', rates || '', bio || '', photoBuffer, req.user.id];
    } else {
      query = 'UPDATE users SET studies = $1, experience = $2, schedule = $3, rates = $4, bio = $5 WHERE id = $6 RETURNING id, name, email, role, studies, experience, schedule, rates, bio, photo, email_verified, is_premium';
      params = [studies || '', experience || '', schedule || '', rates || '', bio || '', req.user.id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    // Convertir foto a base64 para la respuesta si existe
    if (user.photo) {
      user.photo = `data:image/png;base64,${user.photo.toString('base64')}`;
    }

    console.log('PUT /me - Usuario actualizado:', user.id);
    res.json(user);
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil: ' + err.message });
  }
});

module.exports = router;

module.exports = router;