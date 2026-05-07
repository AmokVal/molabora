const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

// Crear sesión de pago Stripe
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener o crear customer de Stripe
    let stripeCustomer = await pool.query(
      'SELECT stripe_customer_id FROM stripe_customers WHERE user_id = $1',
      [userId]
    );

    let customerId;
    
    if (stripeCustomer.rows.length === 0) {
      // Crear nuevo customer en Stripe
      const userResult = await pool.query(
        'SELECT email, name FROM users WHERE id = $1',
        [userId]
      );

      const customer = await stripe.customers.create({
        email: userResult.rows[0].email,
        name: userResult.rows[0].name
      });

      customerId = customer.id;

      // Guardar en base de datos
      await pool.query(
        'INSERT INTO stripe_customers (user_id, stripe_customer_id) VALUES ($1, $2)',
        [userId, customerId]
      );
    } else {
      customerId = stripeCustomer.rows[0].stripe_customer_id;
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'MoLabora Premium - Membresía Anual',
              description: 'Acceso premium a MoLabora por 1 año'
            },
            unit_amount: 4999 // 49.99€
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/premium-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/home`
    });

    res.json({ sessionId: session.id, clientSecret: session.client_secret });
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
});

// Verificar pago y activar premium
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    // Obtener sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Actualizar usuario a premium
      const result = await pool.query(
        'UPDATE users SET is_premium = true WHERE id = $1 RETURNING id, name, email, is_premium',
        [userId]
      );

      res.json({
        message: 'Pago verificado. ¡Ahora eres usuario premium!',
        user: result.rows[0]
      });
    } else {
      res.status(400).json({ error: 'El pago no ha sido completado' });
    }
  } catch (error) {
    console.error('Error verificando pago:', error);
    res.status(500).json({ error: 'Error al verificar pago' });
  }
});

// Obtener estado de premium
router.get('/status', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, is_premium FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado de premium' });
  }
});

module.exports = router;