export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const raw = body.reg || req.query.reg || '';
  const reg = raw.replace(/\s/g, '').toUpperCase();
  if (!reg || reg.length < 2) return res.status(400).json({ error: 'No reg' });

  const H = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Referer': 'https://www.google.com/',
    'Connection': 'keep-alive',
  };

  const out = {
    reg,
    stolen: null,
    finance: null,
    writeOff: null,
    keepers: null,
    colour: null,
    exported: null,
    sources: []
  };

  async function get(url, ms) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms || 7000);
      const r = await fetch(url, { headers: H, signal: ctrl.signal });
      clearTimeout(t);
      return r.ok ? await r.text() : null;
    } catch { return null; }
  }

  /* ── isitnicked.com — primary stolen + full check ── */
  const urls1 = [
    `https://www.isitnicked.com/?q=${reg}`,
    `https://www.isitnicked.com/check/${reg}`,
    `https://www.isitnicked.com/results/${reg}`,
    `https://www.isitnicked.com/car-check/${reg}`,
  ];

  for (const url of urls1) {
    const html = await get(url, 8000);
    if (!html) continue;

    /* stolen */
    if (out.stolen === null) {
      if (/not.*?stolen|not been reported|no.*?stolen record|clear.*?stolen/i.test(html)) {
        out.stolen = false; out.sources.push('isitnicked.com');
      } else if (/is stolen|has been reported stolen|vehicle.*?stolen|nicked/i.test(html)) {
        out.stolen = true; out.sources.push('isitnicked.com');
      }
    }
    /* finance */
    if (out.finance === null) {
      if (/no.*?outstanding finance|finance.*?clear|not.*?subject.*?finance/i.test(html)) out.finance = false;
      else if (/outstanding finance|subject.*?finance|hp.*?outstanding|finance.*?yes/i.test(html)) out.finance = true;
    }
    /* write-off */
    if (!out.writeOff) {
      const cat = html.match(/categor(?:y|ised)[^\w]*([ABCSN])\b/i);
      if (cat) out.writeOff = 'CAT ' + cat[1].toUpperCase();
      else if (/no write.?off|not.*?write.?off|no insurance loss|write.?off.*?no/i.test(html)) out.writeOff = 'NONE';
    }
    /* keepers */
    if (!out.keepers) {
      const kp = html.match(/(\d+)\s*(?:previous\s*)?keepers?/i);
      if (kp) out.keepers = parseInt(kp[1]);
    }
    /* colour */
    if (!out.colour) {
      const col = html.match(/colou?r[:\s]+([a-z]+)/i);
      if (col) out.colour = col[1].toUpperCase();
    }

    if (out.stolen !== null) break;
  }

  /* ── totalcarcheck.co.uk — backup ── */
  if (out.stolen === null || out.finance === null || !out.writeOff) {
    const tc = await get(`https://www.totalcarcheck.co.uk/${reg}`, 8000);
    if (tc) {
      if (out.stolen === null) {
        if (/not.*?stolen|no stolen|stolen.*?no|clear.*?stolen/i.test(tc)) { out.stolen = false; out.sources.push('totalcarcheck'); }
        else if (/stolen.*?yes|reported stolen|subject.*?stolen/i.test(tc)) { out.stolen = true; out.sources.push('totalcarcheck'); }
      }
      if (out.finance === null) {
        if (/no finance|finance.*?clear|no outstanding finance|not.*?subject.*?finance/i.test(tc)) out.finance = false;
        else if (/subject.*?finance|outstanding finance|finance.*?yes/i.test(tc)) out.finance = true;
      }
      if (!out.writeOff) {
        const cat2 = tc.match(/categor(?:y|ised)[^\w]*([ABCSN])\b/i);
        if (cat2) out.writeOff = 'CAT ' + cat2[1].toUpperCase();
        else if (/no write.?off|not.*?write.?off|no insurance loss/i.test(tc)) out.writeOff = 'NONE';
      }
      if (!out.keepers) {
        const kp2 = tc.match(/(\d+)\s*(?:previous\s*)?keepers?/i);
        if (kp2) out.keepers = parseInt(kp2[1]);
      }
    }
  }

  /* ── vehiclesmart.co.uk — backup stolen only ── */
  if (out.stolen === null) {
    const vs = await get(`https://www.vehiclesmart.co.uk/free-car-check/${reg}`, 6000);
    if (vs) {
      if (/not.*?stolen|no.*?stolen/i.test(vs)) { out.stolen = false; out.sources.push('vehiclesmart'); }
      else if (/is stolen|reported stolen/i.test(vs)) { out.stolen = true; out.sources.push('vehiclesmart'); }
    }
  }

  return res.status(200).json(out);
}
