export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const reg = ((body.reg || req.query.reg || '')).replace(/\s/g, '').toUpperCase();
  if (!reg || reg.length < 2) return res.status(400).json({ error: 'No reg' });

  const H = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
    'Accept-Language': 'en-GB,en;q=0.9',
  };

  const out = { reg, stolen: null, finance: null, writeOff: null, keepers: null, source: [] };

  async function tryFetch(url, timeout) {
    try {
      const r = await fetch(url, { headers: H, signal: AbortSignal.timeout ? AbortSignal.timeout(timeout || 6000) : undefined });
      return r.ok ? await r.text() : null;
    } catch(e) { return null; }
  }

  /* 1 — nicked.co.uk: stolen check */
  const nk = await tryFetch('https://www.nicked.co.uk/results/?vrm=' + reg, 6000);
  if (nk) {
    if (/not been reported stolen/i.test(nk)) { out.stolen = false; out.source.push('nicked.co.uk'); }
    else if (/has been reported stolen|recorded as stolen|vehicle.*stolen/i.test(nk)) { out.stolen = true; out.source.push('nicked.co.uk'); }
  }

  /* 2 — totalcarcheck.co.uk: finance, write-off, keepers */
  const tc = await tryFetch('https://www.totalcarcheck.co.uk/' + reg, 8000);
  if (tc) {
    if (out.stolen === null) {
      if (/not.*?stolen|no stolen|stolen.*?no|clear.*?stolen/i.test(tc)) { out.stolen = false; out.source.push('totalcarcheck'); }
      else if (/stolen.*?yes|reported stolen|subject.*?stolen/i.test(tc)) { out.stolen = true; out.source.push('totalcarcheck'); }
    }
    if (/no finance|finance.*?clear|no outstanding finance|not.*?subject.*?finance/i.test(tc)) { out.finance = false; if (!out.source.includes('totalcarcheck')) out.source.push('totalcarcheck'); }
    else if (/subject.*?finance|outstanding finance|finance.*?yes|hp.*?outstanding/i.test(tc)) { out.finance = true; if (!out.source.includes('totalcarcheck')) out.source.push('totalcarcheck'); }
    const cat = tc.match(/categor(?:y|ised)[^\w]*([ABCSN])\b/i);
    if (cat) { out.writeOff = 'CAT ' + cat[1].toUpperCase(); }
    else if (/no write.?off|not.*?write.?off|no loss|no insurance/i.test(tc)) { out.writeOff = 'NONE'; }
    const kp = tc.match(/(\d+)\s*(?:previous\s*)?keepers?/i);
    if (kp) out.keepers = parseInt(kp[1]);
  }

  /* 3 — vehiclesmart.co.uk: backup stolen */
  if (out.stolen === null) {
    const vs = await tryFetch('https://www.vehiclesmart.co.uk/free-car-check/' + reg, 6000);
    if (vs) {
      if (/not.*?stolen|no.*?stolen/i.test(vs)) { out.stolen = false; out.source.push('vehiclesmart'); }
      else if (/is stolen|reported stolen/i.test(vs)) { out.stolen = true; out.source.push('vehiclesmart'); }
    }
  }

  return res.status(200).json(out);
}
