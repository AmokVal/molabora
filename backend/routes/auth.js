const express = require('express');
require('dotenv').config();
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');

const SECRET = process.env.JWT_SECRET || 'molabora_secret_jwt_2024';
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '8h';
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_6Jn31cs6_GddDJjDb1zCnYjsjzV7tAJiK';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
// Usar onboarding@resend.dev hasta que molabora.com esté verificado en Resend
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

const resend = new Resend(RESEND_API_KEY);

async function enviarEmailVerificacion(email, nombre, token) {
  const url = `${FRONTEND_URL}/verify-email?token=${token}`;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verifica tu email en MoLabora',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:'Segoe UI',sans-serif;background:#f9f9f9;margin:0;padding:0;">
          <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:#4A3B6B;padding:32px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:2rem;letter-spacing:-1px;">
                m<span style="color:#FF9933;">◉</span>labora
              </h1>
            </div>
            <!-- Body -->
            <div style="padding:36px 40px;">
              <h2 style="color:#333;margin-top:0;">¡Hola, ${nombre}!</h2>
              <p style="color:#555;line-height:1.6;">Gracias por registrarte en <strong>MoLabora</strong>. Para activar tu cuenta y poder crear contratos, necesitas verificar tu dirección de email.</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${url}" style="background:#FF9933;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">✓ Verificar mi email</a>
              </div>
              <p style="color:#888;font-size:0.85rem;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p style="color:#FF9933;font-size:0.82rem;word-break:break-all;">${url}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
              <p style="color:#aaa;font-size:0.8rem;margin:0;">Este enlace caduca en 24 horas. Si no creaste esta cuenta, ignora este email.</p>
            </div>
            <!-- Footer -->
            <div style="background:#f5f5f5;padding:16px;text-align:center;">
              <p style="color:#aaa;font-size:0.8rem;margin:0;">© 2024 MoLabora</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log('✓ Email de verificación enviado a:', email);
  } catch (err) {
    console.error('Error enviando email:', err.message);
  }
}

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
  const verificationToken = crypto.randomBytes(32).toString('hex');

  try {
    const checkEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email ya existe' });
    }

        const result = await pool.query(
      'INSERT INTO users (name, email, password, role, email_verified, verification_token) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role',
      [name, email, hashedPassword, roleValue, true, verificationToken]
    );

    // EMAIL VERIFICACIÓN DESHABILITADO TEMPORALMENTE
    // (dominio molabora.com pendiente de verificar en Resend)
    // Reactivar cuando el dominio esté verificado:
    // await enviarEmailVerificacion(email, name, verificationToken);

    res.json({
      message: 'Usuario registrado correctamente.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error en registro:', err.message);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// VERIFICAR EMAIL por token
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token no proporcionado' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, name, email, email_verified',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o ya utilizado' });
    }

    res.json({
      message: '¡Email verificado correctamente! Ya puedes crear contratos.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error verificando email:', err);
    res.status(500).json({ error: 'Error al verificar email' });
  }
});

// REENVIAR email de verificación
router.post('/resend-verification', verifyToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, email_verified FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Tu email ya está verificado' });
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [newToken, req.user.id]
    );

    await enviarEmailVerificacion(user.email, user.name, newToken);

    res.json({ message: 'Email de verificación reenviado correctamente' });
  } catch (err) {
    console.error('Error reenviando verificación:', err);
    res.status(500).json({ error: 'Error al reenviar email' });
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