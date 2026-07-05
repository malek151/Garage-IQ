const NINJA_KEY = process.env.NINJA_API_KEY || 'WeMnxdGjK00FQeHxNs9cMSf780diF0CjKYLtSdOR';

async function askAnthropic(prompt) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error('Anthropic ' + r.status);
  const d = await r.json();
  return d.content?.[0]?.text || '';
}

async function askGroq(prompt) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      max_tokens: 300,
      temperature: 0,
      messages: [
        { role: 'system', content: 'Return ONLY raw JSON, no markdown.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!r.ok) throw new Error('Groq ' + r.status);
  return (await r.json()).choices?.[0]?.message?.content || '';
}

async function getNinja(make, model, year) {
  try {
    const p = new URLSearchParams({ make: make.toLowerCase(), limit: '3' });
    if (model?.length > 1) p.set('model', model.toLowerCase().split(' ')[0]);
    if (year) p.set('year', String(year));
    const r = await fetch(`https://api.api-ninjas.com/v1/cars?${p}`, {
      headers: { 'X-Api-Key': NINJA_KEY }
    });
    const data = await r.json();
    return Array.isArray(data) && data[0] ? data[0] : null;
  } catch { return null; }
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
  const isEV = fuelStr.includes('ELECTRIC');

  // Get verified base data from API Ninjas
  const ninja = await getNinja(make, model, year);
  const ninjaCtx = ninja
    ? `Confirmed: ${ninja.displacement || ''}L, ${ninja.cylinders || ''} cyl, ${ninja.transmission || ''}, ${ninja.drive || ''}, ${ninja.combination_mpg || ''}mpg(US)`
    : '';

  const prompt = `Exact UK factory specs for ${year || ''} ${make} ${model || ''} ${litres} ${fuelStr}.${ninjaCtx ? ' ' + ninjaCtx : ''}
Return ONLY this JSON:
{"bhp":<int>,"torqueNm":<int>,"zeroToSixty":<float>,"topSpeedMph":<int>,"gearbox":"<e.g. 6-speed Manual>","consumptionCombined":${isEV ? 0 : '<int UK mpg>'},"cylinders":${ninja?.cylinders || '<int>'},"driveType":"<FWD|RWD|AWD|4WD>","co2gkm":${isEV ? 0 : '<int>'},"co2Label":"<A-G>"}`;

  try {
    // Try Anthropic first (most accurate)
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('no anthropic key');
    const raw = await askAnthropic(prompt);
    const specs = parseJSON(raw);
    if (ninja?.cylinders) specs.cylinders = ninja.cylinders;
    if (ninja?.combination_mpg && !isEV) specs.consumptionCombined = Math.round(ninja.combination_mpg * 1.201);
    return res.status(200).json(specs);
  } catch (_) {
    try {
      // Fallback to Groq
      const raw = await askGroq(prompt);
      const specs = parseJSON(raw);
      if (ninja?.cylinders) specs.cylinders = ninja.cylinders;
      return res.status(200).json(specs);
    } catch (err) {
      console.error('api/specs.js failed:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }
}
