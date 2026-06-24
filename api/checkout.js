export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { reg, userId } = req.body || {};
  if (!reg) return res.status(400).json({ error: 'No reg' });

  const BASE = 'https://www.garageiq.org.uk';
  const key = process.env.STRIPE_SECRET_KEY;
  const auth = 'Basic ' + Buffer.from(key + ':').toString('base64');

  const params = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][product_data][name]': `GarageIQ Full Report — ${reg}`,
    'line_items[0][price_data][product_data][description]': 'Full vehicle intelligence report including AI risk assessment',
    'line_items[0][price_data][unit_amount]': '199',
    'line_items[0][quantity]': '1',
    'success_url': `${BASE}/?reg=${encodeURIComponent(reg)}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
    'cancel_url': `${BASE}/`,
    'metadata[reg]': reg,
    'metadata[userId]': userId || '',
    'payment_intent_data[metadata][reg]': reg,
  });

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!r.ok) {
      const err = await r.json();
      return res.status(r.status).json({ error: err.error?.message || 'Stripe error' });
    }

    const session = await r.json();
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
