export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mod, make, model, year, cc, hp, torque, value, fuel } = req.body;
  if (!mod) return res.status(400).json({ error: 'Missing mod' });

  const isTurbo = (cc <= 1599 && hp >= 140) || hp >= 200;
  const engineType = fuel && fuel.includes('DIESEL') ? 'turbodiesel' : isTurbo ? 'turbocharged petrol' : 'naturally aspirated petrol';

  const modContext = {
    'Performance exhaust': 'Cat-back or turbo-back exhaust. For NA engines HP gain is minimal (3-8%). For turbo/supercharged 5-12%. Sound impact is HIGH. Does NOT affect torque much without a remap. MOT risk is noise-related (74dB limit).',
    'ECU remap': 'Stage 1 remap. For turbo petrols expect 20-35% HP gain. NA petrols only 5-10%. Diesel remaps typically +25-40%. No sound change. Significant torque gains on turbo engines. Insurance MUST be declared. Voids manufacturer warranty.',
    'Cold air intake': 'Induction kit replacing airbox. HP gain is 3-7% at most. Sound changes noticeably — loud induction roar. Minimal torque gain. Can cause issues in wet weather.',
    'Alloy wheels upgrade': 'Upgrading wheel size or style. NO HP change. Handling can improve or worsen depending on tyre. Value depends on style. MOT risk if wrong offset causes rubbing.',
    'Lowering springs': '30-50mm drop. NO HP change. Handling improves but ride suffers. Value negative for mainstream buyers. MOT risk if lowered too far — geometry check required.',
    'Turbo upgrade': 'Larger turbo. 30-60% HP gains possible but requires supporting mods (injectors, intercooler, remap). Very high cost. Reliability risk without proper supporting hardware. Major insurance declaration.',
    'Coilover kit': 'Full adjustable coilover system. NO HP change. Significant handling improvement. Ride quality varies. MOT risk around geometry and minimum ride height.',
    'Big brake kit': 'Larger discs and callipers. NO HP/torque change. Stopping distance improves. Brakes must be balanced across axle at MOT or it fails.',
    'Intercooler upgrade': 'Only relevant on turbo/supercharged engines. On NA engines this has NO effect. On turbo: reduces intake temps allowing more aggressive remap = 5-15% more HP on top of remap.',
  };

  const context = modContext[mod] || '';

  const prompt = `You are a highly accurate UK car modification expert. Be SPECIFIC and REALISTIC.

Car: ${year} ${make} ${model}, ${cc}cc ${engineType}, ${hp}HP, ${torque}Nm, estimated value £${value}.
Modification: "${mod}"
Expert context: ${context}

Rules:
- HP/torque gains MUST be realistic for this engine type. If mod doesn't change HP (alloys, brakes, coilovers, intercooler on NA), set hpGain to "+0" and newHp to "${hp}".
- Sound: alloys/brakes/intercooler/springs = no change (soundRating "5/10"). Exhaust = high rating.
- Value change must be realistic — some mods decrease value.
- Install cost must be real UK market range.
- Insurance: be specific per mod type.
- MOT risk must cite actual UK MOT rules.
- verdict must be specific to THIS car, not generic waffle.
- valueChangeDirection must be "up", "down", or "neutral".

Respond ONLY with this exact JSON, no markdown, no other text:
{"hpGain":"+X","newHp":"X","torqueGain":"+X","newTorque":"X","soundRating":"X/10","soundDesc":"specific description","valueChange":"£X","valueChangeDirection":"up","newValue":"X","installCost":"£X–£X","insuranceImpact":"specific advice","motRisk":"Low","motNote":"specific MOT rule","verdict":"specific verdict for this car","failureRisk":"Low — reason"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'AI error', detail: data });

    const txt = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(txt);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to analyse', detail: err.message });
  }
}
