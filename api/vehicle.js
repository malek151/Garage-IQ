export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const reg = (body.registrationNumber || req.query.reg || '').replace(/\s/g, '').toUpperCase();
  if (!reg) return res.status(400).json({ error: 'No registration provided' });

  try {
    const r = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.DVLA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationNumber: reg }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt || 'DVLA error' });
    }

    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
