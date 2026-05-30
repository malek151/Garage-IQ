export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not set' });

  const { make, model, year, cc, fuel, colour, taxStatus, motStatus,
          passRate, totalTests, lastMileage, annualMileage,
          fraudDrops, majorFailures } = req.body;

  const prompt = `You are a UK vehicle risk analyst. Based ONLY on the DVLA/DVSA data provided, give a professional risk assessment. Be concise and direct. Do NOT invent finance or theft info — state clearly those require HPI.

Vehicle: ${year} ${make||'Unknown'} ${model||''}${cc?' '+cc+'cc':''} ${fuel||''}
Colour: ${colour||'Unknown'}
Tax: ${taxStatus||'Unknown'} | MOT: ${motStatus||'Unknown'}
MOT pass rate: ${passRate||'?'}% (${totalTests||'?'} tests)
Last recorded mileage: ${lastMileage?Number(lastMileage).toLocaleString()+' miles':'unknown'}
Annual mileage: ${annualMileage?Number(annualMileage).toLocaleString()+' miles/yr':'unknown'}
Mileage rollback drops: ${fraudDrops&&fraudDrops.length?fraudDrops.length+' detected — '+fraudDrops.map(d=>d.toLocaleString()+' mi').join(', '):'None detected'}
Major/dangerous MOT failures: ${majorFailures&&majorFailures.length?majorFailures.length+' — '+majorFailures.slice(0,3).join('; '):'None'}

Respond with ONLY a valid JSON object, no markdown, no commentary:
{"overallVerdict":"CLEAN or SUSPICIOUS or HIGH RISK","stolenRisk":"Low or Medium or High","stolenNote":"one sentence max","financeNote":"Cannot verify — HPI check required","cloneRisk":"Low or Medium or High","cloneNote":"one sentence max","mileageVerdict":"Consistent or Suspicious or Fraudulent","keyFindings":["finding 1","finding 2","finding 3"],"buyerAdvice":"2 sentences max"}`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 400,
      })
    });

    if (!r.ok) throw new Error('Groq error ' + r.status);
    const data = await r.json();
    const text = (data.choices?.[0]?.message?.content || '').trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const result = JSON.parse(match[0]);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
