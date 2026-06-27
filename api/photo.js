// Curated Unsplash photos per car make — no API key needed
const MAKES = {
  'FORD':         'photo-1552519507-da3b142c6e3d',
  'VOLKSWAGEN':   'photo-1609521263047-f8f205293f24',
  'VW':           'photo-1609521263047-f8f205293f24',
  'BMW':          'photo-1555215695-3004980ad54e',
  'MERCEDES':     'photo-1618843479313-40f8afb4b4d8',
  'MERCEDES-BENZ':'photo-1618843479313-40f8afb4b4d8',
  'AUDI':         'photo-1606016159991-dfe4f2746ad5',
  'TOYOTA':       'photo-1559416523-140ddc3d238c',
  'HONDA':        'photo-1617531653332-bd46c24f2068',
  'VAUXHALL':     'photo-1549317661-bd32c8ce0db2',
  'NISSAN':       'photo-1611566026373-c6c8da0ea861',
  'RENAULT':      'photo-1580274455191-1c62238fa333',
  'PEUGEOT':      'photo-1542282088-72c9c27ed0cd',
  'CITROEN':      'photo-1610647752706-3bb12232b3ab',
  'HYUNDAI':      'photo-1583121274602-3e2820c69888',
  'KIA':          'photo-1605559424843-9e4c228bf1c2',
  'MAZDA':        'photo-1617531653332-bd46c24f2068',
  'VOLVO':        'photo-1557411197-a85b8cda4e85',
  'LAND ROVER':   'photo-1547036967-23d11aacaee0',
  'JAGUAR':       'photo-1566473965997-3de9c817e938',
  'PORSCHE':      'photo-1614162692292-7ac56d7f7f1e',
  'FERRARI':      'photo-1592198084033-aade902d1aae',
  'LAMBORGHINI':  'photo-1627454823512-25e1a7428790',
  'TESLA':        'photo-1619767886558-efdc259cde1a',
  'MINI':         'photo-1543465077-db45d34b88a5',
  'SEAT':         'photo-1580274455191-1c62238fa333',
  'SKODA':        'photo-1554223090-7e482851df45',
  'FIAT':         'photo-1621155346337-1d19476ba7d6',
  'ALFA ROMEO':   'photo-1625226151970-9747f4bc9082',
  'SUBARU':       'photo-1621155346337-1d19476ba7d6',
  'MITSUBISHI':   'photo-1576220258822-5e26e31e9b5a',
  'SUZUKI':       'photo-1583121274602-3e2820c69888',
  'LEXUS':        'photo-1558655146-9f40138edfeb',
  'JEEP':         'photo-1547036967-23d11aacaee0',
  'RANGE ROVER':  'photo-1547036967-23d11aacaee0',
  'BENTLEY':      'photo-1614162692292-7ac56d7f7f1e',
  'ROLLS-ROYCE':  'photo-1555215695-3004980ad54e',
  'MASERATI':     'photo-1625226151970-9747f4bc9082',
  'MCLAREN':      'photo-1627454823512-25e1a7428790',
  'ASTON MARTIN': 'photo-1566473965997-3de9c817e938',
  'DACIA':        'photo-1549317661-bd32c8ce0db2',
  'MG':           'photo-1552519507-da3b142c6e3d',
  'GENESIS':      'photo-1558655146-9f40138edfeb',
  'DEFAULT':      'photo-1494976388531-d1058494cdd8',
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400'); // cache 24h

  const make = (req.query.make || '').toUpperCase().trim();
  // Try exact match, then first word of make
  const id = MAKES[make] || MAKES[make.split(' ')[0]] || MAKES['DEFAULT'];
  const url = `https://images.unsplash.com/${id}?w=900&auto=format&fit=crop&q=80`;

  return res.status(200).json({ url, make, matched: !!MAKES[make] });
}
