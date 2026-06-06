export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not set' });

  const { mod, make, model, year, cc, hp, torque, value, fuel } = req.body;
  if (!mod) return res.status(400).json({ error: 'mod required' });

  // Per-mod expert context so AI gives accurate, specific numbers
  const MOD_CONTEXT = {
    'ECU remap': `Typical gains for a ${cc}cc ${fuel} engine: 15-25% BHP increase, 20-30% torque increase. Turbocharged engines benefit most. Naturally aspirated: 5-10% gains only. Insurance: must declare, expect 10-30% premium increase. MOT: passes if mapped cleanly. Reliability: generally safe if done by reputable tuner like Revo, APR, or Quantum. Cost: £250-£600 depending on platform.`,
    'Performance exhaust': `Cat-back exhaust on a ${cc}cc ${fuel}: 3-8 BHP gain typically, mainly sound improvement. Sound rating depends on system — Milltek/Akrapovic louder, Scorpion mid. Value impact: generally positive for performance cars, neutral/negative for family cars. Insurance: declare it. MOT: passes if cat retained. Cost: £400-£1,500.`,
    'Cold air intake': `On a ${cc}cc ${fuel}: 3-7 BHP gain, improved throttle response, notable induction sound. Heat-soak risk in stop-start traffic. K&N, Pipercross common brands. Insurance: declare. MOT: no issue. Cost: £80-£300.`,
    'Turbo upgrade': `Significant mod for a ${cc}cc ${fuel}. Requires supporting mods: intercooler, injectors, fuel pump, tune. Gains: 30-100+ BHP depending on spec. Very high insurance impact — some insurers refuse. Reliability: high risk if not done properly. Professional install required. Cost: £1,500-£5,000+.`,
    'Supercharger kit': `Positive displacement power delivery on a ${cc}cc ${fuel}. Linear power curve vs turbo lag. Popular on V8s and naturally aspirated engines. Gains: 50-150 BHP. High cost (£3,000-£8,000), high insurance impact, requires engine management tune. Reliability: generally good if kit designed for the car.`,
    'Intercooler upgrade': `On a turbocharged ${cc}cc ${fuel}: reduces intake temps by 20-40°C, allowing safer, higher boost. Prevents heat-soak on track/spirited driving. HP gain alone: 5-15 BHP, but enables further tuning headroom. Insurance: declare. MOT: no issue. Cost: £200-£800.`,
    'Exhaust decat pipe': `Removes catalytic converter on a ${cc}cc ${fuel}. Sound and minor power gain (5-10 BHP). ILLEGAL for road use — will fail MOT emissions test. Track use only. High insurance risk. Cost: £150-£400. Not recommended for daily drivers.`,
    'Forged engine internals': `Pistons, rods, crank for a ${cc}cc ${fuel}. Allows high boost/power without engine failure. No power gain alone — enables tuning to higher limits. Cost: £1,500-£4,000 parts + labour. Essential for 400+ BHP builds. Reliability: greatly improved at high power. Insurance: declare major engine work.`,
    'Sports air filter': `Drop-in panel filter (K&N, BMC) for a ${cc}cc ${fuel}. Minimal gains: 1-3 BHP, improved airflow at high RPM. Easy install, reusable. Insurance: low impact but declare. MOT: no issue. Cost: £40-£100. Best value entry-level mod.`,
    'Coilover kit': `Full height and damper adjustment for a ${cc}cc ${fuel}. Brands: KW, Bilstein, BC Racing, Öhlins. Improves body control, cornering. Can be lowered 20-60mm. MOT: must maintain suspension geometry — get geometry check after fitting. Insurance: declare. Cost: £600-£2,500.`,
    'Lowering springs': `Reduces ride height 20-40mm on a ${cc}cc ${fuel}. Improves handling, lowers centre of gravity. Stiffer ride. MOT: check bump stops don't contact — get geometry check. Cost: £80-£250. Insurance: declare. Brands: Eibach, H&R, Apex.`,
    'Big brake kit': `Larger discs, multi-piston calipers for a ${cc}cc ${fuel}. Improves stopping power and heat dissipation. Brands: Brembo, AP Racing, Tarox. Requires larger alloys (17"+ minimum). Insurance: declare — can reduce premium on performance cars. MOT: no issue if installed correctly. Cost: £800-£3,000.`,
    'Anti-roll bar upgrade': `Stiffer ARBs for a ${cc}cc ${fuel}. Reduces body roll, improves turn-in. Front and rear kits available. Brands: Whiteline, Eibach, SuperPro. MOT: no issue. Insurance: low impact. Cost: £150-£600. Pairs well with coilovers.`,
    'Limited slip differential': `Replaces open diff on a ${cc}cc ${fuel}. Improves traction out of corners, reduces wheel spin. Torsen, Wavetrac, or plated LSDs available. High fitment complexity. MOT: no issue. Insurance: declare. Cost: £600-£2,000 fitted. Essential for high-power RWD cars.`,
    'Uprated suspension bushes': `Polyurethane bushes replace worn rubber on a ${cc}cc ${fuel}. Improve precision, reduce flex. Brands: SuperPro, Powerflex. Can increase NVH (noise/vibration). MOT: generally passes. Insurance: low impact. Cost: £200-£600 full set. Excellent longevity improvement.`,
    'Alloy wheels upgrade': `New alloys on a ${cc}cc ${fuel}. Weight matters: lighter wheels reduce unsprung mass, improve handling. Width and offset critical — wrong offset risks arch/suspension contact. Insurance: declare. MOT: must not foul bodywork. Cost: £400-£2,000 set. Value impact: generally positive.`,
    'Body kit aerodynamics': `Bumpers, side skirts, splitter, diffuser for a ${cc}cc ${fuel}. Aesthetic and aerodynamic benefit. Ground clearance risk — check MOT clearance. Insurance: declare — affects value and repair cost. Cost: £500-£3,000 fitted. Value impact: subjective — positive on sports cars, negative on family cars.`,
    'Window tint': `Legal limit: front side windows ≥70% VLT, rear no limit for cars. ${cc}cc ${fuel}. Reduces heat and UV. Brands: Llumar, SunTek, 3M. MOT: front windows checked — under 70% VLT fails. Insurance: low impact. Cost: £150-£400 full car.`,
    'Tow bar fitting': `Detachable or fixed tow bar for a ${cc}cc ${fuel}. Legal max: 85% of vehicle kerb weight (check handbook). Requires wiring loom. MOT: no issue. Insurance: declare — minor impact. Value: positive for utility/SUV, neutral for sports. Cost: £200-£600 fitted.`,
    'Wrap or respray': `Colour change via vinyl wrap or respray on a ${cc}cc ${fuel}. Must notify DVLA of permanent colour change. Wrap: reversible, no DVLA notification needed. Cost: Wrap £1,500-£4,000, Respray £2,000-£8,000. Insurance: declare colour change. Value: depends on quality and colour choice.`,
    'Carbon fibre bonnet': `Weight saving: 5-12kg vs steel for a ${cc}cc ${fuel}. Brands: Seibon, Varis, OEM. Lowers centre of gravity marginally. Some include heat vents. Insurance: declare — higher replacement cost. MOT: no issue. Value: positive on performance/JDM cars. Cost: £400-£1,500.`,
    'Sports clutch upgrade': `Uprated clutch for a ${cc}cc ${fuel}. Necessary when OEM clutch slips with added power. Organic (daily), paddle (track). Brands: Sachs, AP Racing, Helix. MOT: no issue. Insurance: low impact. Cost: £500-£1,500 fitted. Pedal feel may be heavier.`,
    'Short shifter kit': `Reduces throw length 30-40% on a ${cc}cc ${fuel}. Quicker gear changes. Brands: Mishimoto, Forge, OEM Sport. MOT: no issue. Insurance: low impact. Cost: £80-£300. Easy DIY install on most platforms. May affect feel — try before committing.`,
    'Gearbox rebuild or upgrade': `Major work on a ${cc}cc ${fuel}. Rebuild: replace worn synchros, bearings. Upgrade: close-ratio gearset for track use. Cost: £800-£3,000. High reliability improvement if worn. Insurance: declare major drivetrain work. MOT: no issue if rebuilt correctly.`,
    'Roll cage installation': `FIA/MSA cage for a ${cc}cc ${fuel}. Track safety essential. Road use: DANGEROUS without head padding — illegal without proper install. Removes rear seats typically. MOT: complex — consult DVSA. Insurance: specialist policy needed. Cost: £1,500-£5,000 fitted.`,
    'Bucket seat and harness': `Fixed bucket seat for a ${cc}cc ${fuel}. Brands: Sparco, Recaro, OMP. Road use: standard 3-point seatbelt must remain. Harness: for track only (airbag deployment risk). MOT: seatbelt must still function. Insurance: declare. Cost: £400-£1,200 seat + £150-£300 harness.`,
    'Nitrous oxide system': `NOS system for a ${cc}cc ${fuel}. Wet or dry system. Gains: 50-150 BHP shot. ILLEGAL on public UK roads — must be declared to police and is banned for road use. Track use only. High engine stress — must have supporting mods. Insurance: no standard insurer will cover. Cost: £400-£1,000.`,
  };

  const ctx = MOD_CONTEXT[mod] || `Generic mod analysis for a ${year} ${make} ${model} (${cc}cc ${fuel}).`;

  const prompt = `You are a UK car modification expert. Analyse the impact of fitting "${mod}" to a ${year} ${make || 'car'} ${model || ''} (${cc}cc ${fuel}, ${hp} BHP, ${torque} Nm, current value ~£${value}).

Expert context: ${ctx}

Respond ONLY with a valid JSON object, no markdown fences, no <think> tags, no commentary outside JSON:
{
  "hpGain": number (net BHP gain, 0 if none),
  "torqueGain": number (net Nm gain, 0 if none),
  "newHp": number (total BHP after mod),
  "newTorque": number (total Nm after mod),
  "newValue": number (estimated new market value in GBP),
  "soundRating": number (1-10, 1=silent 10=very loud),
  "soundDesc": "short sound description",
  "valueChange": "e.g. +£500 or -£200 or No change",
  "valueChangeDirection": "up or down or neutral",
  "installCost": "e.g. £300-£600",
  "insuranceImpact": "short sentence about insurance impact",
  "motRisk": "Low or Medium or High",
  "motNote": "one sentence about MOT impact",
  "failureRisk": "Low - reason or Medium - reason or High - reason",
  "verdict": "2-3 sentence expert verdict for a UK buyer"
}`;

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
        temperature: 0,
        max_tokens: 500,
      })
    });

    if (!r.ok) throw new Error('Groq error ' + r.status);
    const data = await r.json();

    // Strip DeepSeek <think>...</think> tags before parsing
    const raw = (data.choices?.[0]?.message?.content || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json|```/g, '')
      .trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const result = JSON.parse(match[0]);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
