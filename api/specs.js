const NINJA_KEY = process.env.NINJA_API_KEY || 'WeMnxdGjK00FQeHxNs9cMSf780diF0CjKYLtSdOR';
const SUPA_URL = 'https://hbfntnxawwavttzvxdde.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm50bnhhd3dhdnR0enZ4ZGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjA3NTYsImV4cCI6MjA5NDQ5Njc1Nn0.PtGE3zS40b8VBozDcl93-sNVx1wN29-sKvZzje--s10';

// Reject values that can't possibly be a real model name (EU type-approval
// codes like M1/N1, empty strings, single letters etc.)
function sanitizeModel(m) {
  const v = (m || '').toString().trim();
  if (v.length < 3) return '';
  if (/^[A-Z]\d$/i.test(v)) return ''; // M1, N1, L3 etc — regulatory category codes
  return v;
}

function cacheKey(make, model, year, cc, fuel) {
  // Deliberately NOT keying on model when it's absent/unreliable — keying on a
  // guessed model fragments the cache and can lock in wrong data forever.
  return [make, model, year, cc, fuel].map(v => (v || '').toString().trim().toLowerCase()).join('|');
}

async function getCached(key) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/specs_cache?cache_key=eq.${encodeURIComponent(key)}&select=*&limit=1`, {
      headers: { apikey: SUPA_ANON, Authorization: `Bearer ${SUPA_ANON}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows?.[0]) return null;
    const row = rows[0];
    return {
      bhp: row.bhp, torqueNm: row.torque_nm, zeroToSixty: row.zero_to_sixty, topSpeedMph: row.top_speed_mph,
      gearbox: row.gearbox, consumptionCombined: row.mpg, cylinders: row.cylinders, driveType: row.drive_type,
      co2gkm: row.co2_gkm, co2Label: row.co2_label,
    };
  } catch { return null; }
}

async function setCached(key, make, model, year, cc, fuel, specs) {
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!svcKey) return;
  try {
    await fetch(`${SUPA_URL}/rest/v1/specs_cache`, {
      method: 'POST',
      headers: { apikey: svcKey, Authorization: `Bearer ${svcKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify({
        cache_key: key, make, model, year, cc, fuel,
        bhp: specs.bhp, torque_nm: specs.torqueNm, zero_to_sixty: specs.zeroToSixty, top_speed_mph: specs.topSpeedMph,
        gearbox: specs.gearbox, mpg: specs.consumptionCombined, cylinders: specs.cylinders, drive_type: specs.driveType,
        co2_gkm: specs.co2gkm, co2_label: specs.co2Label,
      }),
    });
  } catch { /* non-fatal */ }
}

async function askAnthropic(prompt) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 300, temperature: 0, messages: [{ role: 'user', content: prompt }] })
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
      model: 'openai/gpt-oss-20b', max_tokens: 800, reasoning_effort: 'low',
      response_format: { type: 'json_object' }, temperature: 0,
      messages: [{ role: 'system', content: 'Return ONLY raw JSON, no markdown.' }, { role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error('Groq ' + r.status);
  return (await r.json()).choices?.[0]?.message?.content || '';
}

async function getNinja(make, model, year, cc) {
  try {
    const p = new URLSearchParams({ make: make.toLowerCase(), limit: '10' });
    if (model && model.length > 2) p.set('model', model.toLowerCase().split(' ')[0]);
    if (year) p.set('year', String(year));
    const r = await fetch(`https://api.api-ninjas.com/v1/cars?${p}`, { headers: { 'X-Api-Key': NINJA_KEY } });
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return null;
    // Pick the closest displacement match so we don't grab an unrelated variant
    if (cc) {
      const target = cc / 1000;
      data.sort((a, b) => Math.abs((a.displacement || 99) - target) - Math.abs((b.displacement || 99) - target));
    }
    return data[0];
  } catch { return null; }
}

function parseJSON(raw) {
  const c = raw.replace(/```json|```/gi, '').trim();
  const s = c.indexOf('{'), e = c.lastIndexOf('}');
  if (s === -1) throw new Error('No JSON');
  return JSON.parse(c.slice(s, e + 1));
}

// Reject numbers that are obviously nonsense for a real production car
function sane(specs) {
  if (!specs.bhp || specs.bhp < 30 || specs.bhp > 1500) return false;
  if (!specs.torqueNm || specs.torqueNm < 40 || specs.torqueNm > 2000) return false;
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { make, year, cc, fuel } = req.body || {};
  const model = sanitizeModel(req.body?.model);
  if (!make) return res.status(400).json({ error: 'No make' });

  const key = cacheKey(make, model, year, cc, fuel);

  const cached = await getCached(key);
  if (cached) return res.status(200).json(cached);

  const litres = cc ? (cc / 1000).toFixed(1) + 'L' : '';
  const fuelStr = (fuel || '').toUpperCase();
  const isEV = fuelStr.includes('ELECTRIC');

  const ninja = await getNinja(make, model, year, cc);
  const ninjaModel = sanitizeModel(ninja?.model);
  const ninjaCtx = ninja
    ? `Confirmed technical data: ${ninja.displacement || ''}L, ${ninja.cylinders || ''} cyl, ${ninja.transmission || ''}, ${ninja.drive || ''}, ${ninja.combination_mpg || ''}mpg(US).${ninjaModel ? ' Closest known variant: ' + ninjaModel + '.' : ''}`
    : '';

  const prompt = `Exact UK factory specs for ${year || ''} ${make} ${model || ninjaModel || ''} ${litres} ${fuelStr}.${ninjaCtx ? ' ' + ninjaCtx : ''}
Return ONLY this JSON:
{"bhp":<int>,"torqueNm":<int>,"zeroToSixty":<float>,"topSpeedMph":<int>,"gearbox":"<e.g. 6-speed Manual>","consumptionCombined":${isEV ? 0 : '<int UK mpg>'},"cylinders":${ninja?.cylinders || '<int>'},"driveType":"<FWD|RWD|AWD|4WD>","co2gkm":${isEV ? 0 : '<int>'},"co2Label":"<A-G>"}`;

  let specs;
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('no anthropic key');
    specs = parseJSON(await askAnthropic(prompt));
    if (!sane(specs)) throw new Error('anthropic returned implausible specs');
  } catch (_) {
    try {
      specs = parseJSON(await askGroq(prompt));
      if (!sane(specs)) throw new Error('groq returned implausible specs');
    } catch (err) {
      console.error('api/specs.js failed:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  if (ninja?.cylinders) specs.cylinders = ninja.cylinders;
  if (ninja?.combination_mpg && !isEV) specs.consumptionCombined = Math.round(ninja.combination_mpg * 1.201);

  await setCached(key, make, model, year, cc, fuel, specs);
  return res.status(200).json(specs);
}
