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
      temperature: 0,
      messages: [
        { role: 'system', content: 'UK car fraud detection AI. Return only raw JSON, no markdown.' },
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

  const { make, model, year, cc, fuel, colour, taxStatus, motStatus, passRate, totalTests, lastMileage, annualMileage, fraudDrops, majorFailures } = req.body || {};
  const drops = Array.isArray(fraudDrops) && fraudDrops.length > 0;
  const majors = Array.isArray(majorFailures) ? majorFailures.slice(0, 5) : [];

  const prompt = `UK used car fraud AI. Analyse:
${year||''} ${make||''} ${model||''} (${cc||''}cc ${fuel||''}, ${colour||''})
Tax: ${taxStatus||'Unknown'} | MOT: ${motStatus||'Unknown'}
MOT pass rate: ${passRate||100}% over ${totalTests||0} tests
Last mileage: ${lastMileage||0} | Annual avg: ${annualMileage||0} mi/yr
Mileage drops: ${drops?'YES — '+fraudDrops.join(', ')+' mile drops':'No'}
Major failures: ${majors.length?majors.join('; '):'None'}
Return ONLY this JSON:
{"overallVerdict":"<CLEAN|SUSPICIOUS|HIGH RISK>","keyFindings":["<finding>","<finding>","<finding>"],"stolenRisk":"<Low|Medium|High>","stolenNote":"<15 words>","cloneRisk":"<Low|Medium|High>","cloneNote":"<15 words>","mileageVerdict":"<Consistent|Suspicious|Fraudulent>","buyerAdvice":"<2 practical UK sentences>"}`;

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('no anthropic key');
    return res.status(200).json(parseJSON(await askAnthropic(prompt)));
  } catch (_) {
    try {
      return res.status(200).json(parseJSON(await askGroq(prompt)));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
