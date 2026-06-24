async function groq(prompt) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 600,
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

  const {
    make, model, year, cc, fuel, colour,
    taxStatus, motStatus,
    passRate, totalTests,
    lastMileage, annualMileage,
    fraudDrops, majorFailures,
  } = req.body || {};

  const mileDrops = Array.isArray(fraudDrops) && fraudDrops.length > 0;
  const majors = Array.isArray(majorFailures) ? majorFailures.slice(0, 5) : [];

  const prompt = `You are a UK used car fraud detection AI. Analyse this vehicle data and return risk assessment.

Vehicle: ${year || ''} ${make || ''} ${model || ''} (${cc || ''}cc ${fuel || ''}, ${colour || ''})
Tax: ${taxStatus || 'Unknown'} | MOT: ${motStatus || 'Unknown'}
MOT pass rate: ${passRate || 100}% over ${totalTests || 0} tests
Last recorded mileage: ${lastMileage || 0} miles | Annual average: ${annualMileage || 0} mi/yr
Mileage drops detected: ${mileDrops ? 'YES - ' + fraudDrops.join(', ') + ' mile drops' : 'No'}
Major failures: ${majors.length ? majors.join('; ') : 'None'}

Return ONLY a JSON object (no markdown, no text before or after):
{
  "overallVerdict": "<CLEAN|SUSPICIOUS|HIGH RISK>",
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "stolenRisk": "<Low|Medium|High>",
  "stolenNote": "<one sentence, max 15 words>",
  "cloneRisk": "<Low|Medium|High>",
  "cloneNote": "<one sentence, max 15 words>",
  "mileageVerdict": "<Consistent|Suspicious|Fraudulent>",
  "buyerAdvice": "<2 sentences of practical UK buyer advice>"
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
