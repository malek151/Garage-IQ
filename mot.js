export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { reg } = req.query;
  if (!reg) return res.status(400).json({ error: 'Registration number required' });

  try {
    const response = await fetch(`https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${reg.replace(/\s/g, '').toUpperCase()}`, {
      headers: {
        'x-api-key': process.env.DVSA_API_KEY,
        'Accept': 'application/json+v6',
      },
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'MOT API error' });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch MOT data' });
  }
}
