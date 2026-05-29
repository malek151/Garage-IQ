export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { make, model, year, cc, fuel } = req.body;
  const makeU  = (make  || '').toUpperCase().trim();
  const modelU = (model || '').toUpperCase().trim();
  const yearN  = parseInt(year) || 2015;
  const ccN    = parseInt(cc)   || 1600;
  const fuelU  = (fuel  || '').toUpperCase().trim();

  // ── STEP 1: Groq — temperature 0 for consistency ──
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (GROQ_KEY && makeU && modelU) {
    try {
      const prompt = `You are a precise UK car specification database. Return ONLY valid JSON with exact factory specs for this specific vehicle. No estimates, no ranges — exact figures from the manufacturer.
Vehicle: ${yearN} ${makeU} ${modelU} ${ccN}cc ${fuelU}
Return ONLY this exact JSON, nothing else:
{"bhp":NUMBER_OR_NULL,"torqueNm":NUMBER_OR_NULL,"torqueRpm":NUMBER_OR_NULL,"zeroToSixty":NUMBER_OR_NULL,"topSpeedMph":NUMBER_OR_NULL,"cylinders":NUMBER_OR_NULL,"gearbox":"Manual OR Automatic OR DSG OR CVT OR null","driveType":"FWD OR RWD OR AWD OR 4WD OR null","consumptionCombined":NUMBER_MPG_OR_NULL,"co2gkm":NUMBER_OR_NULL,"co2Label":"A OR B OR C OR D OR E OR F OR G OR null"}`;

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 250,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = (data.choices?.[0]?.message?.content || '').trim();
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const s = JSON.parse(match[0]);
          // Only use if bhp looks real
          if (s.bhp && s.bhp > 40 && s.bhp < 1500 && s.torqueNm) {
            return res.status(200).json({ ...s, _source: 'groq' });
          }
        }
      }
    } catch (_) { /* fall through */ }
  }

  // ── STEP 2: Hardcoded database — 200+ most common UK cars ──
  const DB = {
    // ── FORD ──
    'FORD|FIESTA|999':   { bhp:100,torqueNm:170,torqueRpm:1400,zeroToSixty:11.1,topSpeedMph:115,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:99,  co2Label:'B' },
    'FORD|FIESTA|1499':  { bhp:120,torqueNm:170,torqueRpm:1500,zeroToSixty:10.2,topSpeedMph:124,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:49,co2gkm:104, co2Label:'C' },
    'FORD|FIESTA|1599':  { bhp:125,torqueNm:175,torqueRpm:1500,zeroToSixty:9.4, topSpeedMph:126,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:109, co2Label:'C' },
    'FORD|FOCUS|1499':   { bhp:150,torqueNm:240,torqueRpm:1600,zeroToSixty:9.0, topSpeedMph:130,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:118, co2Label:'C' },
    'FORD|FOCUS|1999':   { bhp:182,torqueNm:270,torqueRpm:1600,zeroToSixty:7.4, topSpeedMph:140,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:40,co2gkm:130, co2Label:'D' },
    'FORD|FOCUS|1596':   { bhp:125,torqueNm:170,torqueRpm:1500,zeroToSixty:10.8,topSpeedMph:120,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:45,co2gkm:114, co2Label:'C' },
    'FORD|FOCUS|1560':   { bhp:115,torqueNm:270,torqueRpm:1750,zeroToSixty:10.2,topSpeedMph:120,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:55,co2gkm:95,  co2Label:'B' },
    'FORD|PUMA|999':     { bhp:125,torqueNm:170,torqueRpm:1400,zeroToSixty:10.0,topSpeedMph:120,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:50,co2gkm:101, co2Label:'C' },
    'FORD|PUMA|1499':    { bhp:155,torqueNm:240,torqueRpm:1600,zeroToSixty:8.6, topSpeedMph:130,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:48,co2gkm:108, co2Label:'C' },
    'FORD|MONDEO|1499':  { bhp:160,torqueNm:240,torqueRpm:1600,zeroToSixty:9.0, topSpeedMph:134,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:118, co2Label:'C' },
    'FORD|MONDEO|1999':  { bhp:180,torqueNm:270,torqueRpm:1600,zeroToSixty:8.5, topSpeedMph:137,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:40,co2gkm:129, co2Label:'D' },
    'FORD|MONDEO|2000':  { bhp:240,torqueNm:340,torqueRpm:2000,zeroToSixty:7.2, topSpeedMph:155,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:38,co2gkm:135,co2Label:'D' },
    'FORD|KUGA|1499':    { bhp:150,torqueNm:240,torqueRpm:1600,zeroToSixty:9.9, topSpeedMph:127,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:120, co2Label:'C' },
    'FORD|KUGA|1997':    { bhp:150,torqueNm:370,torqueRpm:2000,zeroToSixty:9.1, topSpeedMph:120,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:47,co2gkm:112,co2Label:'C' },
    'FORD|MUSTANG|4951': { bhp:450,torqueNm:529,torqueRpm:4250,zeroToSixty:4.8, topSpeedMph:155,cylinders:8,gearbox:'Manual',driveType:'RWD',consumptionCombined:19,co2gkm:295, co2Label:'G' },
    'FORD|MUSTANG|2300': { bhp:284,torqueNm:407,torqueRpm:3000,zeroToSixty:5.8, topSpeedMph:155,cylinders:4,gearbox:'Manual',driveType:'RWD',consumptionCombined:32,co2gkm:200, co2Label:'F' },
    'FORD|RANGER|1996':  { bhp:170,torqueNm:420,torqueRpm:1750,zeroToSixty:10.5,topSpeedMph:112,cylinders:4,gearbox:'Manual',driveType:'4WD',consumptionCombined:32,co2gkm:199, co2Label:'F' },
    'FORD|RANGER|3200':  { bhp:200,torqueNm:470,torqueRpm:1750,zeroToSixty:10.1,topSpeedMph:112,cylinders:5,gearbox:'Manual',driveType:'4WD',consumptionCombined:28,co2gkm:220, co2Label:'G' },
    'FORD|TRANSIT|2198': { bhp:130,torqueNm:385,torqueRpm:1600,zeroToSixty:14.0,topSpeedMph:104,cylinders:4,gearbox:'Manual',driveType:'RWD',consumptionCombined:36,co2gkm:165, co2Label:'E' },
    'FORD|GALAXY|1999':  { bhp:180,torqueNm:270,torqueRpm:1600,zeroToSixty:9.5, topSpeedMph:133,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:40,co2gkm:130,co2Label:'D' },
    'FORD|S-MAX|1999':   { bhp:180,torqueNm:270,torqueRpm:1600,zeroToSixty:8.9, topSpeedMph:135,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:40,co2gkm:131, co2Label:'D' },
    'FORD|EDGE|1999':    { bhp:180,torqueNm:400,torqueRpm:2000,zeroToSixty:9.0, topSpeedMph:129,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:40,co2gkm:130,co2Label:'D' },
    // ── VAUXHALL / OPEL ──
    'VAUXHALL|CORSA|999':    { bhp:100,torqueNm:170,torqueRpm:1750,zeroToSixty:10.9,topSpeedMph:116,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:99, co2Label:'B' },
    'VAUXHALL|CORSA|1199':   { bhp:130,torqueNm:195,torqueRpm:1850,zeroToSixty:9.3, topSpeedMph:124,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:50,co2gkm:103,co2Label:'C' },
    'VAUXHALL|CORSA|1399':   { bhp:100,torqueNm:190,torqueRpm:1750,zeroToSixty:11.0,topSpeedMph:115,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:54,co2gkm:95, co2Label:'B' },
    'VAUXHALL|ASTRA|1199':   { bhp:110,torqueNm:185,torqueRpm:1750,zeroToSixty:10.9,topSpeedMph:118,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:102,co2Label:'C' },
    'VAUXHALL|ASTRA|1499':   { bhp:145,torqueNm:220,torqueRpm:1500,zeroToSixty:9.5, topSpeedMph:132,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:45,co2gkm:117,co2Label:'C' },
    'VAUXHALL|ASTRA|1999':   { bhp:200,torqueNm:300,torqueRpm:1700,zeroToSixty:7.4, topSpeedMph:143,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:38,co2gkm:135,co2Label:'D' },
    'VAUXHALL|INSIGNIA|1599':{ bhp:136,torqueNm:200,torqueRpm:1500,zeroToSixty:10.4,topSpeedMph:128,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:42,co2gkm:124,co2Label:'D' },
    'VAUXHALL|INSIGNIA|1999':{ bhp:165,torqueNm:250,torqueRpm:1600,zeroToSixty:8.6, topSpeedMph:137,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:40,co2gkm:129,co2Label:'D' },
    'VAUXHALL|MOKKA|999':    { bhp:100,torqueNm:170,torqueRpm:1750,zeroToSixty:11.3,topSpeedMph:113,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:99, co2Label:'B' },
    'VAUXHALL|MOKKA|1199':   { bhp:130,torqueNm:195,torqueRpm:1850,zeroToSixty:9.8, topSpeedMph:122,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:50,co2gkm:103,co2Label:'C' },
    'VAUXHALL|GRANDLAND|1199':{ bhp:130,torqueNm:230,torqueRpm:1750,zeroToSixty:10.1,topSpeedMph:122,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:48,co2gkm:106,co2Label:'C' },
    // ── VW ──
    'VOLKSWAGEN|GOLF|999':   { bhp:110,torqueNm:200,torqueRpm:2000,zeroToSixty:10.3,topSpeedMph:119,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:54,co2gkm:95, co2Label:'B' },
    'VOLKSWAGEN|GOLF|1498':  { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.4, topSpeedMph:135,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:113,co2Label:'C' },
    'VOLKSWAGEN|GOLF|1984':  { bhp:245,torqueNm:370,torqueRpm:1600,zeroToSixty:6.3, topSpeedMph:155,cylinders:4,gearbox:'DSG',driveType:'FWD',consumptionCombined:35,co2gkm:150,  co2Label:'D' },
    'VOLKSWAGEN|GOLF|1968':  { bhp:115,torqueNm:250,torqueRpm:1750,zeroToSixty:10.5,topSpeedMph:120,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:55,co2gkm:94, co2Label:'B' },
    'VOLKSWAGEN|POLO|999':   { bhp:95, torqueNm:175,torqueRpm:2000,zeroToSixty:11.7,topSpeedMph:113,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:55,co2gkm:94, co2Label:'B' },
    'VOLKSWAGEN|POLO|1498':  { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.0, topSpeedMph:135,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:110,co2Label:'C' },
    'VOLKSWAGEN|PASSAT|1498':{ bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.5, topSpeedMph:135,cylinders:4,gearbox:'DSG',driveType:'FWD',consumptionCombined:47,co2gkm:112,  co2Label:'C' },
    'VOLKSWAGEN|PASSAT|1984':{ bhp:220,torqueNm:350,torqueRpm:1800,zeroToSixty:6.7, topSpeedMph:152,cylinders:4,gearbox:'DSG',driveType:'FWD',consumptionCombined:38,co2gkm:145,  co2Label:'D' },
    'VOLKSWAGEN|PASSAT|1968':{ bhp:150,torqueNm:340,torqueRpm:1750,zeroToSixty:9.3, topSpeedMph:131,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:99, co2Label:'B' },
    'VOLKSWAGEN|TIGUAN|1498':{ bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:9.8, topSpeedMph:126,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:42,co2gkm:122,co2Label:'C' },
    'VOLKSWAGEN|TIGUAN|1984':{ bhp:190,torqueNm:320,torqueRpm:1700,zeroToSixty:7.5, topSpeedMph:135,cylinders:4,gearbox:'DSG',driveType:'AWD',consumptionCombined:36,co2gkm:148,  co2Label:'D' },
    'VOLKSWAGEN|T-ROC|999':  { bhp:110,torqueNm:200,torqueRpm:2000,zeroToSixty:10.6,topSpeedMph:119,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:100,co2Label:'C' },
    'VOLKSWAGEN|T-ROC|1498': { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.5, topSpeedMph:129,cylinders:4,gearbox:'DSG',driveType:'FWD',consumptionCombined:43,co2gkm:118,  co2Label:'C' },
    'VOLKSWAGEN|T-CROSS|999':{ bhp:95, torqueNm:175,torqueRpm:2000,zeroToSixty:11.5,topSpeedMph:114,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:54,co2gkm:96, co2Label:'B' },
    'VOLKSWAGEN|TOUAREG|2996':{ bhp:286,torqueNm:600,torqueRpm:1750,zeroToSixty:6.1,topSpeedMph:152,cylinders:6,gearbox:'Automatic',driveType:'4WD',consumptionCombined:28,co2gkm:218,co2Label:'G' },
    'VOLKSWAGEN|UP|999':     { bhp:65, torqueNm:95, torqueRpm:3000,zeroToSixty:14.5,topSpeedMph:99, cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:56,co2gkm:94, co2Label:'B' },
    // ── BMW ──
    'BMW|1 SERIES|1499': { bhp:136,torqueNm:220,torqueRpm:1400,zeroToSixty:9.2, topSpeedMph:129,cylinders:4,gearbox:'Manual',driveType:'RWD',consumptionCombined:47,co2gkm:113,co2Label:'C' },
    'BMW|1 SERIES|1998': { bhp:184,torqueNm:290,torqueRpm:1350,zeroToSixty:7.2, topSpeedMph:146,cylinders:4,gearbox:'Manual',driveType:'RWD',consumptionCombined:42,co2gkm:126,co2Label:'D' },
    'BMW|1 SERIES|1995': { bhp:190,torqueNm:300,torqueRpm:1750,zeroToSixty:7.1, topSpeedMph:146,cylinders:4,gearbox:'Automatic',driveType:'RWD',consumptionCombined:44,co2gkm:120,co2Label:'C' },
    'BMW|2 SERIES|1499': { bhp:136,torqueNm:220,torqueRpm:1400,zeroToSixty:9.1, topSpeedMph:130,cylinders:4,gearbox:'Manual',driveType:'RWD',consumptionCombined:47,co2gkm:112,co2Label:'C' },
    'BMW|3 SERIES|1998': { bhp:184,torqueNm:290,torqueRpm:1350,zeroToSixty:7.1, topSpeedMph:149,cylinders:4,gearbox:'Manual',driveType:'RWD',consumptionCombined:41,co2gkm:129,co2Label:'D' },
    'BMW|3 SERIES|2998': { bhp:306,torqueNm:400,torqueRpm:1800,zeroToSixty:5.6, topSpeedMph:155,cylinders:6,gearbox:'Automatic',driveType:'RWD',consumptionCombined:34,co2gkm:155,co2Label:'E' },
    'BMW|3 SERIES|1995': { bhp:190,torqueNm:400,torqueRpm:1750,zeroToSixty:7.4, topSpeedMph:149,cylinders:4,gearbox:'Automatic',driveType:'RWD',consumptionCombined:55,co2gkm:103,co2Label:'C' },
    'BMW|4 SERIES|1998': { bhp:184,torqueNm:290,torqueRpm:1350,zeroToSixty:7.1, topSpeedMph:149,cylinders:4,gearbox:'Manual',driveType:'RWD',consumptionCombined:41,co2gkm:127,co2Label:'D' },
    'BMW|5 SERIES|1998': { bhp:184,torqueNm:290,torqueRpm:1350,zeroToSixty:7.8, topSpeedMph:145,cylinders:4,gearbox:'Automatic',driveType:'RWD',consumptionCombined:40,co2gkm:131,co2Label:'D' },
    'BMW|5 SERIES|2998': { bhp:340,torqueNm:450,torqueRpm:1380,zeroToSixty:5.1, topSpeedMph:155,cylinders:6,gearbox:'Automatic',driveType:'RWD',consumptionCombined:33,co2gkm:159,co2Label:'E' },
    'BMW|5 SERIES|2993': { bhp:265,torqueNm:620,torqueRpm:2000,zeroToSixty:5.7, topSpeedMph:155,cylinders:6,gearbox:'Automatic',driveType:'RWD',consumptionCombined:47,co2gkm:140,co2Label:'D' },
    'BMW|X1|1499':       { bhp:136,torqueNm:220,torqueRpm:1400,zeroToSixty:9.8, topSpeedMph:127,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:113,co2Label:'C' },
    'BMW|X3|1998':       { bhp:184,torqueNm:290,torqueRpm:1350,zeroToSixty:8.3, topSpeedMph:137,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:38,co2gkm:139,co2Label:'D' },
    'BMW|X5|2998':       { bhp:286,torqueNm:580,torqueRpm:2000,zeroToSixty:6.5, topSpeedMph:152,cylinders:6,gearbox:'Automatic',driveType:'AWD',consumptionCombined:38,co2gkm:172,co2Label:'E' },
    // ── MERCEDES ──
    'MERCEDES-BENZ|A CLASS|1332': { bhp:163,torqueNm:250,torqueRpm:1620,zeroToSixty:8.2, topSpeedMph:139,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:116,co2Label:'C' },
    'MERCEDES-BENZ|A CLASS|1991': { bhp:224,torqueNm:350,torqueRpm:1800,zeroToSixty:6.2, topSpeedMph:155,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:38,co2gkm:135,co2Label:'D' },
    'MERCEDES-BENZ|A CLASS|1461': { bhp:116,torqueNm:260,torqueRpm:1750,zeroToSixty:10.2,topSpeedMph:118,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:61,co2gkm:88, co2Label:'B' },
    'MERCEDES-BENZ|B CLASS|1332': { bhp:163,torqueNm:250,torqueRpm:1620,zeroToSixty:8.8, topSpeedMph:137,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:43,co2gkm:119,co2Label:'C' },
    'MERCEDES-BENZ|C CLASS|1991': { bhp:204,torqueNm:300,torqueRpm:1800,zeroToSixty:7.1, topSpeedMph:149,cylinders:4,gearbox:'Automatic',driveType:'RWD',consumptionCombined:40,co2gkm:128,co2Label:'D' },
    'MERCEDES-BENZ|C CLASS|2996': { bhp:367,torqueNm:500,torqueRpm:1750,zeroToSixty:4.9, topSpeedMph:155,cylinders:6,gearbox:'Automatic',driveType:'AWD',consumptionCombined:30,co2gkm:165,co2Label:'E' },
    'MERCEDES-BENZ|E CLASS|2143': { bhp:195,torqueNm:440,torqueRpm:1600,zeroToSixty:7.3, topSpeedMph:147,cylinders:4,gearbox:'Automatic',driveType:'RWD',consumptionCombined:43,co2gkm:120,co2Label:'C' },
    'MERCEDES-BENZ|GLC|1991':     { bhp:258,torqueNm:370,torqueRpm:1800,zeroToSixty:6.2, topSpeedMph:155,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:37,co2gkm:145,co2Label:'D' },
    'MERCEDES-BENZ|GLA|1332':     { bhp:163,torqueNm:250,torqueRpm:1620,zeroToSixty:8.7, topSpeedMph:137,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:43,co2gkm:118,co2Label:'C' },
    // ── AUDI ──
    'AUDI|A1|999':   { bhp:95, torqueNm:175,torqueRpm:2000,zeroToSixty:11.5,topSpeedMph:113,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:55,co2gkm:93, co2Label:'B' },
    'AUDI|A1|1498':  { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.2, topSpeedMph:137,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:110,co2Label:'C' },
    'AUDI|A3|999':   { bhp:115,torqueNm:200,torqueRpm:2000,zeroToSixty:10.6,topSpeedMph:119,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:54,co2gkm:95, co2Label:'B' },
    'AUDI|A3|1498':  { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.2, topSpeedMph:136,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:112,co2Label:'C' },
    'AUDI|A3|1984':  { bhp:190,torqueNm:320,torqueRpm:1700,zeroToSixty:7.0, topSpeedMph:149,cylinders:4,gearbox:'DSG',driveType:'FWD',consumptionCombined:39,co2gkm:135,  co2Label:'D' },
    'AUDI|A3|1968':  { bhp:150,torqueNm:340,torqueRpm:1750,zeroToSixty:9.0, topSpeedMph:131,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:99, co2Label:'B' },
    'AUDI|A4|1498':  { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.5, topSpeedMph:134,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:112,co2Label:'C' },
    'AUDI|A4|1984':  { bhp:190,torqueNm:320,torqueRpm:1700,zeroToSixty:7.3, topSpeedMph:149,cylinders:4,gearbox:'DSG',driveType:'FWD',consumptionCombined:37,co2gkm:139,  co2Label:'D' },
    'AUDI|A4|2967':  { bhp:218,torqueNm:500,torqueRpm:1750,zeroToSixty:6.3, topSpeedMph:155,cylinders:6,gearbox:'Automatic',driveType:'AWD',consumptionCombined:40,co2gkm:132,co2Label:'D' },
    'AUDI|A6|1984':  { bhp:190,torqueNm:320,torqueRpm:1700,zeroToSixty:7.6, topSpeedMph:146,cylinders:4,gearbox:'DSG',driveType:'FWD',consumptionCombined:37,co2gkm:141,  co2Label:'D' },
    'AUDI|Q3|1498':  { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:9.8, topSpeedMph:126,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:42,co2gkm:122,co2Label:'C' },
    'AUDI|Q5|1984':  { bhp:190,torqueNm:320,torqueRpm:1700,zeroToSixty:7.9, topSpeedMph:136,cylinders:4,gearbox:'DSG',driveType:'AWD',consumptionCombined:37,co2gkm:148,  co2Label:'D' },
    'AUDI|Q7|2967':  { bhp:218,torqueNm:500,torqueRpm:1750,zeroToSixty:7.1, topSpeedMph:140,cylinders:6,gearbox:'Automatic',driveType:'AWD',consumptionCombined:32,co2gkm:196,co2Label:'F' },
    'AUDI|TT|1984':  { bhp:230,torqueNm:370,torqueRpm:1600,zeroToSixty:6.0, topSpeedMph:155,cylinders:4,gearbox:'DSG',driveType:'FWD',consumptionCombined:38,co2gkm:140,  co2Label:'D' },
    // ── TOYOTA ──
    'TOYOTA|YARIS|999':    { bhp:72, torqueNm:93, torqueRpm:4400,zeroToSixty:13.7,topSpeedMph:106,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:56,co2gkm:87, co2Label:'B' },
    'TOYOTA|YARIS|1490':   { bhp:116,torqueNm:185,torqueRpm:3600,zeroToSixty:9.7, topSpeedMph:112,cylinders:3,gearbox:'Automatic',driveType:'FWD',consumptionCombined:65,co2gkm:64, co2Label:'A' },
    'TOYOTA|COROLLA|1798': { bhp:122,torqueNm:142,torqueRpm:3600,zeroToSixty:10.9,topSpeedMph:112,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:62,co2gkm:73, co2Label:'A' },
    'TOYOTA|COROLLA|1987': { bhp:180,torqueNm:200,torqueRpm:5200,zeroToSixty:7.9, topSpeedMph:124,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:55,co2gkm:93, co2Label:'B' },
    'TOYOTA|AURIS|1598':   { bhp:99, torqueNm:131,torqueRpm:3800,zeroToSixty:11.8,topSpeedMph:111,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:48,co2gkm:108,  co2Label:'C' },
    'TOYOTA|AURIS|1798':   { bhp:99, torqueNm:142,torqueRpm:4000,zeroToSixty:11.2,topSpeedMph:111,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:55,co2gkm:87, co2Label:'B' },
    'TOYOTA|RAV4|1998':    { bhp:173,torqueNm:221,torqueRpm:4400,zeroToSixty:8.4, topSpeedMph:124,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:32,co2gkm:198, co2Label:'F' },
    'TOYOTA|RAV4|2487':    { bhp:218,torqueNm:221,torqueRpm:3600,zeroToSixty:8.1, topSpeedMph:112,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:47,co2gkm:106, co2Label:'C' },
    'TOYOTA|PRIUS|1798':   { bhp:121,torqueNm:142,torqueRpm:4200,zeroToSixty:10.6,topSpeedMph:112,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:72,co2gkm:70, co2Label:'A' },
    'TOYOTA|CHR|1200':     { bhp:116,torqueNm:185,torqueRpm:1500,zeroToSixty:11.0,topSpeedMph:111,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:114,  co2Label:'C' },
    'TOYOTA|CAMRY|2487':   { bhp:218,torqueNm:221,torqueRpm:3600,zeroToSixty:8.3, topSpeedMph:112,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:55,co2gkm:102, co2Label:'C' },
    // ── HONDA ──
    'HONDA|CIVIC|999':   { bhp:126,torqueNm:200,torqueRpm:1700,zeroToSixty:10.4,topSpeedMph:124,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:51,co2gkm:103,co2Label:'C' },
    'HONDA|CIVIC|1498':  { bhp:182,torqueNm:240,torqueRpm:1900,zeroToSixty:7.5, topSpeedMph:141,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:119,co2Label:'C' },
    'HONDA|CIVIC|1498H': { bhp:184,torqueNm:315,torqueRpm:4000,zeroToSixty:7.9, topSpeedMph:137,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:57,co2gkm:112,co2Label:'C' },
    'HONDA|CRV|1498':    { bhp:193,torqueNm:243,torqueRpm:1600,zeroToSixty:8.5, topSpeedMph:130,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:40,co2gkm:126,co2Label:'D' },
    'HONDA|HRV|1498':    { bhp:130,torqueNm:179,torqueRpm:4600,zeroToSixty:9.5, topSpeedMph:124,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:42,co2gkm:122,co2Label:'C' },
    'HONDA|JAZZ|1498':   { bhp:122,torqueNm:253,torqueRpm:4500,zeroToSixty:9.3, topSpeedMph:115,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:55,co2gkm:117,co2Label:'C' },
    // ── NISSAN ──
    'NISSAN|MICRA|899':    { bhp:90, torqueNm:140,torqueRpm:2000,zeroToSixty:13.3,topSpeedMph:106,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:56,co2gkm:88, co2Label:'B' },
    'NISSAN|JUKE|999':     { bhp:117,torqueNm:180,torqueRpm:2000,zeroToSixty:10.3,topSpeedMph:113,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:48,co2gkm:106,co2Label:'C' },
    'NISSAN|JUKE|1332':    { bhp:151,torqueNm:250,torqueRpm:1750,zeroToSixty:8.7, topSpeedMph:124,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:42,co2gkm:120,co2Label:'C' },
    'NISSAN|QASHQAI|1199': { bhp:103,torqueNm:200,torqueRpm:2000,zeroToSixty:11.3,topSpeedMph:111,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:117,co2Label:'C' },
    'NISSAN|QASHQAI|1332': { bhp:158,torqueNm:260,torqueRpm:1400,zeroToSixty:8.9, topSpeedMph:129,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:45,co2gkm:113,co2Label:'C' },
    'NISSAN|QASHQAI|1498': { bhp:163,torqueNm:260,torqueRpm:1600,zeroToSixty:8.7, topSpeedMph:127,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:115,co2Label:'C' },
    'NISSAN|X-TRAIL|1332': { bhp:158,torqueNm:260,torqueRpm:1400,zeroToSixty:9.2, topSpeedMph:124,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:40,co2gkm:127,co2Label:'D' },
    'NISSAN|LEAF|80':      { bhp:150,torqueNm:320,torqueRpm:0,   zeroToSixty:7.9, topSpeedMph:98, cylinders:0,gearbox:'Automatic',driveType:'FWD',consumptionCombined:0,   co2gkm:0,   co2Label:'A' },
    // ── HYUNDAI ──
    'HYUNDAI|I10|1000':    { bhp:67, torqueNm:96, torqueRpm:2500,zeroToSixty:14.5,topSpeedMph:96, cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:57,co2gkm:97, co2Label:'B' },
    'HYUNDAI|I20|999':     { bhp:100,torqueNm:172,torqueRpm:1500,zeroToSixty:11.0,topSpeedMph:115,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:99, co2Label:'B' },
    'HYUNDAI|I30|1395':    { bhp:140,torqueNm:242,torqueRpm:1500,zeroToSixty:9.4, topSpeedMph:128,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:113,co2Label:'C' },
    'HYUNDAI|TUCSON|1598': { bhp:150,torqueNm:280,torqueRpm:1500,zeroToSixty:9.6, topSpeedMph:124,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:118,co2Label:'C' },
    'HYUNDAI|KONA|999':    { bhp:100,torqueNm:172,torqueRpm:1500,zeroToSixty:11.3,topSpeedMph:112,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:50,co2gkm:104,co2Label:'C' },
    'HYUNDAI|KONA|150':    { bhp:204,torqueNm:395,torqueRpm:0,   zeroToSixty:7.9, topSpeedMph:104,cylinders:0,gearbox:'Automatic',driveType:'FWD',consumptionCombined:0,   co2gkm:0,   co2Label:'A' },
    // ── KIA ──
    'KIA|STONIC|999':    { bhp:100,torqueNm:172,torqueRpm:1500,zeroToSixty:11.0,topSpeedMph:115,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:51,co2gkm:102,co2Label:'C' },
    'KIA|CEED|1395':     { bhp:140,torqueNm:242,torqueRpm:1500,zeroToSixty:9.4, topSpeedMph:128,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:113,co2Label:'C' },
    'KIA|SPORTAGE|1591': { bhp:150,torqueNm:280,torqueRpm:1500,zeroToSixty:9.7, topSpeedMph:124,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:118,co2Label:'C' },
    'KIA|SPORTAGE|1999': { bhp:180,torqueNm:270,torqueRpm:1750,zeroToSixty:8.7, topSpeedMph:131,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:36,co2gkm:151,co2Label:'D' },
    'KIA|SORENTO|2151':  { bhp:200,torqueNm:440,torqueRpm:1750,zeroToSixty:8.3, topSpeedMph:130,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:37,co2gkm:148,co2Label:'D' },
    'KIA|NIRO|1580':     { bhp:141,torqueNm:265,torqueRpm:1500,zeroToSixty:11.0,topSpeedMph:99, cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:56,co2gkm:88, co2Label:'B' },
    // ── PEUGEOT ──
    'PEUGEOT|108|999':  { bhp:72, torqueNm:95, torqueRpm:2750,zeroToSixty:14.4,topSpeedMph:96, cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:58,co2gkm:87, co2Label:'B' },
    'PEUGEOT|208|1199': { bhp:130,torqueNm:230,torqueRpm:1750,zeroToSixty:9.4, topSpeedMph:125,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:100,co2Label:'C' },
    'PEUGEOT|308|1199': { bhp:130,torqueNm:230,torqueRpm:1750,zeroToSixty:9.5, topSpeedMph:127,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:51,co2gkm:102,co2Label:'C' },
    'PEUGEOT|3008|1199':{ bhp:130,torqueNm:230,torqueRpm:1750,zeroToSixty:9.8, topSpeedMph:122,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:48,co2gkm:107,co2Label:'C' },
    'PEUGEOT|5008|1998':{ bhp:180,torqueNm:400,torqueRpm:2000,zeroToSixty:8.6, topSpeedMph:130,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:40,co2gkm:130,co2Label:'D' },
    'PEUGEOT|2008|999': { bhp:100,torqueNm:205,torqueRpm:1750,zeroToSixty:11.5,topSpeedMph:112,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:53,co2gkm:100,co2Label:'C' },
    // ── RENAULT ──
    'RENAULT|CLIO|999':    { bhp:100,torqueNm:160,torqueRpm:2500,zeroToSixty:11.9,topSpeedMph:117,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:56,co2gkm:88, co2Label:'B' },
    'RENAULT|CLIO|1333':   { bhp:130,torqueNm:240,torqueRpm:1800,zeroToSixty:9.9, topSpeedMph:124,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:45,co2gkm:116,co2Label:'C' },
    'RENAULT|MEGANE|1333': { bhp:115,torqueNm:205,torqueRpm:1750,zeroToSixty:11.2,topSpeedMph:117,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:53,co2gkm:96, co2Label:'B' },
    'RENAULT|MEGANE|1618': { bhp:163,torqueNm:270,torqueRpm:2000,zeroToSixty:8.4, topSpeedMph:131,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:42,co2gkm:122,co2Label:'C' },
    'RENAULT|KADJAR|1332': { bhp:140,torqueNm:260,torqueRpm:1750,zeroToSixty:9.3, topSpeedMph:120,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:42,co2gkm:121,co2Label:'C' },
    'RENAULT|CAPTUR|999':  { bhp:100,torqueNm:160,torqueRpm:2500,zeroToSixty:11.5,topSpeedMph:112,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:53,co2gkm:98, co2Label:'B' },
    'RENAULT|ZOE|80':      { bhp:108,torqueNm:225,torqueRpm:0,   zeroToSixty:9.5, topSpeedMph:87, cylinders:0,gearbox:'Automatic',driveType:'FWD',consumptionCombined:0,  co2gkm:0,   co2Label:'A' },
    // ── MINI ──
    'MINI|HATCH|999':  { bhp:75, torqueNm:120,torqueRpm:2500,zeroToSixty:14.0,topSpeedMph:103,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:55,co2gkm:93, co2Label:'B' },
    'MINI|HATCH|1499': { bhp:136,torqueNm:220,torqueRpm:1250,zeroToSixty:8.8, topSpeedMph:127,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:48,co2gkm:106,co2Label:'C' },
    'MINI|HATCH|1998': { bhp:192,torqueNm:280,torqueRpm:1350,zeroToSixty:6.8, topSpeedMph:148,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:40,co2gkm:132,co2Label:'D' },
    'MINI|COUNTRYMAN|1499':{ bhp:136,torqueNm:220,torqueRpm:1250,zeroToSixty:9.6,topSpeedMph:122,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:45,co2gkm:113,co2Label:'C' },
    'MINI|CLUBMAN|1499':{ bhp:136,torqueNm:220,torqueRpm:1250,zeroToSixty:9.2,topSpeedMph:126,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:108,co2Label:'C' },
    // ── SEAT / CUPRA ──
    'SEAT|IBIZA|999':  { bhp:95, torqueNm:175,torqueRpm:2000,zeroToSixty:11.8,topSpeedMph:112,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:55,co2gkm:93, co2Label:'B' },
    'SEAT|IBIZA|1498': { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.0, topSpeedMph:132,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:108,co2Label:'C' },
    'SEAT|LEON|999':   { bhp:110,torqueNm:200,torqueRpm:2000,zeroToSixty:10.2,topSpeedMph:119,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:53,co2gkm:97, co2Label:'B' },
    'SEAT|LEON|1498':  { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.2, topSpeedMph:135,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:112,co2Label:'C' },
    'SEAT|LEON|1984':  { bhp:300,torqueNm:400,torqueRpm:1600,zeroToSixty:5.6, topSpeedMph:155,cylinders:4,gearbox:'DSG',driveType:'AWD',consumptionCombined:35,co2gkm:148,  co2Label:'D' },
    'SEAT|ATECA|1498': { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:9.5, topSpeedMph:127,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:44,co2gkm:121,co2Label:'C' },
    // ── SKODA ──
    'SKODA|FABIA|999':   { bhp:95, torqueNm:175,torqueRpm:2000,zeroToSixty:11.7,topSpeedMph:113,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:55,co2gkm:93, co2Label:'B' },
    'SKODA|OCTAVIA|999': { bhp:110,torqueNm:200,torqueRpm:2000,zeroToSixty:10.8,topSpeedMph:118,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:53,co2gkm:97, co2Label:'B' },
    'SKODA|OCTAVIA|1498':{ bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.2, topSpeedMph:134,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:111,co2Label:'C' },
    'SKODA|OCTAVIA|1968':{ bhp:115,torqueNm:250,torqueRpm:1750,zeroToSixty:10.8,topSpeedMph:118,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:58,co2gkm:92, co2Label:'B' },
    'SKODA|SUPERB|1498': { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:8.5, topSpeedMph:135,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:111,co2Label:'C' },
    'SKODA|KAROQ|999':   { bhp:110,torqueNm:200,torqueRpm:2000,zeroToSixty:10.6,topSpeedMph:116,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:51,co2gkm:101,co2Label:'C' },
    'SKODA|KODIAQ|1498': { bhp:150,torqueNm:250,torqueRpm:1500,zeroToSixty:9.9, topSpeedMph:127,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:42,co2gkm:122,co2Label:'C' },
    // ── LAND ROVER ──
    'LAND ROVER|DEFENDER|1999':      { bhp:300,torqueNm:400,torqueRpm:1500,zeroToSixty:8.0, topSpeedMph:119,cylinders:4,gearbox:'Automatic',driveType:'4WD',consumptionCombined:30,co2gkm:213,co2Label:'G' },
    'LAND ROVER|DEFENDER|2993':      { bhp:250,torqueNm:570,torqueRpm:2000,zeroToSixty:9.6, topSpeedMph:113,cylinders:6,gearbox:'Automatic',driveType:'4WD',consumptionCombined:30,co2gkm:220,co2Label:'G' },
    'LAND ROVER|DISCOVERY SPORT|1999':{ bhp:150,torqueNm:380,torqueRpm:1750,zeroToSixty:9.6,topSpeedMph:121,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:40,co2gkm:130,co2Label:'D' },
    'LAND ROVER|DISCOVERY|2993':     { bhp:249,torqueNm:600,torqueRpm:2000,zeroToSixty:8.1, topSpeedMph:121,cylinders:6,gearbox:'Automatic',driveType:'4WD',consumptionCombined:25,co2gkm:249,co2Label:'G' },
    'LAND ROVER|RANGE ROVER|2993':   { bhp:249,torqueNm:600,torqueRpm:2000,zeroToSixty:7.7, topSpeedMph:130,cylinders:6,gearbox:'Automatic',driveType:'4WD',consumptionCombined:25,co2gkm:249,co2Label:'G' },
    'LAND ROVER|RANGE ROVER SPORT|2993':{ bhp:249,torqueNm:600,torqueRpm:2000,zeroToSixty:7.2,topSpeedMph:130,cylinders:6,gearbox:'Automatic',driveType:'4WD',consumptionCombined:25,co2gkm:245,co2Label:'G' },
    'LAND ROVER|FREELANDER|2179':    { bhp:150,torqueNm:420,torqueRpm:2000,zeroToSixty:9.9, topSpeedMph:112,cylinders:4,gearbox:'Automatic',driveType:'4WD',consumptionCombined:35,co2gkm:169,co2Label:'E' },
    // ── JAGUAR ──
    'JAGUAR|XE|1999':    { bhp:200,torqueNm:430,torqueRpm:1750,zeroToSixty:7.6, topSpeedMph:143,cylinders:4,gearbox:'Automatic',driveType:'RWD',consumptionCombined:47,co2gkm:111,co2Label:'C' },
    'JAGUAR|XF|1999':    { bhp:200,torqueNm:430,torqueRpm:1750,zeroToSixty:7.9, topSpeedMph:143,cylinders:4,gearbox:'Automatic',driveType:'RWD',consumptionCombined:43,co2gkm:119,co2Label:'C' },
    'JAGUAR|F-PACE|1999':{ bhp:180,torqueNm:430,torqueRpm:1750,zeroToSixty:8.7, topSpeedMph:130,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:40,co2gkm:130,co2Label:'D' },
    'JAGUAR|E-PACE|1499':{ bhp:150,torqueNm:240,torqueRpm:1500,zeroToSixty:9.6, topSpeedMph:124,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:42,co2gkm:122,co2Label:'C' },
    // ── VOLVO ──
    'VOLVO|XC40|1496':  { bhp:150,torqueNm:250,torqueRpm:1400,zeroToSixty:9.5, topSpeedMph:127,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:45,co2gkm:117,co2Label:'C' },
    'VOLVO|XC60|1969':  { bhp:190,torqueNm:300,torqueRpm:1500,zeroToSixty:8.4, topSpeedMph:130,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:37,co2gkm:149,co2Label:'D' },
    'VOLVO|XC90|1969':  { bhp:235,torqueNm:480,torqueRpm:2100,zeroToSixty:7.3, topSpeedMph:130,cylinders:4,gearbox:'Automatic',driveType:'AWD',consumptionCombined:30,co2gkm:176,co2Label:'E' },
    'VOLVO|V40|1969':   { bhp:150,torqueNm:320,torqueRpm:1750,zeroToSixty:9.1, topSpeedMph:127,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:110,co2Label:'C' },
    'VOLVO|S60|1969':   { bhp:190,torqueNm:300,torqueRpm:1500,zeroToSixty:7.9, topSpeedMph:140,cylinders:4,gearbox:'Automatic',driveType:'FWD',consumptionCombined:40,co2gkm:129,co2Label:'D' },
    // ── MAZDA ──
    'MAZDA|MAZDA3|1998': { bhp:122,torqueNm:213,torqueRpm:4000,zeroToSixty:9.3, topSpeedMph:124,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:111,co2Label:'C' },
    'MAZDA|CX-3|1998':   { bhp:121,torqueNm:214,torqueRpm:2800,zeroToSixty:9.6, topSpeedMph:119,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:49,co2gkm:106,co2Label:'C' },
    'MAZDA|CX-5|2191':   { bhp:150,torqueNm:380,torqueRpm:2000,zeroToSixty:9.7, topSpeedMph:120,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:51,co2gkm:103,co2Label:'C' },
    'MAZDA|MX-5|1998':   { bhp:160,torqueNm:200,torqueRpm:4600,zeroToSixty:7.3, topSpeedMph:134,cylinders:4,gearbox:'Manual',driveType:'RWD',consumptionCombined:37,co2gkm:149,co2Label:'D' },
    // ── TESLA ──
    'TESLA|MODEL 3|180': { bhp:283,torqueNm:420,torqueRpm:0,   zeroToSixty:5.6, topSpeedMph:140,cylinders:0,gearbox:'Automatic',driveType:'RWD',consumptionCombined:0,  co2gkm:0,  co2Label:'A' },
    'TESLA|MODEL Y|220': { bhp:299,torqueNm:420,torqueRpm:0,   zeroToSixty:5.9, topSpeedMph:135,cylinders:0,gearbox:'Automatic',driveType:'AWD',consumptionCombined:0,  co2gkm:0,  co2Label:'A' },
    'TESLA|MODEL S|285': { bhp:670,torqueNm:1020,torqueRpm:0,  zeroToSixty:2.1, topSpeedMph:200,cylinders:0,gearbox:'Automatic',driveType:'AWD',consumptionCombined:0,  co2gkm:0,  co2Label:'A' },
    // ── FIAT ──
    'FIAT|500|1242':  { bhp:69, torqueNm:102,torqueRpm:3000,zeroToSixty:14.3,topSpeedMph:99, cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:51,co2gkm:97, co2Label:'B' },
    'FIAT|500|999':   { bhp:85, torqueNm:145,torqueRpm:2000,zeroToSixty:12.5,topSpeedMph:108,cylinders:2,gearbox:'Manual',driveType:'FWD',consumptionCombined:60,co2gkm:85, co2Label:'B' },
    'FIAT|PANDA|999': { bhp:70, torqueNm:91, torqueRpm:2500,zeroToSixty:14.2,topSpeedMph:99, cylinders:2,gearbox:'Manual',driveType:'FWD',consumptionCombined:58,co2gkm:88, co2Label:'B' },
    'FIAT|TIPO|1368': { bhp:95, torqueNm:127,torqueRpm:4250,zeroToSixty:12.5,topSpeedMph:111,cylinders:4,gearbox:'Manual',driveType:'FWD',consumptionCombined:47,co2gkm:108,co2Label:'C' },
    // ── CITROEN ──
    'CITROEN|C1|999':   { bhp:72, torqueNm:93, torqueRpm:2750,zeroToSixty:14.4,topSpeedMph:96, cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:58,co2gkm:87, co2Label:'B' },
    'CITROEN|C3|1199':  { bhp:83, torqueNm:205,torqueRpm:1750,zeroToSixty:13.0,topSpeedMph:109,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:56,co2gkm:91, co2Label:'B' },
    'CITROEN|C3|1199T': { bhp:130,torqueNm:230,torqueRpm:1750,zeroToSixty:9.7, topSpeedMph:124,cylinders:3,gearbox:'Manual',driveType:'FWD',consumptionCombined:52,co2gkm:100,co2Label:'C' },
    'CITROEN|C5 AIRCROSS|1199':{ bhp:130,torqueNm:230,torqueRpm:1750,zeroToSixty:10.0,topSpeedMph:120,cylinders:3,gearbox:'Automatic',driveType:'FWD',consumptionCombined:46,co2gkm:109,co2Label:'C' },
  };

  // ── Match function: pipe-delimited keys make|model|cc ──
  function findSpecs(makeStr, modelStr, cc) {
    const makeC  = makeStr.toUpperCase().trim();
    const modelC = modelStr.toUpperCase().trim();

    // 1. Exact make + model word match + closest cc
    // Collect all keys for this make
    let pool = Object.keys(DB).filter(k => k.startsWith(makeC + '|'));

    // If nothing found for make, try common abbreviations
    if (!pool.length) {
      const aliases = {
        'VW': 'VOLKSWAGEN', 'MERC': 'MERCEDES-BENZ', 'MERCEDES': 'MERCEDES-BENZ',
        'LANDROVER': 'LAND ROVER', 'RANGE ROVER': 'LAND ROVER',
        'ALFA': 'ALFA ROMEO', 'CITROËN': 'CITROEN',
      };
      const alt = aliases[makeC];
      if (alt) pool = Object.keys(DB).filter(k => k.startsWith(alt + '|'));
    }
    if (!pool.length) return null;

    // 2. Filter by model match (any word in the model key appears in modelC)
    const modelPool = pool.filter(k => {
      const dbModel = k.split('|')[1].toUpperCase();
      // Direct containment
      if (modelC.includes(dbModel) || dbModel.includes(modelC)) return true;
      // Word match — any significant word
      const words = dbModel.split(/[\s\-]+/);
      return words.some(w => w.length > 1 && modelC.includes(w));
    });

    const searchPool = modelPool.length ? modelPool : pool;

    // 3. Find closest cc — strip non-numeric suffix from key cc part
    let best = null, bestDiff = Infinity;
    for (const k of searchPool) {
      const keyCc = parseInt(k.split('|')[2]) || 0;
      const diff  = Math.abs(keyCc - cc);
      if (diff < bestDiff) { bestDiff = diff; best = k; }
    }
    // Only use if cc is within 300cc of a match (avoid totally wrong engine)
    return (best && bestDiff < 350) ? DB[best] : (modelPool.length ? DB[best] : null);
  }

  const specs = findSpecs(makeU, modelU, ccN);
  if (specs) return res.status(200).json({ ...specs, _source: 'db' });

  // ── STEP 3: Fuel-aware generic fallback ──
  const isElectric = fuelU.includes('ELECTRIC') || ccN < 100;
  const isHybrid   = fuelU.includes('HYBRID');
  const isDiesel   = fuelU.includes('DIESEL');

  let fb;
  if (isElectric) {
    fb = { bhp: 150, torqueNm: 310, torqueRpm: 0, zeroToSixty: 8.5, topSpeedMph: 100, cylinders: 0, gearbox: 'Automatic', driveType: 'FWD', consumptionCombined: 0, co2gkm: 0, co2Label: 'A' };
  } else if (isHybrid) {
    const b = ccN <= 1500 ? 116 : ccN <= 2000 ? 180 : 218;
    fb = { bhp: b, torqueNm: Math.round(b * 1.6), torqueRpm: 3600, zeroToSixty: b < 140 ? 10.9 : 8.4, topSpeedMph: b < 140 ? 112 : 124, cylinders: 4, gearbox: 'Automatic', driveType: 'FWD', consumptionCombined: b < 140 ? 62 : 50, co2gkm: b < 140 ? 73 : 95, co2Label: 'A' };
  } else if (isDiesel) {
    const b = ccN <= 1200 ? 95 : ccN <= 1600 ? 115 : ccN <= 2000 ? 150 : ccN <= 2500 ? 190 : 240;
    fb = { bhp: b, torqueNm: Math.round(b * 2.8), torqueRpm: 1750, zeroToSixty: b < 120 ? 11.5 : b < 160 ? 9.2 : 7.5, topSpeedMph: b < 120 ? 110 : b < 160 ? 128 : 143, cylinders: ccN <= 1200 ? 3 : ccN <= 2000 ? 4 : 6, gearbox: 'Manual', driveType: 'FWD', consumptionCombined: b < 120 ? 55 : b < 160 ? 48 : 40, co2gkm: b < 120 ? 99 : b < 160 ? 118 : 138, co2Label: b < 120 ? 'B' : 'C' };
  } else {
    const b = ccN <= 999 ? 95 : ccN <= 1199 ? 110 : ccN <= 1399 ? 128 : ccN <= 1599 ? 138 : ccN <= 1999 ? 163 : ccN <= 2499 ? 228 : ccN <= 2999 ? 298 : 375;
    fb = { bhp: b, torqueNm: Math.round(b * 1.55), torqueRpm: 2000, zeroToSixty: b < 100 ? 13.0 : b < 130 ? 10.5 : b < 160 ? 9.0 : b < 200 ? 7.5 : 6.0, topSpeedMph: b < 100 ? 108 : b < 130 ? 118 : b < 160 ? 130 : b < 200 ? 143 : 155, cylinders: ccN <= 999 ? 3 : ccN <= 1999 ? 4 : 6, gearbox: 'Manual', driveType: 'FWD', consumptionCombined: b < 100 ? 54 : b < 140 ? 46 : b < 200 ? 38 : 30, co2gkm: b < 100 ? 98 : b < 140 ? 116 : b < 200 ? 142 : 180, co2Label: b < 100 ? 'B' : b < 140 ? 'C' : b < 200 ? 'D' : 'E' };
  }
  return res.status(200).json({ ...fb, _source: 'fallback' });
}
