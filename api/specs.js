// API Ninjas gives us accurate base specs (displacement, cylinders, transmission, drive, mpg)
// GPT-5 fills the missing performance fields (bhp, torque, 0-62, top speed, co2)
// using the confirmed real data from Ninja as context — far more accurate than AI alone.

const NINJA_KEY = process.env.NINJA_API_KEY || 'WeMnxdGjK00FQeHxNs9cMSf780diF0CjKYLtSdOR';

async function getNinja(make, model, year, fuel) {
  try {
    const params = new URLSearchParams({ make: make.toLowerCase(), limit: '5' });
    if (model && model.length > 1) params.set('model', model.toLowerCase().split(' ')[0]);
    if (year) params.set('year', String(year));
    if (fuel) {
      const ft = fuel.toLowerCase();
      if (ft.includes('petrol') || ft.includes('gas')) params.set('fuel_type', 'gas');
      else if (ft.includes('diesel')) params.set('fuel_type', 'diesel');
      else if (ft.includes('electric')) params.set('fuel_type', 'electricity');
    }
    const r = await fetch(`https://api.api-ninjas.com/v1/cars?${params}`, {
      headers: { 'X-Api-Key': NINJA_KEY },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch { return null; }
}

// GPT-5 via Vercel AI Gateway (OpenAI-compatible endpoint, zero-config auth).
async function ai(prompt) {
  const r = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-5.5',
      max_completion_tokens: 3000,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a UK automotive database. Return ONLY a raw JSON object, no markdown, no explanation.' },
        { role: 'user', content: prompt }
      ],
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

// Convert US MPG to UK MPG (US gallon is smaller)
function usToUkMpg(us) { return us ? Math.round(us * 1.201) : 0; }

// Map ninja drive string to our format
function mapDrive(d) {
  if (!d) return 'N/A';
  const m = { fwd: 'FWD', rwd: 'RWD', awd: 'AWD', '4wd': '4WD', '4x4': '4WD' };
  return m[d.toLowerCase()] || d.toUpperCase();
}

function mapTransmission(t, cylinders) {
  if (!t) return 'N/A';
  const s = t.toLowerCase();
  if (s.includes('manual')) return 'Manual';
  if (s.includes('auto')) return 'Automatic';
  return t;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { make, model, year, cc, fuel } = req.body || {};
  if (!make) return res.status(400).json({ error: 'No make' });

  const litres = cc ? (cc / 1000).toFixed(1) : '';
  const fuelClean = (fuel || '').toUpperCase();
  const isEV = fuelClean.includes('ELECTRIC');

  // Step 1: Get accurate base data from API Ninjas
  const ninja = await getNinja(make, model, year, fuelClean);

  // Build verified context string for GPT-5
  const ninjaContext = ninja ? [
    `Displacement: ${ninja.displacement}L`,
    ninja.cylinders ? `Cylinders: ${ninja.cylinders}` : '',
    ninja.transmission ? `Transmission: ${ninja.transmission}` : '',
    ninja.drive ? `Drive: ${ninja.drive}` : '',
    ninja.combination_mpg ? `MPG (US): ${ninja.combination_mpg} (~${usToUkMpg(ninja.combination_mpg)} UK)` : '',
  ].filter(Boolean).join(', ') : `Engine: ${litres}L ${fuelClean}`;

  // Step 2: Ask GPT-5 for performance specs using the confirmed base data
  const prompt = `Give me the exact UK factory performance specs for the ${year || ''} ${make} ${model || ''} ${litres ? litres + 'L' : ''} ${fuelClean}.
Confirmed technical data from database: ${ninjaContext}.
Use these confirmed values — do NOT override displacement, cylinders, transmission or drive type.
Return ONLY this JSON:
{"bhp":<int>,"torqueNm":<int>,"zeroToSixty":<float 0-62mph>,"topSpeedMph":<int>,"gearbox":"<e.g. 6-speed Manual>","consumptionCombined":${isEV ? '0' : `<int UK mpg>${ninja?.combination_mpg ? ', hint: ~' + usToUkMpg(ninja.combination_mpg) + ' UK mpg' : ''}`},"cylinders":${ninja?.cylinders || '<int>'},"driveType":"${ninja?.drive ? mapDrive(ninja.drive) : '<FWD|RWD|AWD|4WD>'}","co2gkm":${isEV ? '0' : '<int>'},"co2Label":"<A-G>"}`;

  try {
    const raw = await ai(prompt);
    const specs = parseJSON(raw);

    if (!specs.bhp || specs.bhp < 30) throw new Error('Bad BHP');

    // Override with verified Ninja data where we have it
    if (ninja?.cylinders) specs.cylinders = ninja.cylinders;
    if (ninja?.drive) specs.driveType = mapDrive(ninja.drive);
    if (ninja?.combination_mpg && !isEV) {
      const ukMpg = usToUkMpg(ninja.combination_mpg);
      if (ukMpg > 0) specs.consumptionCombined = ukMpg;
    }
    if (ninja?.transmission) {
      const t = ninja.transmission.toLowerCase();
      if (t.includes('manual') && specs.gearbox && !specs.gearbox.toLowerCase().includes('manual'))
        specs.gearbox = specs.gearbox.replace(/automatic|cvt|dct|dsg/i, 'Manual');
    }

    return res.status(200).json(specs);
  } catch (err) {
    // Fallback: if GPT-5 fails entirely, return what we know from Ninja
    if (ninja) {
      return res.status(200).json({
        bhp: 0, torqueNm: 0, zeroToSixty: 0, topSpeedMph: 0,
        gearbox: ninja.transmission || 'N/A',
        consumptionCombined: usToUkMpg(ninja.combination_mpg) || 0,
        cylinders: ninja.cylinders || 0,
        driveType: mapDrive(ninja.drive),
        co2gkm: 0, co2Label: 'N/A',
      });
    }
    return res.status(500).json({ error: err.message });
  }
}
