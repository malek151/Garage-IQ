async function groq(prompt) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'You are an automotive database. You only return exact, accurate technical specifications for real vehicles. Never guess or approximate. Return ONLY raw JSON with no markdown, no explanation, no text before or after the JSON object.'
        },
        { role: 'user', content: prompt }
      ],
    }),
  });
  if (!r.ok) throw new Error('Groq ' + r.status);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { make, model, year, cc, fuel } = req.body || {};
  if (!make) return res.status(400).json({ error: 'No make' });

  const engineLitres = cc ? (cc / 1000).toFixed(1) : '';
  const fuelClean = (fuel || '').toUpperCase();
  const isElectric = fuelClean === 'ELECTRIC' || fuelClean === 'ELECTRICITY';

  const prompt = `Return the exact factory specifications for the ${year || ''} ${make} ${model || ''} ${engineLitres ? engineLitres + 'L' : ''} ${fuelClean} sold in the UK market.

Return ONLY this JSON object with real values:
{
  "bhp": <exact integer BHP at the wheels>,
  "torqueNm": <exact integer Nm>,
  "zeroToSixty": <exact 0-62mph time as float>,
  "topSpeedMph": <exact integer mph>,
  "gearbox": "<exact gearbox e.g. '6-speed Manual' or '7-speed DCT' or 'CVT'>",
  "consumptionCombined": <exact integer mpg combined, 0 if electric>,
  "cylinders": <exact integer, 0 if electric>,
  "driveType": "<FWD|RWD|AWD|4WD>",
  "co2gkm": <exact integer g/km, 0 if electric>,
  "co2Label": "<A|B|C|D|E|F|G>"
}`;

  try {
    const raw = await groq(prompt);
    const clean = raw.replace(/```json|```/gi, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1) throw new Error('No JSON in response');
    const specs = JSON.parse(clean.slice(start, end + 1));

    // Validate — reject obviously wrong values
    if (!specs.bhp || specs.bhp < 40 || specs.bhp > 2000) throw new Error('Invalid BHP');
    if (!specs.torqueNm || specs.torqueNm < 40) throw new Error('Invalid torque');

    return res.status(200).json(specs);
  } catch (err) {
    // Fallback: try with a simpler prompt
    try {
      const fallback = await groq(`What are the BHP, Nm torque, 0-62 time, top speed, gearbox type, combined MPG, cylinder count, drive type, and CO2 g/km for a ${year || ''} ${make} ${model || ''} ${engineLitres ? engineLitres + 'L' : ''} ${fuelClean}? Return as JSON only: {"bhp":0,"torqueNm":0,"zeroToSixty":0.0,"topSpeedMph":0,"gearbox":"","consumptionCombined":0,"cylinders":0,"driveType":"","co2gkm":0,"co2Label":""}`);
      const fc = fallback.replace(/```json|```/gi, '').trim();
      const fs = fc.indexOf('{'), fe = fc.lastIndexOf('}');
      if (fs === -1) throw new Error('No fallback JSON');
      return res.status(200).json(JSON.parse(fc.slice(fs, fe + 1)));
    } catch {
      return res.status(500).json({ error: err.message });
    }
  }
}
