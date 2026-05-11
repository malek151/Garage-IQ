export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { reg } = req.query;
  if (!reg) return res.status(400).json({ error: 'Registration number required' });

  try {
    // Step 1 — get OAuth2 token
    const tokenRes = await fetch('https://login.microsoftonline.com/a077c245-f9ce-4f9d-8a2a-6e0f1f6dc2e6/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.DVSA_CLIENT_ID,
        client_secret: process.env.DVSA_CLIENT_SECRET,
        scope: process.env.DVSA_SCOPE || 'https://tapi.dvsa.gov.uk/.default',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'Failed to get DVSA token', detail: tokenData });
    }

    // Step 2 — call MOT history API
    const motRes = await fetch(
      `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${reg.replace(/\s/g, '').toUpperCase()}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'x-api-key': process.env.DVSA_API_KEY,
          Accept: 'application/json+v6',
        },
      }
    );

    const motData = await motRes.json();
    if (!motRes.ok) return res.status(motRes.status).json({ error: motData.message || 'MOT API error' });
    return res.status(200).json(motData);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch MOT data', detail: err.message });
  }
}
