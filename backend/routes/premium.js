const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Clave Stripe - reemplazar por variable de entorno en producción
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(STRIPE_KEY);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET no definido en variables de entorno");
}

const SECRET = process.env.JWT_SECRET;

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Obtener planes de suscripción
router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscription_plans ORDER BY price_cents ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({ error: 'Error al obtener planes' });
  }
});

// Crear sesión de pago Stripe con plan seleccionado
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Debes seleccionar un plan' });
    }

    // Obtener plan
    const planResult = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = $1',
      [planId]
    );
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }
    const plan = planResult.rows[0];

    // Obtener o crear customer de Stripe
    let stripeCustomer = await pool.query(
      'SELECT stripe_customer_id FROM stripe_customers WHERE user_id = $1',
      [userId]
    );

    let customerId;
    if (stripeCustomer.rows.length === 0) {
      const userResult = await pool.query(
        'SELECT email, name FROM users WHERE id = $1',
        [userId]
      );
      const customer = await stripe.customers.create({
        email: userResult.rows[0].email,
        name: userResult.rows[0].name
      });
      customerId = customer.id;
      await pool.query(
        'INSERT INTO stripe_customers (user_id, stripe_customer_id) VALUES ($1, $2)',
        [userId, customerId]
      );
    } else {
      customerId = stripeCustomer.rows[0].stripe_customer_id;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `MoLabora Premium - ${plan.name}`,
              description: plan.description
            },
            unit_amount: plan.price_cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/premium?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
      cancel_url: `${frontendUrl}/premium`
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago: ' + error.message });
  }
});

// Verificar pago y activar premium
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const { sessionId, planId } = req.body;
    const userId = req.user.id;

    if (!sessionId || !planId) {
      return res.status(400).json({ error: 'sessionId y planId son requeridos' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'El pago no ha sido completado' });
    }

    // Obtener plan
    const planResult = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = $1',
      [planId]
    );
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }
    const plan = planResult.rows[0];

    // Calcular fecha de expiración
    let premiumExpiresAt = null;
    if (!plan.is_permanent) {
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + parseInt(plan.duration_months));
      premiumExpiresAt = expDate;
    }

    const result = await pool.query(
      'UPDATE users SET is_premium = true, premium_expires_at = $1 WHERE id = $2 RETURNING id, name, email, is_premium, premium_expires_at',
      [premiumExpiresAt, userId]
    );

    res.json({
      message: `¡Felicidades! Ahora eres usuario Premium - ${plan.name}`,
      user: result.rows[0],
      plan: plan
    });
  } catch (error) {
    console.error('Error verificando pago:', error);
    res.status(500).json({ error: 'Error al verificar pago: ' + error.message });
  }
});

// Obtener estado de premium
router.get('/status', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, is_premium, premium_expires_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Verificar si el premium ha expirado
    if (user.is_premium && user.premium_expires_at && new Date(user.premium_expires_at) < new Date()) {
      await pool.query('UPDATE users SET is_premium = false WHERE id = $1', [req.user.id]);
      user.is_premium = false;
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo estado premium:', error);
    res.status(500).json({ error: 'Error al obtener estado de premium' });
  }
});

module.exports = router;