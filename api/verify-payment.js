import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// GarageIQ — Payment Verification
// Stripe Account: acct_1Tb1X5A6aj9BlQ93
// Price:  price_1TfluUA6aj9BlQ93zi75aK8q (£1.99 GBP)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ paid: false, error: 'sessionId required' });

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  const SUPA_URL   = process.env.SUPABASE_URL;
  const SUPA_KEY   = process.env.SUPABASE_ANON_KEY;

  if (!STRIPE_KEY) return res.status(500).json({ paid: false, error: 'Stripe not configured' });

  try {
    const stripe  = new Stripe(STRIPE_KEY, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(200).json({ paid: false, error: 'Payment not completed' });
    }

    const reg    = (session.metadata?.reg    || '').toUpperCase();
    const userId = session.metadata?.userId  || null;
    const amount = session.amount_total      || 199;

    // Write to Supabase paid_reports table
    if (SUPA_URL && SUPA_KEY && reg) {
      try {
        const sb = createClient(SUPA_URL, SUPA_KEY);
        const { error } = await sb.from('paid_reports').upsert(
          [{
            session_id:   sessionId,
            reg:          reg,
            user_id:      userId,
            amount_pence: amount,
            created_at:   new Date().toISOString(),
          }],
          { onConflict: 'session_id', ignoreDuplicates: true }
        );
        if (error) console.warn('Supabase write warning:', error.message);
      } catch (dbErr) {
        console.warn('Supabase error (non-fatal):', dbErr.message);
      }
    }

    return res.status(200).json({ paid: true, reg, userId, amount });

  } catch (err) {
    console.error('Verify payment error:', err.message);
    return res.status(500).json({ paid: false, error: err.message });
  }
}
