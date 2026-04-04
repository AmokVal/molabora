const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT id, name, email FROM users');
  res.json(result.rows);
});

module.exports = router;