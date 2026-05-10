const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'secreto';
const VALID_ROLES = ['normal', 'administrador'];

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

router.get('/', verifyToken, async (req, res) => {
  console.log('GET /users called, current user id:', req.user.id);
  try {
    const result = await pool.query(
      'SELECT id, name, role, studies, experience, schedule, rates, bio, photo, is_premium FROM users WHERE is_banned = false AND id != $1 ORDER BY is_premium DESC, name ASC',
      [req.user.id]
    );
    
    const users = result.rows.map(user => {
      if (user.photo) {
        user.photo = `data:image/png;base64,${user.photo.toString('base64')}`;
      }
      return user;
    });
    
    console.log('GET /users - Returning', users.length, 'users');
    res.json(users);
  } catch (err) {
    console.error('Error en GET /users:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.get('/search', verifyToken, async (req, res) => {
  try {
    const { nombre, especializacion, presupuestoMin, presupuestoMax, ordenar } = req.query;
    let query = 'SELECT id, name, role, studies, experience, schedule, rates, bio, photo, is_premium FROM users WHERE is_banned = false';
    const params = [];
    let paramCount = 1;

    if (nombre) {
      query += ` AND (LOWER(name) LIKE LOWER($${paramCount}) OR LOWER(studies) LIKE LOWER($${paramCount}) OR LOWER(bio) LIKE LOWER($${paramCount}))`;
      params.push(`%${nombre}%`);
      paramCount++;
    }

    if (especializacion) {
      query += ` AND (LOWER(studies) LIKE LOWER($${paramCount}) OR LOWER(experience) LIKE LOWER($${paramCount}) OR LOWER(bio) LIKE LOWER($${paramCount}))`;
      params.push(`%${especializacion}%`);
      paramCount++;
    }

    if (presupuestoMin) {
      query += ` AND CAST(rates AS FLOAT) >= $${paramCount}`;
      params.push(parseFloat(presupuestoMin));
      paramCount++;
    }

    if (presupuestoMax) {
      query += ` AND CAST(rates AS FLOAT) <= $${paramCount}`;
      params.push(parseFloat(presupuestoMax));
      paramCount++;
    }

    if (ordenar === 'precio_bajo') {
      query += ' ORDER BY CAST(rates AS FLOAT) ASC, is_premium DESC';
    } else if (ordenar === 'precio_alto') {
      query += ' ORDER BY CAST(rates AS FLOAT) DESC, is_premium DESC';
    } else {
      query += ' ORDER BY is_premium DESC, name ASC';
    }

    const result = await pool.query(query, params);

    const users = result.rows.map(user => {
      if (user.photo) {
        user.photo = `data:image/png;base64,${user.photo.toString('base64')}`;
      }
      return user;
    });

    res.json(users);
  } catch (err) {
    console.error('Error en búsqueda:', err);
    res.status(500).json({ error: 'Error al buscar usuarios' });
  }
});

router.get('/all', verifyToken, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: solo administradores' });
  }

  const result = await pool.query(
    'SELECT id, name, email, role, studies, experience, schedule, rates FROM users'
  );
  res.json(result.rows);
});

router.patch('/:id/role', verifyToken, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: solo administradores' });
  }

  const { role } = req.body;
  const { id } = req.params;

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

module.exports = router;