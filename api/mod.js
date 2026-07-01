// GPT-5 via Vercel AI Gateway (OpenAI-compatible endpoint, zero-config auth).
async function ai(messages) {
  const r = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-5.5',
      max_completion_tokens: 3000,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages,
    }),
  });
  if (!r.ok) throw new Error('Gateway ' + r.status + ' ' + (await r.text()).slice(0, 300));
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
    return res.status(200).json(parseJSON(await ai([
      { role: 'system', content: 'UK automotive expert. Return only raw JSON, no markdown.' },
      { role: 'user', content: prompt }
    ])));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
