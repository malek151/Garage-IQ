export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { registrationNumber } = req.body;
  if (!registrationNumber) return res.status(400).json({ error: 'Registration number required' });

  try {
    const response = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.DVLA_API_KEY,
      },
      body: JSON.stringify({ registrationNumber: registrationNumber.replace(/\s/g, '').toUpperCase() }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'DVLA error' });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch vehicle data' });
  }
}
