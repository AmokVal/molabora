const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'molabora_secret_jwt_2024';

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

// Crear nuevo contrato
router.post('/', verifyToken, async (req, res) => {
  try {
    const { professional_id, description } = req.body;
    const client_id = req.user.id;

    if (!professional_id || !description) {
      return res.status(400).json({ error: 'Datos obligatorios faltantes' });
    }

    // Verificar que no hay contrato activo entre estos usuarios
    const existingContract = await pool.query(
      'SELECT id FROM contracts WHERE client_id = $1 AND professional_id = $2 AND status = $3',
      [client_id, professional_id, 'active']
    );

    if (existingContract.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un contrato activo con este usuario' });
    }

    const result = await pool.query(
      'INSERT INTO contracts (client_id, professional_id, status, description) VALUES ($1, $2, $3, $4) RETURNING id, client_id, professional_id, status, start_date, description',
      [client_id, professional_id, 'active', description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando contrato:', error);
    res.status(500).json({ error: 'Error al crear contrato' });
  }
});

// Obtener contratos activos y pasados del usuario
router.get('/my-contracts', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // 'active', 'completed', 'cancelled'

    let query = `
      SELECT 
        c.id, c.client_id, c.professional_id, c.status, 
        c.start_date, c.end_date, c.description,
        client.name as client_name, client.email as client_email,
        prof.name as professional_name, prof.email as professional_email
      FROM contracts c
      JOIN users client ON c.client_id = client.id
      JOIN users prof ON c.professional_id = prof.id
      WHERE c.client_id = $1 OR c.professional_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ` AND c.status = $2`;
      params.push(status);
    }

    query += ' ORDER BY c.start_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo contratos:', error);
    res.status(500).json({ error: 'Error al obtener contratos' });
  }
});

// Obtener contrato específico
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        c.id, c.client_id, c.professional_id, c.status, 
        c.start_date, c.end_date, c.description,
        client.name as client_name, client.email as client_email,
        prof.name as professional_name, prof.email as professional_email
      FROM contracts c
      JOIN users client ON c.client_id = client.id
      JOIN users prof ON c.professional_id = prof.id
      WHERE c.id = $1 AND (c.client_id = $2 OR c.professional_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contrato' });
  }
});

// Actualizar estado del contrato
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Verificar que el usuario es cliente o profesional del contrato
    const contract = await pool.query(
      'SELECT client_id, professional_id FROM contracts WHERE id = $1',
      [id]
    );

    if (contract.rows.length === 0) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const { client_id, professional_id } = contract.rows[0];
    if (userId !== client_id && userId !== professional_id) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar este contrato' });
    }

    const endDate = status !== 'active' ? new Date() : null;

    const result = await pool.query(
      'UPDATE contracts SET status = $1, end_date = $2, updated_at = NOW() WHERE id = $3 RETURNING id, client_id, professional_id, status, start_date, end_date, description',
      [status, endDate, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando contrato:', error);
    res.status(500).json({ error: 'Error al actualizar contrato' });
  }
});

module.exports = router;