export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const raw = ((req.body || {}).reg || req.query.reg || '').replace(/\s/g, '').toUpperCase();
  if (!raw || raw.length < 2) return res.status(400).json({ error: 'No reg' });

  const out = { reg: raw, stolen: null, finance: null, writeOff: null, keepers: null };

  const H = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
  };

  async function get(url) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(url, { headers: H, signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) return null;
      return await r.text();
    } catch { return null; }
  }

  // isitnicked.com — ONLY for stolen check
  // Look for very specific result phrases only (not site navigation text)
  const nikd = await get('https://www.isitnicked.com/?q=' + raw)
    || await get('https://www.isitnicked.com/check/' + raw)
    || await get('https://www.isitnicked.com/results/?vrm=' + raw);

  if (nikd) {
    // Only trust very explicit result phrases — not generic site text
    const bodyOnly = nikd.replace(/<nav[\s\S]*?<\/nav>/gi, '').replace(/<header[\s\S]*?<\/header>/gi, '').replace(/<footer[\s\S]*?<\/footer>/gi, '');
    if (/this vehicle has not been reported (as )?stolen/i.test(bodyOnly)) out.stolen = false;
    else if (/this vehicle has been reported (as )?stolen/i.test(bodyOnly)) out.stolen = true;
    else if (/not.*?nicked|not been nicked|not stolen/i.test(bodyOnly)) out.stolen = false;
    else if (/has been nicked|is stolen|recorded as stolen/i.test(bodyOnly)) out.stolen = true;
    // anything ambiguous → stays null (unverified)
  }

  // carcheck.co.uk — backup stolen + finance + write-off
  // Strip nav/header/footer before parsing to avoid false positives
  const ck = await get('https://www.carcheck.co.uk/' + raw);
  if (ck) {
    const body = ck.replace(/<(nav|header|footer|script|style|meta)[\s\S]*?<\/\1>/gi, '');

    if (out.stolen === null) {
      if (/not.*?reported.*?stolen|no stolen|not stolen|clear.*?stolen/i.test(body)) out.stolen = false;
      else if (/reported stolen|is stolen|vehicle stolen/i.test(body)) out.stolen = true;
    }

    // Finance — only trust explicit result text
    if (/no outstanding finance|no finance recorded|finance.*?clear|not subject to finance/i.test(body)) out.finance = false;
    else if (/outstanding finance found|subject to finance agreement|vehicle has finance/i.test(body)) out.finance = true;

    // Write-off — specific category patterns
    const cat = body.match(/insurance write.?off[^>]*>\s*(?:category\s*)?([ABCSN])\b/i)
      || body.match(/written off.*?categor[y\w]+\s*([ABCSN])\b/i)
      || body.match(/category\s+([ABCSN])\s+write/i);
    if (cat) out.writeOff = 'CAT ' + cat[1].toUpperCase();
    else if (/no write.?off|not written off|no insurance loss record/i.test(body)) out.writeOff = 'NONE';

    // Keepers
    const kp = body.match(/(\d+)\s+(?:previous\s+)?keeper/i);
    if (kp) out.keepers = parseInt(kp[1]);
  }

  return res.status(200).json(out);
}
