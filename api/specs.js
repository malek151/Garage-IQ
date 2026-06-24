async function groq(prompt) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 400,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
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

  const prompt = `You are a UK vehicle database. Return ONLY a JSON object (no markdown, no explanation) with exact specs for:
${year || ''} ${make} ${model || ''} ${cc ? cc + 'cc' : ''} ${fuel || ''}

JSON fields (numbers only where stated):
{
  "bhp": <integer horsepower>,
  "torqueNm": <integer Nm>,
  "zeroToSixty": <float seconds 0-60>,
  "topSpeedMph": <integer mph>,
  "gearbox": "<X-speed Manual|Automatic|CVT>",
  "consumptionCombined": <integer mpg, 0 if electric>,
  "cylinders": <integer>,
  "driveType": "<FWD|RWD|AWD|4WD>",
  "co2gkm": <integer g/km, 0 if electric>,
  "co2Label": "<A|B|C|D|E|F|G>"
}

Return ONLY the JSON. No text before or after.`;

  try {
    const raw = await groq(prompt);
    const clean = raw.replace(/```json|```/gi, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1) throw new Error('No JSON');
    const specs = JSON.parse(clean.slice(start, end + 1));
    return res.status(200).json(specs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
