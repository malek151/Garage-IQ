// Hardcoded specs DB — keyed MAKE|MODEL|CC (uppercase)
// Provides deterministic specs so same car always returns same numbers
const SPECS_DB = {
  'FORD|FIESTA|998':   { bhp:100, torqueNm:170, zeroToSixty:11.5, topSpeedMph:106, gearbox:'6-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:56, co2gkm:115, co2Label:'C' },
  'FORD|FIESTA|1000':  { bhp:100, torqueNm:170, zeroToSixty:11.5, topSpeedMph:106, gearbox:'6-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:56, co2gkm:115, co2Label:'C' },
  'FORD|FIESTA|1498':  { bhp:120, torqueNm:240, zeroToSixty:9.5, topSpeedMph:120, gearbox:'6-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:51, co2gkm:127, co2Label:'D' },
  'FORD|FIESTA|1600':  { bhp:182, torqueNm:240, zeroToSixty:6.9, topSpeedMph:139, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:40, co2gkm:163, co2Label:'E' },
  'FORD|FOCUS|1600':   { bhp:125, torqueNm:200, zeroToSixty:9.4, topSpeedMph:121, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:47, co2gkm:139, co2Label:'D' },
  'FORD|FOCUS|2000':   { bhp:250, torqueNm:360, zeroToSixty:5.9, topSpeedMph:155, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:35, co2gkm:188, co2Label:'F' },
  'FORD|MUSTANG|5000': { bhp:450, torqueNm:529, zeroToSixty:4.6, topSpeedMph:155, gearbox:'6-speed Manual', cylinders:8, driveType:'RWD', consumptionCombined:22, co2gkm:290, co2Label:'G' },
  'FORD|PUMA|1000':    { bhp:125, torqueNm:210, zeroToSixty:9.3, topSpeedMph:121, gearbox:'6-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:52, co2gkm:123, co2Label:'D' },
  'VOLKSWAGEN|GOLF|1400': { bhp:150, torqueNm:250, zeroToSixty:8.5, topSpeedMph:130, gearbox:'7-speed DSG', cylinders:4, driveType:'FWD', consumptionCombined:45, co2gkm:143, co2Label:'D' },
  'VOLKSWAGEN|GOLF|1984': { bhp:245, torqueNm:370, zeroToSixty:5.1, topSpeedMph:155, gearbox:'7-speed DSG', cylinders:4, driveType:'4WD', consumptionCombined:36, co2gkm:179, co2Label:'F' },
  'VOLKSWAGEN|GOLF|1598': { bhp:130, torqueNm:200, zeroToSixty:9.0, topSpeedMph:126, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:48, co2gkm:137, co2Label:'D' },
  'VOLKSWAGEN|POLO|999':  { bhp:95,  torqueNm:175, zeroToSixty:11.0, topSpeedMph:112, gearbox:'5-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:55, co2gkm:117, co2Label:'C' },
  'VOLKSWAGEN|POLO|1197': { bhp:80,  torqueNm:160, zeroToSixty:12.5, topSpeedMph:105, gearbox:'5-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:53, co2gkm:124, co2Label:'D' },
  'VOLKSWAGEN|TIGUAN|1984': { bhp:190, torqueNm:320, zeroToSixty:7.4, topSpeedMph:131, gearbox:'7-speed DSG', cylinders:4, driveType:'4WD', consumptionCombined:38, co2gkm:170, co2Label:'E' },
  'VOLKSWAGEN|PASSAT|1984': { bhp:190, torqueNm:320, zeroToSixty:7.2, topSpeedMph:143, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:42, co2gkm:155, co2Label:'E' },
  'BMW|3 SERIES|1998': { bhp:184, torqueNm:270, zeroToSixty:7.3, topSpeedMph:148, gearbox:'8-speed Auto', cylinders:4, driveType:'RWD', consumptionCombined:44, co2gkm:148, co2Label:'D' },
  'BMW|3 SERIES|2993': { bhp:326, torqueNm:450, zeroToSixty:4.8, topSpeedMph:155, gearbox:'8-speed Auto', cylinders:6, driveType:'RWD', consumptionCombined:32, co2gkm:199, co2Label:'F' },
  'BMW|3 SERIES|1995': { bhp:306, torqueNm:400, zeroToSixty:5.1, topSpeedMph:155, gearbox:'8-speed Auto', cylinders:4, driveType:'4WD', consumptionCombined:36, co2gkm:176, co2Label:'F' },
  'BMW|1 SERIES|1998': { bhp:184, torqueNm:290, zeroToSixty:7.0, topSpeedMph:146, gearbox:'8-speed Auto', cylinders:4, driveType:'RWD', consumptionCombined:43, co2gkm:150, co2Label:'D' },
  'BMW|5 SERIES|1998': { bhp:184, torqueNm:270, zeroToSixty:7.8, topSpeedMph:148, gearbox:'8-speed Auto', cylinders:4, driveType:'RWD', consumptionCombined:41, co2gkm:155, co2Label:'E' },
  'BMW|5 SERIES|2993': { bhp:340, torqueNm:500, zeroToSixty:4.6, topSpeedMph:155, gearbox:'8-speed Auto', cylinders:6, driveType:'4WD', consumptionCombined:34, co2gkm:190, co2Label:'F' },
  'BMW|X5|2993':       { bhp:340, torqueNm:500, zeroToSixty:5.5, topSpeedMph:155, gearbox:'8-speed Auto', cylinders:6, driveType:'4WD', consumptionCombined:30, co2gkm:210, co2Label:'G' },
  'BMW|M3|2979':       { bhp:510, torqueNm:650, zeroToSixty:3.5, topSpeedMph:180, gearbox:'8-speed Auto', cylinders:6, driveType:'4WD', consumptionCombined:26, co2gkm:247, co2Label:'G' },
  'BMW|M4|2993':       { bhp:510, torqueNm:650, zeroToSixty:3.9, topSpeedMph:180, gearbox:'8-speed Auto', cylinders:6, driveType:'RWD', consumptionCombined:27, co2gkm:234, co2Label:'G' },
  'MERCEDES-BENZ|C CLASS|1991': { bhp:184, torqueNm:280, zeroToSixty:7.6, topSpeedMph:149, gearbox:'9-speed Auto', cylinders:4, driveType:'RWD', consumptionCombined:42, co2gkm:152, co2Label:'D' },
  'MERCEDES-BENZ|A CLASS|1332': { bhp:163, torqueNm:250, zeroToSixty:7.7, topSpeedMph:140, gearbox:'7-speed DCT', cylinders:4, driveType:'FWD', consumptionCombined:44, co2gkm:145, co2Label:'D' },
  'MERCEDES-BENZ|E CLASS|1991': { bhp:197, torqueNm:320, zeroToSixty:7.4, topSpeedMph:155, gearbox:'9-speed Auto', cylinders:4, driveType:'RWD', consumptionCombined:40, co2gkm:160, co2Label:'E' },
  'MERCEDES-BENZ|GLE|2925':     { bhp:340, torqueNm:500, zeroToSixty:5.7, topSpeedMph:155, gearbox:'9-speed Auto', cylinders:6, driveType:'4WD', consumptionCombined:29, co2gkm:218, co2Label:'G' },
  'AUDI|A3|1395':  { bhp:150, torqueNm:250, zeroToSixty:8.1, topSpeedMph:134, gearbox:'7-speed S-Tronic', cylinders:4, driveType:'FWD', consumptionCombined:47, co2gkm:138, co2Label:'D' },
  'AUDI|A3|1984':  { bhp:190, torqueNm:320, zeroToSixty:6.9, topSpeedMph:148, gearbox:'7-speed S-Tronic', cylinders:4, driveType:'4WD', consumptionCombined:38, co2gkm:169, co2Label:'E' },
  'AUDI|A4|1984':  { bhp:190, torqueNm:320, zeroToSixty:6.9, topSpeedMph:149, gearbox:'7-speed S-Tronic', cylinders:4, driveType:'4WD', consumptionCombined:39, co2gkm:163, co2Label:'E' },
  'AUDI|RS3|2480': { bhp:400, torqueNm:500, zeroToSixty:3.8, topSpeedMph:174, gearbox:'7-speed S-Tronic', cylinders:5, driveType:'4WD', consumptionCombined:31, co2gkm:208, co2Label:'G' },
  'AUDI|TT|1984':  { bhp:245, torqueNm:370, zeroToSixty:5.3, topSpeedMph:155, gearbox:'6-speed S-Tronic', cylinders:4, driveType:'4WD', consumptionCombined:36, co2gkm:179, co2Label:'F' },
  'AUDI|Q5|1984':  { bhp:204, torqueNm:320, zeroToSixty:7.1, topSpeedMph:137, gearbox:'7-speed S-Tronic', cylinders:4, driveType:'4WD', consumptionCombined:38, co2gkm:174, co2Label:'E' },
  'HONDA|CIVIC|1597': { bhp:129, torqueNm:155, zeroToSixty:9.9, topSpeedMph:124, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:47, co2gkm:141, co2Label:'D' },
  'HONDA|CIVIC|1996': { bhp:182, torqueNm:240, zeroToSixty:7.8, topSpeedMph:143, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:40, co2gkm:164, co2Label:'E' },
  'HONDA|CIVIC|1995': { bhp:316, torqueNm:295, zeroToSixty:5.7, topSpeedMph:169, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:31, co2gkm:207, co2Label:'G' },
  'HONDA|JAZZ|1339':  { bhp:102, torqueNm:137, zeroToSixty:11.5, topSpeedMph:110, gearbox:'CVT Auto', cylinders:4, driveType:'FWD', consumptionCombined:52, co2gkm:124, co2Label:'D' },
  'HONDA|CR-V|1498':  { bhp:193, torqueNm:315, zeroToSixty:8.4, topSpeedMph:124, gearbox:'CVT Auto', cylinders:4, driveType:'4WD', consumptionCombined:44, co2gkm:148, co2Label:'D' },
  'TOYOTA|YARIS|998':  { bhp:125, torqueNm:185, zeroToSixty:9.7, topSpeedMph:114, gearbox:'CVT Auto', cylinders:3, driveType:'FWD', consumptionCombined:55, co2gkm:116, co2Label:'C' },
  'TOYOTA|YARIS|1497': { bhp:116, torqueNm:185, zeroToSixty:10.0, topSpeedMph:108, gearbox:'CVT Auto', cylinders:4, driveType:'FWD', consumptionCombined:61, co2gkm:104, co2Label:'B' },
  'TOYOTA|COROLLA|1798': { bhp:122, torqueNm:142, zeroToSixty:9.9, topSpeedMph:112, gearbox:'CVT Auto', cylinders:4, driveType:'FWD', consumptionCombined:64, co2gkm:100, co2Label:'B' },
  'TOYOTA|SUPRA|2998': { bhp:340, torqueNm:500, zeroToSixty:4.3, topSpeedMph:155, gearbox:'8-speed Auto', cylinders:6, driveType:'RWD', consumptionCombined:34, co2gkm:190, co2Label:'F' },
  'TOYOTA|GR86|1998':  { bhp:235, torqueNm:250, zeroToSixty:6.3, topSpeedMph:140, gearbox:'6-speed Manual', cylinders:4, driveType:'RWD', consumptionCombined:36, co2gkm:179, co2Label:'F' },
  'NISSAN|JUKE|1197':  { bhp:115, torqueNm:190, zeroToSixty:10.5, topSpeedMph:113, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:48, co2gkm:134, co2Label:'D' },
  'NISSAN|QASHQAI|1332': { bhp:158, torqueNm:260, zeroToSixty:9.5, topSpeedMph:128, gearbox:'7-speed DCT', cylinders:4, driveType:'4WD', consumptionCombined:40, co2gkm:159, co2Label:'E' },
  'NISSAN|370Z|3696':  { bhp:328, torqueNm:363, zeroToSixty:5.3, topSpeedMph:155, gearbox:'6-speed Manual', cylinders:6, driveType:'RWD', consumptionCombined:25, co2gkm:264, co2Label:'G' },
  'NISSAN|GT-R|3799':  { bhp:570, torqueNm:637, zeroToSixty:2.9, topSpeedMph:196, gearbox:'6-speed DCT', cylinders:6, driveType:'4WD', consumptionCombined:21, co2gkm:290, co2Label:'G' },
  'SUBARU|IMPREZA|1994': { bhp:224, torqueNm:290, zeroToSixty:5.6, topSpeedMph:150, gearbox:'5-speed Manual', cylinders:4, driveType:'4WD', consumptionCombined:28, co2gkm:228, co2Label:'G' },
  'SUBARU|WRX STI|2457': { bhp:300, torqueNm:407, zeroToSixty:4.8, topSpeedMph:155, gearbox:'6-speed Manual', cylinders:4, driveType:'4WD', consumptionCombined:24, co2gkm:271, co2Label:'G' },
  'MITSUBISHI|LANCER|1998': { bhp:295, torqueNm:366, zeroToSixty:4.8, topSpeedMph:155, gearbox:'6-speed Manual', cylinders:4, driveType:'4WD', consumptionCombined:26, co2gkm:252, co2Label:'G' },
  'MAZDA|MX-5|1998':  { bhp:184, torqueNm:205, zeroToSixty:6.5, topSpeedMph:136, gearbox:'6-speed Manual', cylinders:4, driveType:'RWD', consumptionCombined:40, co2gkm:160, co2Label:'E' },
  'MAZDA|3|1998':     { bhp:165, torqueNm:213, zeroToSixty:8.3, topSpeedMph:130, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:42, co2gkm:154, co2Label:'E' },
  'MAZDA|CX-5|1998':  { bhp:165, torqueNm:213, zeroToSixty:9.5, topSpeedMph:124, gearbox:'6-speed Auto', cylinders:4, driveType:'4WD', consumptionCombined:38, co2gkm:166, co2Label:'E' },
  'RENAULT|CLIO|898':  { bhp:100, torqueNm:160, zeroToSixty:11.8, topSpeedMph:109, gearbox:'6-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:55, co2gkm:117, co2Label:'C' },
  'RENAULT|MEGANE|1332': { bhp:140, torqueNm:240, zeroToSixty:9.1, topSpeedMph:124, gearbox:'7-speed DCT', cylinders:4, driveType:'FWD', consumptionCombined:47, co2gkm:136, co2Label:'D' },
  'PEUGEOT|208|1199':  { bhp:100, torqueNm:205, zeroToSixty:10.5, topSpeedMph:111, gearbox:'8-speed Auto', cylinders:3, driveType:'FWD', consumptionCombined:54, co2gkm:119, co2Label:'C' },
  'PEUGEOT|308|1199':  { bhp:130, torqueNm:230, zeroToSixty:9.0, topSpeedMph:123, gearbox:'8-speed Auto', cylinders:3, driveType:'FWD', consumptionCombined:50, co2gkm:128, co2Label:'D' },
  'VAUXHALL|CORSA|1199': { bhp:130, torqueNm:220, zeroToSixty:9.3, topSpeedMph:124, gearbox:'6-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:49, co2gkm:131, co2Label:'D' },
  'VAUXHALL|ASTRA|1200': { bhp:130, torqueNm:230, zeroToSixty:9.4, topSpeedMph:128, gearbox:'6-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:47, co2gkm:136, co2Label:'D' },
  'SEAT|LEON|1984':   { bhp:190, torqueNm:320, zeroToSixty:6.8, topSpeedMph:148, gearbox:'7-speed DSG', cylinders:4, driveType:'4WD', consumptionCombined:37, co2gkm:170, co2Label:'E' },
  'SEAT|IBIZA|999':   { bhp:95,  torqueNm:175, zeroToSixty:11.0, topSpeedMph:109, gearbox:'5-speed Manual', cylinders:3, driveType:'FWD', consumptionCombined:55, co2gkm:116, co2Label:'C' },
  'SKODA|OCTAVIA|1984': { bhp:190, torqueNm:320, zeroToSixty:6.8, topSpeedMph:148, gearbox:'7-speed DSG', cylinders:4, driveType:'4WD', consumptionCombined:38, co2gkm:167, co2Label:'E' },
  'RANGE ROVER|SPORT|2993': { bhp:350, torqueNm:500, zeroToSixty:5.6, topSpeedMph:155, gearbox:'8-speed Auto', cylinders:6, driveType:'4WD', consumptionCombined:28, co2gkm:224, co2Label:'G' },
  'LAND ROVER|DEFENDER|1997': { bhp:200, torqueNm:430, zeroToSixty:9.0, topSpeedMph:119, gearbox:'8-speed Auto', cylinders:4, driveType:'4WD', consumptionCombined:36, co2gkm:205, co2Label:'G' },
  'JAGUAR|F-TYPE|2995': { bhp:340, torqueNm:450, zeroToSixty:5.3, topSpeedMph:155, gearbox:'8-speed Auto', cylinders:6, driveType:'RWD', consumptionCombined:31, co2gkm:207, co2Label:'G' },
  'JAGUAR|XE|1997':   { bhp:200, torqueNm:320, zeroToSixty:7.2, topSpeedMph:148, gearbox:'8-speed Auto', cylinders:4, driveType:'RWD', consumptionCombined:38, co2gkm:168, co2Label:'E' },
  'MINI|HATCHBACK|1499': { bhp:136, torqueNm:220, zeroToSixty:8.5, topSpeedMph:127, gearbox:'7-speed DCT', cylinders:3, driveType:'FWD', consumptionCombined:48, co2gkm:133, co2Label:'D' },
  'MINI|COOPER S|1998': { bhp:192, torqueNm:280, zeroToSixty:6.6, topSpeedMph:150, gearbox:'7-speed DCT', cylinders:4, driveType:'FWD', consumptionCombined:40, co2gkm:160, co2Label:'E' },
  'MINI|JOHN COOPER WORKS|1998': { bhp:231, torqueNm:320, zeroToSixty:6.3, topSpeedMph:153, gearbox:'8-speed Auto', cylinders:4, driveType:'4WD', consumptionCombined:36, co2gkm:178, co2Label:'F' },
  'PORSCHE|911|2981': { bhp:385, torqueNm:450, zeroToSixty:4.4, topSpeedMph:179, gearbox:'8-speed PDK', cylinders:6, driveType:'RWD', consumptionCombined:28, co2gkm:229, co2Label:'G' },
  'PORSCHE|CAYENNE|2995': { bhp:340, torqueNm:450, zeroToSixty:5.9, topSpeedMph:152, gearbox:'8-speed PDK', cylinders:6, driveType:'4WD', consumptionCombined:28, co2gkm:224, co2Label:'G' },
  'PORSCHE|MACAN|1984': { bhp:265, torqueNm:400, zeroToSixty:5.8, topSpeedMph:143, gearbox:'7-speed PDK', cylinders:4, driveType:'4WD', consumptionCombined:33, co2gkm:194, co2Label:'F' },
  'TESLA|MODEL 3|0':   { bhp:358, torqueNm:420, zeroToSixty:4.6, topSpeedMph:162, gearbox:'Single-speed Auto', cylinders:0, driveType:'4WD', consumptionCombined:0, co2gkm:0, co2Label:'A' },
  'TESLA|MODEL S|0':   { bhp:670, torqueNm:900, zeroToSixty:2.1, topSpeedMph:200, gearbox:'Single-speed Auto', cylinders:0, driveType:'4WD', consumptionCombined:0, co2gkm:0, co2Label:'A' },
  'TESLA|MODEL Y|0':   { bhp:456, torqueNm:510, zeroToSixty:3.7, topSpeedMph:155, gearbox:'Single-speed Auto', cylinders:0, driveType:'4WD', consumptionCombined:0, co2gkm:0, co2Label:'A' },
  'HYUNDAI|I30|1591': { bhp:120, torqueNm:156, zeroToSixty:10.1, topSpeedMph:116, gearbox:'6-speed Manual', cylinders:4, driveType:'FWD', consumptionCombined:48, co2gkm:133, co2Label:'D' },
  'KIA|SPORTAGE|1591': { bhp:150, torqueNm:253, zeroToSixty:9.9, topSpeedMph:119, gearbox:'7-speed DCT', cylinders:4, driveType:'4WD', consumptionCombined:40, co2gkm:158, co2Label:'E' },
  'VOLVO|XC40|1969':  { bhp:190, torqueNm:300, zeroToSixty:7.4, topSpeedMph:127, gearbox:'8-speed Auto', cylinders:4, driveType:'4WD', consumptionCombined:34, co2gkm:186, co2Label:'F' },
  'VOLVO|XC90|1969':  { bhp:250, torqueNm:350, zeroToSixty:7.3, topSpeedMph:130, gearbox:'8-speed Auto', cylinders:4, driveType:'4WD', consumptionCombined:29, co2gkm:215, co2Label:'G' },
  'ALFA ROMEO|GIULIA|1995': { bhp:200, torqueNm:330, zeroToSixty:6.6, topSpeedMph:149, gearbox:'8-speed Auto', cylinders:4, driveType:'RWD', consumptionCombined:38, co2gkm:168, co2Label:'E' },
  'ALFA ROMEO|STELVIO|1995': { bhp:200, torqueNm:330, zeroToSixty:7.0, topSpeedMph:143, gearbox:'8-speed Auto', cylinders:4, driveType:'4WD', consumptionCombined:35, co2gkm:179, co2Label:'F' },
};

// Fuel-type-aware fallback when car not in DB
function fallbackSpecs(cc, fuel) {
  const f = (fuel || '').toUpperCase();
  const isElectric = f.includes('ELECTRIC');
  const isHybrid = f.includes('HYBRID');
  const isDiesel = f.includes('DIESEL');

  if (isElectric) return { bhp: 204, torqueNm: 310, zeroToSixty: 7.2, topSpeedMph: 120, gearbox: 'Single-speed Auto', cylinders: 0, driveType: 'FWD', consumptionCombined: 0, co2gkm: 0, co2Label: 'A' };

  const c = parseInt(cc) || 1600;
  let bhp, tq, z62, top;

  if (isHybrid) {
    bhp = c <= 1500 ? 122 : c <= 2000 ? 180 : 220;
    tq  = Math.round(bhp * 1.6);
    z62 = c <= 1500 ? 10.5 : 8.5;
    top = c <= 1500 ? 112 : 124;
  } else if (isDiesel) {
    bhp = c <= 1500 ? 115 : c <= 2000 ? 150 : c <= 2500 ? 190 : 250;
    tq  = Math.round(bhp * 2.2);
    z62 = c <= 1500 ? 11.0 : c <= 2000 ? 9.5 : c <= 2500 ? 8.0 : 6.5;
    top = c <= 1500 ? 114 : c <= 2000 ? 128 : c <= 2500 ? 138 : 148;
  } else {
    // Petrol
    bhp = c <= 999 ? 95 : c <= 1199 ? 110 : c <= 1399 ? 128 : c <= 1599 ? 138 : c <= 1999 ? 163 : c <= 2499 ? 228 : c <= 2999 ? 300 : 380;
    tq  = Math.round(bhp * 1.55);
    z62 = c <= 999 ? 12.5 : c <= 1199 ? 11.0 : c <= 1399 ? 10.0 : c <= 1599 ? 9.2 : c <= 1999 ? 7.8 : c <= 2499 ? 6.5 : c <= 2999 ? 5.5 : 4.5;
    top = c <= 999 ? 106 : c <= 1199 ? 115 : c <= 1399 ? 120 : c <= 1599 ? 126 : c <= 1999 ? 136 : c <= 2499 ? 148 : c <= 2999 ? 158 : 175;
  }

  const mpg = isDiesel ? 52 : isHybrid ? 58 : Math.max(22, 65 - Math.round(c/80));
  const co2 = isElectric ? 0 : Math.round((6400 / mpg) * 0.0454 * 19.6);

  return { bhp, torqueNm: tq, zeroToSixty: z62, topSpeedMph: top, gearbox: c <= 1600 ? '6-speed Manual' : '8-speed Auto', cylinders: c <= 999 ? 3 : c <= 2999 ? 4 : 6, driveType: 'FWD', consumptionCombined: mpg, co2gkm: co2, co2Label: co2 <= 50 ? 'A' : co2 <= 95 ? 'B' : co2 <= 115 ? 'C' : co2 <= 135 ? 'D' : co2 <= 155 ? 'E' : co2 <= 175 ? 'F' : 'G' };
}

// Validate specs look reasonable
function isValidSpec(s) {
  return s && s.bhp >= 40 && s.bhp <= 1500 && s.torqueNm > 0;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { make, model, year, cc, fuel } = req.body;

  // ── Step 1: Hardcoded DB lookup ──
  const makeUC  = (make  || '').toUpperCase().trim();
  const modelUC = (model || '').toUpperCase().trim();
  const ccInt   = parseInt(cc) || 0;

  // Try exact match first, then ±50cc tolerance
  const key = `${makeUC}|${modelUC}|${ccInt}`;
  let specs = SPECS_DB[key];

  if (!specs) {
    // Try ±50cc
    for (const k of Object.keys(SPECS_DB)) {
      const parts = k.split('|');
      if (parts[0] === makeUC && parts[1] === modelUC && Math.abs(parseInt(parts[2]) - ccInt) <= 50) {
        specs = SPECS_DB[k];
        break;
      }
    }
  }

  if (isValidSpec(specs)) {
    return res.status(200).json(specs);
  }

  // ── Step 2: Groq AI at temperature 0 (deterministic) ──
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (GROQ_KEY) {
    try {
      const prompt = `Return ONLY a valid JSON object with exact UK-market specs for a ${year || ''} ${make || ''} ${model || ''} ${cc ? cc+'cc' : ''} ${fuel || ''}.
Fields: bhp (integer), torqueNm (integer), torqueRpm (integer), zeroToSixty (decimal seconds), topSpeedMph (integer), gearbox (string), cylinders (integer), driveType (FWD/RWD/4WD), consumptionCombined (integer mpg, 0 for electric), co2gkm (integer, 0 for electric), co2Label (A-G string).
No markdown, no commentary, no <think> tags. Pure JSON only.`;

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-r1-distill-llama-70b', messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: 250 })
      });

      if (r.ok) {
        const data = await r.json();
        const raw = (data.choices?.[0]?.message?.content || '')
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/```json|```/g, '')
          .trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const aiSpecs = JSON.parse(match[0]);
          if (isValidSpec(aiSpecs)) return res.status(200).json(aiSpecs);
        }
      }
    } catch (_) { /* fall through to fallback */ }
  }

  // ── Step 3: Fuel-aware numeric fallback ──
  return res.status(200).json(fallbackSpecs(cc, fuel));
}
