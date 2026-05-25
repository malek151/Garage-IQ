// api/verify-payment.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) return res.status(500).json({ error: 'Stripe not configured' });

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + sessionId, {
      headers: { 'Authorization': 'Bearer ' + STRIPE_KEY },
    });
    const session = await r.json();
    if (!r.ok) return res.status(400).json({ error: session.error?.message || 'Stripe error' });

    const paid = session.payment_status === 'paid';
    const reg  = session.metadata?.reg || '';
    const uid  = session.metadata?.user_id || '';

    // Store in Supabase if paid
    if (paid && reg) {
      const SUPA_URL = process.env.SUPABASE_URL || 'https://hbfntnxawwavttzvxdde.supabase.co';
      const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
      if (SUPA_KEY) {
        await fetch(SUPA_URL + '/rest/v1/paid_reports', {
          method: 'POST',
          headers: {
            'apikey': SUPA_KEY,
            'Authorization': 'Bearer ' + SUPA_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates',
          },
          body: JSON.stringify({
            session_id: sessionId,
            reg: reg,
            user_id: uid || null,
            amount_pence: session.amount_total || 199,
          }),
        });
      }
    }

    return res.status(200).json({ paid, reg, sessionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
