export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { make, model, year, cc, fuel } = req.body;
  if (!make) return res.status(400).json({ error: 'Missing make' });

  const prompt = `Give me the exact technical specifications for a ${year} ${make} ${model} with a ${cc}cc ${fuel} engine sold in the UK.

Respond ONLY with this exact JSON, no markdown, no other text:
{"bhp":"150","torqueNm":"330","torqueRpm":"1750","topSpeedMph":"127","zeroToSixty":"9.5","gearbox":"6-speed Manual","cylinders":"4","consumptionCity":"55.4","consumptionExtraUrban":"72.4","consumptionCombined":"64.2","co2gkm":"115","co2Label":"C","driveType":"FWD","engineCode":"B47"}

Rules:
- bhp must be the exact factory UK figure for this specific engine variant
- torqueNm and torqueRpm must be exact
- topSpeedMph must be exact manufacturer figure
- zeroToSixty must be exact 0-62mph figure
- gearbox must include number of speeds and type (Manual/Automatic/DCT/CVT)
- consumption figures must be WLTP or NEDC official UK figures in mpg
- co2Label must be A B C D E F G based on g/km
- driveType: FWD, RWD, AWD or 4WD
- If you are not certain of a value, use your best estimate for this engine variant — do not use placeholder text`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'AI error', detail: data });

    const txt = (data.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(txt);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch specs', detail: err.message });
  }
}
