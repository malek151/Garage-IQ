// api/checkout.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { reg, userId } = req.body;
  if (!reg) return res.status(400).json({ error: 'reg required' });

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) return res.status(500).json({ error: 'Stripe not configured' });

  const base = 'https://garage-iq-chi.vercel.app';
  const regClean = reg.replace(/\s/g, '').toUpperCase();

  try {
    const body = new URLSearchParams({
      'payment_method_types[]':        'card',
      'line_items[0][price_data][currency]':             'gbp',
      'line_items[0][price_data][unit_amount]':          '199',
      'line_items[0][price_data][product_data][name]':   'GarageIQ Intelligence Report — ' + regClean,
      'line_items[0][price_data][product_data][description]': 'Full mileage fraud detection, risk score, MOT analysis & history for ' + regClean,
      'line_items[0][quantity]':        '1',
      'mode':                           'payment',
      'success_url':                    base + '/?reg=' + regClean + '&session_id={CHECKOUT_SESSION_ID}&paid=1',
      'cancel_url':                     base + '/?reg=' + regClean + '&paid=0',
      'metadata[reg]':                  regClean,
      'metadata[user_id]':              userId || '',
    });

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const session = await r.json();
    if (!r.ok) return res.status(400).json({ error: session.error?.message || 'Stripe error' });
    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
