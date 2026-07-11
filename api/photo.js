const NINJA_KEY = process.env.NINJA_API_KEY || 'WeMnxdGjK00FQeHxNs9cMSf780diF0CjKYLtSdOR';

// Per-make fallback (only used if nothing more specific can be found)
const PHOTOS = {
  'FORD':'photo-1494976388531-d1058494cdd8','VOLKSWAGEN':'photo-1502877338535-766e1452684a','VW':'photo-1502877338535-766e1452684a',
  'BMW':'photo-1555215695-3004980ad54e','MERCEDES':'photo-1618843479313-40f8afb4b4d8','MERCEDES-BENZ':'photo-1618843479313-40f8afb4b4d8',
  'AUDI':'photo-1606016159991-dfe4f2746ad5','TOYOTA':'photo-1559416523-140ddc3d238c','HONDA':'photo-1568605117036-5fe5e7bab0b7',
  'VAUXHALL':'photo-1533473359331-0135ef1b58bf','NISSAN':'photo-1609521263047-f8f205293f24','RENAULT':'photo-1541443131876-44b03de101c5',
  'PEUGEOT':'photo-1471444928139-48c5bf5173f8','CITROEN':'photo-1471444928139-48c5bf5173f8','HYUNDAI':'photo-1605559424843-9e4c228bf1c2',
  'KIA':'photo-1619767886558-efdc259cde1a','MAZDA':'photo-1580274455191-1c62238fa333','VOLVO':'photo-1485291571150-772bcfc10da5',
  'LAND ROVER':'photo-1519641471654-76ce0107ad5b','JAGUAR':'photo-1494976388531-d1058494cdd8','PORSCHE':'photo-1503376780353-7e6692767b70',
  'TESLA':'photo-1560958089-b8a1929cea89','MINI':'photo-1543465077-db45d34b88a5','SKODA':'photo-1502877338535-766e1452684a',
  'SEAT':'photo-1502877338535-766e1452684a','FIAT':'photo-1541443131876-44b03de101c5','SUBARU':'photo-1494976388531-d1058494cdd8',
  'MITSUBISHI':'photo-1519641471654-76ce0107ad5b','SUZUKI':'photo-1471444928139-48c5bf5173f8','LEXUS':'photo-1555215695-3004980ad54e',
  'JEEP':'photo-1519641471654-76ce0107ad5b','DACIA':'photo-1533473359331-0135ef1b58bf','MG':'photo-1494976388531-d1058494cdd8',
  'ALFA ROMEO':'photo-1503376780353-7e6692767b70','DEFAULT':'photo-1494976388531-d1058494cdd8',
};

async function guessModelFromNinja(make, year, cc) {
  try {
    const p = new URLSearchParams({ make: make.toLowerCase(), limit: '1' });
    if (year) p.set('year', String(year));
    const r = await fetch(`https://api.api-ninjas.com/v1/cars?${p}`, { headers: { 'X-Api-Key': NINJA_KEY } });
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return null;
    // pick closest displacement match if cc given, else just the first result
    if (cc) {
      const target = cc / 1000;
      data.sort((a, b) => Math.abs((a.displacement || 99) - target) - Math.abs((b.displacement || 99) - target));
    }
    return data[0]?.model || null;
  } catch { return null; }
}

async function wikiPhoto(make, model) {
  if (!model || model.length < 2) return null;
  const title = `${make} ${model}`;
  try {
    const r = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=900&redirects=1&origin=*`
    );
    if (!r.ok) return null;
    const d = await r.json();
    const pages = d?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (!page || page.pageid <= 0 || !page.thumbnail) return null;
    if (page.thumbnail.width < 300) return null;
    return page.thumbnail.source;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400');
  const make = (req.query.make || '').toUpperCase().trim();
  let model = (req.query.model || '').trim();
  const year = parseInt(req.query.year) || 0;
  const cc = parseInt(req.query.cc) || 0;

  // DVSA didn't give us a model — ask API Ninjas for a plausible one from make+year+engine size
  let modelSource = 'dvsa';
  if ((!model || model.length < 2) && make) {
    const guessed = await guessModelFromNinja(make, year, cc);
    if (guessed) { model = guessed; modelSource = 'ninja-inferred'; }
  }

  const wiki = await wikiPhoto(make, model);
  if (wiki) return res.status(200).json({ url: wiki, source: 'wikipedia', modelUsed: model, modelSource });

  const id = PHOTOS[make] || PHOTOS[make.split(' ')[0]] || PHOTOS['DEFAULT'];
  const url = `https://images.unsplash.com/${id}?w=900&h=300&auto=format&fit=crop&q=80`;
  return res.status(200).json({ url, source: 'fallback', modelUsed: model, modelSource });
}
