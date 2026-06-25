async function groq(messages) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-oss-20b', max_tokens: 400, temperature: 0, messages })
  });
  if (!r.ok) throw new Error('Groq ' + r.status);
  return (await r.json()).choices?.[0]?.message?.content || '';
}
function parseJSON(raw) {
  const c = raw.replace(/```json|```/gi, '').trim();
  const s = c.indexOf('{'), e = c.lastIndexOf('}');
  if (s === -1) throw new Error('No JSON');
  return JSON.parse(c.slice(s, e + 1));
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { make, model, year, cc, fuel } = req.body || {};
  if (!make) return res.status(400).json({ error: 'No make' });
  const litres = cc ? (cc / 1000).toFixed(1) + 'L' : '';
  const fuelStr = (fuel || '').toUpperCase();
  const prompt = `Return exact UK factory specs for the ${year || ''} ${make} ${model || ''} ${litres} ${fuelStr}.
Return ONLY this JSON, no text before or after:
{"bhp":<int>,"torqueNm":<int>,"zeroToSixty":<float>,"topSpeedMph":<int>,"gearbox":"<e.g. 6-speed Manual>","consumptionCombined":<int mpg, 0 if EV>,"cylinders":<int, 0 if EV>,"driveType":"<FWD|RWD|AWD|4WD>","co2gkm":<int, 0 if EV>,"co2Label":"<A-G>"}`;
  try {
    const specs = parseJSON(await groq([
      { role: 'system', content: 'You are an automotive database. Return only raw JSON with no markdown.' },
      { role: 'user', content: prompt }
    ]));
    if (!specs.bhp || specs.bhp < 30) throw new Error('Bad BHP');
    return res.status(200).json(specs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
