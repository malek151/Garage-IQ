async function getDvsaToken() {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.DVSA_CLIENT_ID,
    client_secret: process.env.DVSA_CLIENT_SECRET,
    scope: process.env.DVSA_SCOPE,
  });
  const r = await fetch(
    'https://login.microsoftonline.com/a455b827-244d-4b5a-9e25-604a4a3c5a4b/oauth2/v2.0/token',
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() }
  );
  if (!r.ok) throw new Error('DVSA token ' + r.status);
  const d = await r.json();
  return d.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const reg = (req.query.reg || '').replace(/\s/g, '').toUpperCase();
  if (!reg) return res.status(400).json({ error: 'No reg' });

  try {
    const token = await getDvsaToken();
    const r = await fetch(
      `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(reg)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': process.env.DVSA_API_KEY,
          Accept: 'application/json+v6',
        },
      }
    );
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt || 'DVSA error' });
    }
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
