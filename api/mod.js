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
      max_tokens: 500,
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
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'UK automotive expert. Return only raw JSON, no markdown.' },
        { role: 'user', content: prompt }
      ]
    })
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

  const { mod, make, model, year, cc, hp, torque, value, fuel } = req.body || {};
  if (!mod || !make) return res.status(400).json({ error: 'Missing fields' });

  const litres = cc ? (cc / 1000).toFixed(1) : '1.6';
  const prompt = `UK car mod expert. Analyse adding "${mod}" to a ${year || 2018} ${make} ${model || ''} ${litres}L ${(fuel||'PETROL').toUpperCase()}, ${hp||130}BHP, ${torque||200}Nm, worth £${value||8000}.
Return ONLY this JSON:
{"hpGain":<int>,"torqueGain":<int>,"newHp":<int>,"newTorque":<int>,"newValue":<int GBP>,"soundRating":<1-10>,"soundDesc":"<6 words>","valueChange":"<e.g. +£500>","valueChangeDirection":"<up|down|neutral>","installCost":"<e.g. £150–£350 fitted>","insuranceImpact":"<12 words>","motRisk":"<Low|Medium|High>","motNote":"<15 words>","failureRisk":"<Low|Medium|High>","verdict":"<2 honest UK sentences>"}`;

  try {
    return res.status(200).json(parseJSON(await askAnthropic(prompt)));
  } catch (_) {
    try {
      return res.status(200).json(parseJSON(await askGroq(prompt)));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
