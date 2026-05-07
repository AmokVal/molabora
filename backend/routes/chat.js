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

router.get('/:otherId', verifyToken, async (req, res) => {
  const otherId = parseInt(req.params.otherId, 10);
  const userId = req.user.id;

  if (isNaN(otherId)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const result = await pool.query(
      `SELECT id, sender_id, receiver_id, message, created_at
       FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, otherId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar mensajes' });
  }
});

router.post('/:otherId', verifyToken, async (req, res) => {
  const otherId = parseInt(req.params.otherId, 10);
  const userId = req.user.id;
  const { message } = req.body;

  if (isNaN(otherId) || !message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Datos del mensaje inválidos' });
  }

  if (userId === otherId) {
    return res.status(400).json({ error: 'No puedes enviar un mensaje a ti mismo' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING id, sender_id, receiver_id, message, created_at',
      [userId, otherId, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

module.exports = router;
