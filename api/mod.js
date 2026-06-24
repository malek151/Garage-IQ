async function groq(prompt) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
      temperature: 0.2,
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

  const { mod, make, model, year, cc, hp, torque, value, fuel } = req.body || {};
  if (!mod || !make) return res.status(400).json({ error: 'Missing mod or make' });

  const prompt = `You are a UK car modification expert. Analyse adding "${mod}" to a ${year || ''} ${make} ${model || ''} (${cc || 1600}cc, ${fuel || 'PETROL'}, ${hp || 130}BHP, ${torque || 200}Nm, worth £${value || 8000}).

Return ONLY a JSON object (no markdown, no text):
{
  "hpGain": <integer BHP gain, 0 if none>,
  "torqueGain": <integer Nm gain, 0 if none>,
  "newHp": <integer total BHP after mod>,
  "newTorque": <integer total Nm after mod>,
  "newValue": <integer estimated vehicle value in GBP after mod>,
  "soundRating": <integer 1-10, 1=no change, 10=very loud>,
  "soundDesc": "<brief sound description, max 6 words>",
  "valueChange": "<e.g. '+£500' or '-£200' or 'No change'>",
  "valueChangeDirection": "<up|down|neutral>",
  "installCost": "<e.g. '£150-£300 fitted'>",
  "insuranceImpact": "<brief insurance advice, max 12 words>",
  "motRisk": "<Low|Medium|High>",
  "motNote": "<brief MOT risk note, max 15 words>",
  "failureRisk": "<Low|Medium|High>",
  "verdict": "<2-3 sentence UK-specific verdict on this mod for this car>"
}`;

  try {
    const raw = await groq(prompt);
    const clean = raw.replace(/```json|```/gi, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1) throw new Error('No JSON');
    const result = JSON.parse(clean.slice(start, end + 1));
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
