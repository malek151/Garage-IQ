export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'No sessionId' });

  const key = process.env.STRIPE_SECRET_KEY;
  const auth = 'Basic ' + Buffer.from(key + ':').toString('base64');

  try {
    // Retrieve the Stripe checkout session
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: auth },
    });

    if (!r.ok) {
      const err = await r.json();
      return res.status(r.status).json({ paid: false, error: err.error?.message });
    }

    const session = await r.json();
    const paid = session.payment_status === 'paid';

    if (paid) {
      const reg = session.metadata?.reg || '';
      const userId = session.metadata?.userId || null;

      // Record in Supabase paid_reports (use service role key to bypass RLS)
      const SUPA_URL = 'https://hbfntnxawwavttzvxdde.supabase.co';
      const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (SUPA_KEY && reg) {
        await fetch(`${SUPA_URL}/rest/v1/paid_reports`, {
          method: 'POST',
          headers: {
            apikey: SUPA_KEY,
            Authorization: `Bearer ${SUPA_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=ignore-duplicates',
          },
          body: JSON.stringify({
            session_id: sessionId,
            reg: reg.toUpperCase(),
            user_id: userId || null,
            amount_pence: 199,
          }),
        }).catch(() => {}); // non-blocking — don't fail payment verify if DB write fails
      }
    }

    return res.status(200).json({ paid });
  } catch (err) {
    return res.status(500).json({ paid: false, error: err.message });
  }
}
