import Stripe from 'stripe';

// ─────────────────────────────────────────────
// GarageIQ — Stripe Checkout
// Product:  GarageIQ Intelligence Report
// Price ID: price_1TfluUA6aj9BlQ93zi75aK8q (£1.99 GBP one-time, live)
// Account:  acct_1Tb1X5A6aj9BlQ93
// ─────────────────────────────────────────────

const PRICE_ID   = 'price_1TfluUA6aj9BlQ93zi75aK8q';
const PRODUCT_ID = 'prod_Uf66Q3PhMUn5v6';
const APP_URL    = process.env.APP_URL || 'https://garage-iq-chi.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET) return res.status(500).json({ error: 'Stripe not configured' });

  const { reg, userId } = req.body;
  if (!reg) return res.status(400).json({ error: 'reg is required' });

  const cleanReg = reg.toUpperCase().replace(/\s/g, '');

  try {
    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2023-10-16' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        reg:    cleanReg,
        userId: userId || '',
      },
      success_url: `${APP_URL}?reg=${cleanReg}&session_id={CHECKOUT_SESSION_ID}&paid=1`,
      cancel_url:  `${APP_URL}?reg=${cleanReg}&cancelled=1`,
      payment_intent_data: {
        metadata: {
          reg:       cleanReg,
          userId:    userId || '',
          productId: PRODUCT_ID,
        },
        description: `GarageIQ Intelligence Report — ${cleanReg}`,
      },
      custom_text: {
        submit: {
          message: `Unlocking Intelligence Report for ${cleanReg}. One-time payment — no subscription.`,
        },
      },
      // Pre-fill if we have user data
      ...(userId ? { client_reference_id: userId } : {}),
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
