const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'secreto';

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

// Middleware para verificar que es administrador
function verifyAdmin(req, res, next) {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Solo administradores pueden acceder a esta ruta' });
  }
  next();
}

// Obtener todos los usuarios (solo admin)
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, is_premium, is_banned, ban_reason, email_verified, created_at FROM users ORDER BY is_premium DESC, name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Cambiar rol de usuario
router.patch('/users/:userId/role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['normal', 'administrador'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // No permitir que se eliminen a todos los admins
    if (role !== 'administrador') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['administrador']
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Debe haber al menos un administrador' });
      }
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: `Rol actualizado a ${role}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

// Banear usuario
router.post('/users/:userId/ban', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Razón del baneo requerida' });
    }

    const result = await pool.query(
      'UPDATE users SET is_banned = true, ban_reason = $1 WHERE id = $2 RETURNING id, name, email, is_banned, ban_reason',
      [reason, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario baneado correctamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error baneando usuario:', error);
    res.status(500).json({ error: 'Error al banear usuario' });
  }
});

// Desbanear usuario
router.post('/users/:userId/unban', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'UPDATE users SET is_banned = false, ban_reason = NULL WHERE id = $2 RETURNING id, name, email, is_banned',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario desbaneado correctamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error desbaneando usuario:', error);
    res.status(500).json({ error: 'Error al desbanear usuario' });
  }
});

// Verificar manualmente el email de un usuario
router.post('/users/:userId/verify-email', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE id = $1 RETURNING id, name, email, email_verified',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Email verificado manualmente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ error: 'Error al verificar email' });
  }
});

// Obtener estadísticas
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_premium = true) as premium_users,
        (SELECT COUNT(*) FROM users WHERE is_banned = true) as banned_users,
        (SELECT COUNT(*) FROM users WHERE email_verified = false) as unverified_emails,
        (SELECT COUNT(*) FROM contracts WHERE status = 'active') as active_contracts,
        (SELECT COUNT(*) FROM contracts WHERE status = 'completed') as completed_contracts
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;