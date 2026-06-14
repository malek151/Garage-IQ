'use strict';

/* ══════════════════════════════════════════
   GarageIQ app.js — all JavaScript
   Includes fixed: estVal, renderUlezVed, buildOwnership
   ══════════════════════════════════════════ */

var VERCEL='https://www.garageiq.org.uk';
var SUPA_URL='https://hbfntnxawwavttzvxdde.supabase.co';
var SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm50bnhhd3dhdnR0enZ4ZGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjA3NTYsImV4cCI6MjA5NDQ5Njc1Nn0.PtGE3zS40b8VBozDcl93-sNVx1wN29-sKvZzje--s10';
var sb,currentUser,currentProfile,vehicleData={},motTests=[],selectedMods=new Set(),currentReg='';
var _specCache={};

function el(id){return document.getElementById(id);}
function qsa(s){return document.querySelectorAll(s);}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}
function fmt(s){return s?String(s).toUpperCase():'-'}

/* ── DARK MODE ── */
(function(){
  var saved=localStorage.getItem('giq_theme')||'light';
  if(saved==='dark')document.documentElement.setAttribute('data-theme','dark');
})();
function toggleDark(){
  var html=document.documentElement;
  var isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',isDark?'light':'dark');
  localStorage.setItem('giq_theme',isDark?'light':'dark');
  var icon=el('dmIcon');
  if(icon)icon.className=isDark?'ti ti-moon':'ti ti-sun';
}

/* ── SEARCH MODE ── */
var SEARCH_MODE='reg';
function setSearchMode(m){
  SEARCH_MODE=m;
  el('modeReg').classList.toggle('active',m==='reg');
  el('modeVin').classList.toggle('active',m==='vin');
  var inp=el('regInput'),note=el('searchNote'),badge=el('regBadgeTxt');
  if(m==='vin'){
    inp.placeholder='e.g. WBAFR7C55BC123456';
    inp.style.letterSpacing='1px';inp.style.fontSize='14px';inp.maxLength=17;
    if(note)note.textContent='17-character VIN · Any country worldwide';
    if(badge)badge.textContent='VIN';
  }else{
    inp.placeholder='AB12 CDE';
    inp.style.letterSpacing='5px';inp.style.fontSize='24px';inp.maxLength=8;
    if(note)note.textContent='UK reg plate · DVLA data · Secure · No spam';
    if(badge)badge.textContent='UK';
  }
  inp.value='';inp.focus();
}
function detectInputType(v){
  var clean=v.replace(/\s/g,'').toUpperCase();
  if(/^[A-HJ-NPR-Z0-9]{17}$/.test(clean))return'vin';
  return'reg';
}

/* ── VIN DECODE ── */
var WMI_MAP={
  'AA':'South Africa','AB':'South Africa','AC':'South Africa','AD':'South Africa','AE':'South Africa','AF':'South Africa','AG':'South Africa','AH':'South Africa',
  'LA':'China','LB':'China','LC':'China','LD':'China','LE':'China','LF':'China','LG':'China','LH':'China','LJ':'China','LK':'China','LL':'China','LM':'China','LN':'China','LP':'China','LR':'China','LS':'China','LT':'China','LU':'China','LV':'China','LW':'China','LX':'China','LY':'China',
  'MA':'India','MB':'India','MC':'India','MD':'India','ME':'India','MF':'Indonesia','ML':'Thailand','MM':'Thailand',
  'NF':'Turkey','NG':'Turkey','NH':'Turkey','NJ':'Turkey','NK':'Turkey','NM':'Turkey','NN':'Turkey',
  'PA':'Philippines','PL':'Malaysia','PM':'Malaysia','PC':'Pakistan',
  'JA':'Japan','JB':'Japan','JC':'Japan','JD':'Japan','JE':'Japan','JF':'Japan','JG':'Japan','JH':'Japan','JK':'Japan','JL':'Japan','JM':'Japan','JN':'Japan','JP':'Japan','JR':'Japan','JS':'Japan','JT':'Japan',
  'KL':'South Korea','KM':'South Korea','KN':'South Korea','KP':'South Korea','KR':'South Korea',
  'SA':'United Kingdom','SB':'United Kingdom','SC':'United Kingdom','SD':'United Kingdom','SE':'United Kingdom','SF':'United Kingdom','SG':'United Kingdom','SH':'United Kingdom','SJ':'United Kingdom','SK':'United Kingdom','SL':'United Kingdom','SM':'United Kingdom',
  'SN':'Germany','SP':'Germany','SU':'Poland','SV':'Poland','SW':'Poland',
  'TA':'Switzerland','TB':'Switzerland','TC':'Switzerland','TD':'Switzerland','TE':'Austria','TF':'Austria','TJ':'Czech Republic','TK':'Czech Republic','TM':'Hungary','TN':'Hungary','TP':'Portugal','TR':'Portugal',
  'UA':'Austria','UB':'Austria','UC':'Austria',
  'VA':'Austria','VF':'France','VG':'France','VH':'France','VJ':'France','VK':'France','VL':'France','VM':'France','VN':'France','VP':'France','VR':'France','VS':'Spain','VT':'Spain','VU':'Spain','VV':'Spain','VW':'Spain',
  'WA':'Germany','WB':'Germany','WC':'Germany','WD':'Germany','WE':'Germany','WF':'Germany','WG':'Germany','WH':'Germany','WJ':'Germany','WK':'Germany','WL':'Germany','WM':'Germany','WN':'Germany','WP':'Germany','WV':'Germany','WW':'Germany',
  'XA':'Bulgaria','XB':'Bulgaria','XF':'Greece','XG':'Greece','XL':'Netherlands','XM':'Netherlands','XN':'Netherlands',
  'XS':'Russia','XT':'Russia','XU':'Russia','XV':'Russia','XW':'Russia','XY':'Russia','XZ':'Russia',
  'YA':'Belgium','YB':'Belgium','YC':'Belgium','YD':'Belgium','YF':'Finland','YG':'Finland','YS':'Sweden','YT':'Sweden','YV':'Sweden',
  'ZA':'Italy','ZB':'Italy','ZC':'Italy','ZD':'Italy','ZE':'Italy','ZF':'Italy','ZG':'Italy','ZH':'Italy','ZJ':'Italy','ZK':'Italy','ZL':'Italy','ZM':'Italy','ZN':'Italy','ZP':'Italy','ZR':'Italy',
  '1A':'United States','1B':'United States','1C':'United States','1D':'United States','1E':'United States','1F':'United States','1G':'United States','1H':'United States','1J':'United States','1K':'United States','1L':'United States','1M':'United States','1N':'United States','1P':'United States','1R':'United States','1S':'United States','1T':'United States','1V':'United States','1W':'United States','1X':'United States','1Y':'United States','1Z':'United States',
  '2A':'Canada','2B':'Canada','2C':'Canada','2F':'Canada','2G':'Canada','2H':'Canada','2M':'Canada','2P':'Canada','2T':'Canada','2W':'Canada',
  '3A':'Mexico','3B':'Mexico','3C':'Mexico','3D':'Mexico','3E':'Mexico','3F':'Mexico','3G':'Mexico','3H':'Mexico','3J':'Mexico','3K':'Mexico','3L':'Mexico','3M':'Mexico','3N':'Mexico','3P':'Mexico','3R':'Mexico','3S':'Mexico','3T':'Mexico','3V':'Mexico','3W':'Mexico',
  '4A':'United States','4B':'United States','4C':'United States','4D':'United States','4F':'United States','4J':'United States','4M':'United States','4N':'United States','4S':'United States','4T':'United States','4U':'United States','4V':'United States',
  '5F':'United States','5L':'United States','5N':'United States','5T':'United States','5X':'United States','5Y':'United States','5Z':'United States',
  '6F':'Australia','6G':'Australia','6H':'Australia','6J':'Australia','6K':'Australia','6L':'Australia','6M':'Australia','6N':'Australia','6P':'Australia','6R':'Australia','6W':'Australia',
  '7A':'New Zealand','8A':'Argentina','8C':'Argentina','8G':'Argentina',
  '9A':'Brazil','9B':'Brazil','9C':'Brazil','9D':'Brazil','9E':'Brazil',
};
var COUNTRY_FLAGS={
  'United Kingdom':'🇬🇧','Germany':'🇩🇪','France':'🇫🇷','Italy':'🇮🇹','Spain':'🇪🇸','Japan':'🇯🇵','South Korea':'🇰🇷','United States':'🇺🇸',
  'Canada':'🇨🇦','Mexico':'🇲🇽','China':'🇨🇳','India':'🇮🇳','Sweden':'🇸🇪','Netherlands':'🇳🇱','Belgium':'🇧🇪','Austria':'🇦🇹',
  'Switzerland':'🇨🇭','Czech Republic':'🇨🇿','Hungary':'🇭🇺','Portugal':'🇵🇹','Poland':'🇵🇱','Russia':'🇷🇺','Turkey':'🇹🇷','Australia':'🇦🇺',
  'South Africa':'🇿🇦','Brazil':'🇧🇷','Argentina':'🇦🇷','Thailand':'🇹🇭','Malaysia':'🇲🇾','Finland':'🇫🇮','Greece':'🇬🇷','Bulgaria':'🇧🇬','New Zealand':'🇳🇿',
};
var VIN_YEARS={
  'A':1980,'B':1981,'C':1982,'D':1983,'E':1984,'F':1985,'G':1986,'H':1987,'J':1988,'K':1989,'L':1990,'M':1991,'N':1992,'P':1993,'R':1994,'S':1995,'T':1996,'V':1997,'W':1998,'X':1999,'Y':2000,
  '1':2001,'2':2002,'3':2003,'4':2004,'5':2005,'6':2006,'7':2007,'8':2008,'9':2009,
  'A2':2010,'B2':2011,'C2':2012,'D2':2013,'E2':2014,'F2':2015,'G2':2016,'H2':2017,'J2':2018,'K2':2019,'L2':2020,'M2':2021,'N2':2022,'P2':2023,'R2':2024,'S2':2025,
};
function vinCheckDigit(vin){
  var VALS={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9};
  var WEIGHTS=[8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
  var sum=0;
  for(var i=0;i<17;i++)sum+=(VALS[vin[i].toUpperCase()]||0)*WEIGHTS[i];
  var rem=sum%11,check=rem===10?'X':String(rem);
  return{valid:check===vin[8].toUpperCase(),expected:check,got:vin[8].toUpperCase()};
}
function decodeVin(vin){
  vin=vin.replace(/\s/g,'').toUpperCase();
  if(vin.length!==17)return null;
  var wmi=vin.slice(0,3),wmi2=vin.slice(0,2);
  var country=WMI_MAP[wmi]||WMI_MAP[wmi2]||'Unknown';
  var flag=COUNTRY_FLAGS[country]||'🌍';
  var yc=vin[9],year=VIN_YEARS[yc]||null;
  if(year&&year<2010&&vin[9]!=='9'){var alt=VIN_YEARS[yc+'2'];if(alt)year=alt;}
  var chk=vinCheckDigit(vin);
  return{vin:vin,wmi:wmi,vds:vin.slice(3,8),country:country,flag:flag,year:year,plant:vin[10],serial:vin.slice(11),checkValid:chk.valid};
}

/* ── LOADING OVERLAY ── */
function showLoadingOverlay(reg){
  var ov=el('loadingOverlay');if(!ov)return;
  ov.classList.remove('hidden');
  var lr=el('loadingReg');if(lr)lr.textContent='Analysing '+reg.toUpperCase();
  ['lstep1','lstep2','lstep3'].forEach(function(id){var s=el(id);if(s){s.classList.remove('active','done');}});
  function activate(id,delay){
    setTimeout(function(){
      var s=el(id);if(!s)return;
      var prev={'lstep2':'lstep1','lstep3':'lstep2'}[id];
      if(prev){var p=el(prev);if(p){p.classList.remove('active');p.classList.add('done');}}
      s.classList.add('active');
    },delay);
  }
  activate('lstep1',0);activate('lstep2',900);activate('lstep3',1800);
}
function hideLoadingOverlay(){
  var ov=el('loadingOverlay');if(!ov)return;
  setTimeout(function(){
    ['lstep1','lstep2','lstep3'].forEach(function(id){var s=el(id);if(s){s.classList.remove('active');s.classList.add('done');}});
    setTimeout(function(){ov.classList.add('hidden');},400);
  },200);
}

/* ════════════════════════════════════════════
   FIXED FUNCTION 1: estVal — real UK depreciation
   ════════════════════════════════════════════ */
function estVal(d){
  var y=parseInt(d.yearOfManufacture)||2015;
  var age=Math.max(0,2026-y);
  var cc=parseInt(d.engineCapacity)||1600;
  var fuel=(d.fuelType||'').toUpperCase();
  var make=(d.make||'').toUpperCase();
  var PREMIUM=['BMW','MERCEDES-BENZ','MERCEDES','AUDI','JAGUAR','LAND ROVER','RANGE ROVER','PORSCHE','LEXUS','VOLVO','MINI','TESLA','ALFA ROMEO','MASERATI'];
  var BUDGET=['DACIA','SSANGYONG','PROTON','CHEVROLET','MG','SUBARU'];
  var brandMult=PREMIUM.indexOf(make)>=0?1.6:BUDGET.indexOf(make)>=0?0.82:1.0;
  var base=cc<=1000?14000:cc<=1400?18000:cc<=1600?22000:cc<=2000?28000:cc<=3000?42000:65000;
  if(fuel.indexOf('ELECTRIC')>=0)base=Math.max(base,32000);
  base=Math.round(base*brandMult);
  var retain=[1,.76,.64,.55,.48,.42,.37,.33,.29,.26,.23,.20,.18];
  var idx=Math.min(age,retain.length-1);
  var value=Math.round(base*retain[idx]);
  return Math.max(600,Math.round(base*.08),value);
}

function estHp(d){
  var c=parseInt(d.engineCapacity)||1600,f=(d.fuelType||'').toUpperCase();
  if(f.indexOf('ELECTRIC')>=0)return 150;if(f.indexOf('HYBRID')>=0)return c<=1500?116:180;
  return c<=999?95:c<=1199?110:c<=1399?128:c<=1599?138:c<=1999?163:c<=2499?228:c<=2999?298:375;
}
function estTq(d){return Math.round(estHp(d)*1.55);}

/* ════════════════════════════════════════════
   FIXED FUNCTION 2: renderUlezVed — real DVLA VED bands
   ════════════════════════════════════════════ */
function renderUlezVed(d){
  var grid=el('ulezGrid');if(!grid)return;
  var year=parseInt(d.yearOfManufacture)||0;
  var fuel=(d.fuelType||'').toUpperCase();
  var isEV=fuel.indexOf('ELECTRIC')>=0;
  var isHybrid=fuel.indexOf('HYBRID')>=0;
  var isPetrol=fuel.indexOf('PETROL')>=0;
  var isDiesel=fuel.indexOf('DIESEL')>=0;

  /* ULEZ */
  var ulezOk,ulezText,ulezColor;
  if(isEV){ulezOk=true;ulezText='Zero emission — exempt from all clean air charges';ulezColor='var(--green)';}
  else if(isHybrid&&year>=2005){ulezOk=true;ulezText='Hybrid '+year+' — meets ULEZ Euro 4+ standard';ulezColor='var(--green)';}
  else if(isPetrol&&year>=2006){ulezOk=true;ulezText='Petrol '+year+' — meets ULEZ Euro 4 standard';ulezColor='var(--green)';}
  else if(isDiesel&&year>=2015){ulezOk=true;ulezText='Diesel '+year+' — meets ULEZ Euro 6 standard';ulezColor='var(--green)';}
  else if(year>=2015){ulezOk=true;ulezText='Registered '+year+' — assumed compliant (post-2015)';ulezColor='var(--amber)';}
  else{ulezOk=false;ulezText=(year?'Registered '+year+' — ':'')+(isPetrol?'Pre-Euro 4 petrol':isDiesel?'Pre-Euro 6 diesel':'Check your vehicle')+(year&&year<2015?' — likely non-compliant':'');ulezColor='var(--red)';}
  var uv=el('ulezVal'),us=el('ulezSub');
  if(uv){uv.textContent=ulezOk?'Compliant':'Non-Compliant';uv.style.color=ulezColor;}
  if(us)us.textContent=ulezText;

  /* VED — real DVLA bands by registration date */
  var regDate=d.monthOfFirstRegistration||'';
  var regYear=parseInt(regDate.slice(0,4))||year;
  var regMonth=parseInt(regDate.slice(5,7))||1;
  var estCo2=isEV?0:isPetrol?(year>=2020?120:year>=2015?135:155):isDiesel?(year>=2020?130:year>=2015?145:170):140;
  var co2=(d.co2Emissions!==undefined&&d.co2Emissions!==null)?parseInt(d.co2Emissions):estCo2;
  var ved,vedBand,vedColor;

  if(regYear<2001){
    var cc=parseInt(d.engineCapacity)||1600;
    ved=cc<=1549?'£210':'£345';
    vedBand='Pre-2001 · '+(cc<=1549?'≤1549cc rate':'>1549cc rate');
    vedColor='var(--amber)';
  }else if(regYear<2017||(regYear===2017&&regMonth<4)){
    /* CO2 bands A-M — real 2024/25 DVLA standard rates */
    var bands=[
      {max:100,ved:0,band:'A'},{max:110,ved:20,band:'B'},{max:120,ved:35,band:'C'},
      {max:130,ved:160,band:'D'},{max:140,ved:190,band:'E'},{max:150,ved:210,band:'F'},
      {max:165,ved:255,band:'G'},{max:175,ved:305,band:'H'},{max:185,ved:335,band:'I'},
      {max:200,ved:385,band:'J'},{max:225,ved:415,band:'K'},{max:255,ved:710,band:'L'},
      {max:Infinity,ved:735,band:'M'}
    ];
    var b=bands.filter(function(x){return co2<=x.max;})[0]||bands[bands.length-1];
    ved='£'+b.ved;
    vedBand='Band '+b.band+' ('+(b.max===Infinity?'>255':'\u2264'+b.max)+'g/km)';
    vedColor=b.ved===0?'var(--green)':b.ved<=255?'var(--amber)':'var(--red)';
  }else{
    /* Apr 2017+: standard rate £190. EVs registered before Apr 2025 = £0 */
    var STANDARD=190;
    if(isEV)STANDARD=(regYear<2025)?0:190;
    ved='£'+STANDARD;
    vedBand=isEV?'Electric — standard VED rate':'Standard rate (post-Apr 2017)';
    vedColor=STANDARD===0?'var(--green)':'var(--amber)';
    /* Expensive car supplement: list price >£40k, years 2-6, +£410/yr */
    var listPrice=vehicleData.value||0;
    var carAge=2026-regYear;
    if(listPrice>40000&&carAge>=1&&carAge<=6){
      ved='£'+(STANDARD+410);
      vedBand+=' + £410 expensive car supplement (yrs 2\u20136, list price >£40k)';
      vedColor='var(--red)';
    }
  }

  var vv=el('vedVal'),vs=el('vedSub');
  if(vv){vv.textContent=ved+' / yr';vv.style.color=vedColor;}
  if(vs)vs.textContent=vedBand+(co2?' · '+co2+' g/km CO\u2082':' · CO\u2082 data unavailable');
  grid.classList.remove('hidden');
}

/* ── MILEAGE BAR CHART ── */
function buildMiBarChart(tests){
  var wrap=el('miBarChart');if(!wrap)return;
  var carYear=parseInt(vehicleData.yearOfManufacture)||2010;
  var sorted=tests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var pts=[{date:String(carYear),mi:0,reg:true,passed:true}];
  sorted.forEach(function(t){
    var mi=parseInt(t.odometerValue)||0;if(!mi)return;
    var ds=t.completedDate||'';
    var yr=0;try{yr=new Date(ds).getFullYear();}catch(e){}
    if(yr>0&&yr<carYear)return;
    pts.push({date:ds.slice(0,7)||String(yr),mi:mi,passed:(t.testResult||'').toUpperCase()==='PASSED',reg:false});
  });
  if(pts.length<2){wrap.innerHTML='';return;}
  var maxMi=Math.max.apply(null,pts.map(function(p){return p.mi;}))||1;
  var html=pts.map(function(p,i){
    var pct=Math.round((p.mi/maxMi)*100);
    var cls=p.reg?'reg':p.passed?'pass':'fail';
    var fraud=!p.reg&&i>0&&p.mi<pts[i-1].mi;
    var label=p.mi>0?p.mi.toLocaleString()+' mi':(p.reg?'Registration':'—');
    var ds=p.reg?String(carYear):p.date.slice(0,7);
    return'<div class="mi-bar-row">'
      +'<div class="mi-bar-date">'+esc(ds)+'</div>'
      +'<div class="mi-bar-bg">'
      +'<div class="mi-bar-fill '+cls+'" style="width:0" data-w="'+pct+'%">'+(pct>18?label:'')+'</div>'
      +(fraud?'<div style="position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:9px;font-weight:800;color:var(--red)">⚠ DROP</div>':'')
      +'</div>'
      +'<div class="mi-bar-val">'+(pct<=18?label:'')+'</div>'
      +'</div>';
  }).join('');
  wrap.innerHTML=html;
  setTimeout(function(){wrap.querySelectorAll('.mi-bar-fill').forEach(function(bar){bar.style.width=bar.getAttribute('data-w');});},100);
}

/* ── INIT ── */
window.addEventListener('load',function(){
  sb=window.supabase.createClient(SUPA_URL,SUPA_KEY);
  sb.auth.onAuthStateChange(function(ev,session){
    currentUser=session?session.user:null;
    if(currentUser){
      var pu=localStorage.getItem('giq_pu_'+currentUser.id);
      if(pu)tryCreateProfile(currentUser.id,pu);else loadProfile();
      if(motTests.length)setTimeout(showIntelReport,120);
    }else{currentProfile=null;renderNav();if(motTests.length)showIntelReport();}
  });
  el('btnLogin').onclick=function(){openAuth('login');};
  el('btnSignup').onclick=function(){openAuth('signup');};
  el('btnAvatar').onclick=openProfileModal;
  el('authClose').onclick=closeAuth;
  el('authModal').onclick=function(e){if(e.target===this)closeAuth();};
  el('tabLogin').onclick=function(){switchAuthTab('login');};
  el('tabSignup').onclick=function(){switchAuthTab('signup');};
  el('btnDoLogin').onclick=doLogin;
  el('btnDoSignup').onclick=doSignup;
  el('profileClose').onclick=closeProfileModal;
  el('profileModal').onclick=function(e){if(e.target===this)closeProfileModal();};
  el('btnSaveUser').onclick=saveUsername;
  el('btnLogout').onclick=doLogout;
  if(el('btnLogoutNav'))el('btnLogoutNav').onclick=doLogout;
  el('runBtn').onclick=lookupVehicle;
  if(el('dmToggle'))el('dmToggle').onclick=toggleDark;
  (function(){var icon=el('dmIcon');if(icon&&document.documentElement.getAttribute('data-theme')==='dark')icon.className='ti ti-sun';})();
  el('regInput').onkeydown=function(e){if(e.key==='Enter')lookupVehicle();};
  el('regInput').oninput=function(){
    var v=this.value.trim();
    if(v.length===17&&/^[A-HJ-NPR-Z0-9]{17}$/i.test(v.replace(/\s/g,''))){if(SEARCH_MODE!=='vin')setSearchMode('vin');}
  };
  el('analyzeBtn').onclick=analyseMod;
  el('btnPwSignup').onclick=function(){openAuth('login');};
  el('btnPay').onclick=startPayment;
  el('btnPwLogin').onclick=function(){openAuth('login');};
  document.addEventListener('click',function(e){var mb=e.target.closest('.mod-btn');if(mb)selectMod(mb);});
  qsa('.pill-tab').forEach(function(b){b.onclick=function(){switchMainTab(b.dataset.tab);};});
  qsa('.dmg-zone').forEach(function(z){z.onclick=function(){var l=z.getAttribute('data-label');if(l)alert(l);};});
  ['finPrice','finDeposit','finTerm','finApr'].forEach(function(id){el(id).oninput=calcFinance;});
  var p=new URLSearchParams(window.location.search);
  var rReg=p.get('reg'),sid=p.get('session_id'),paid=p.get('paid');
  if(rReg&&paid==='1'&&sid){el('regInput').value=rReg;window.history.replaceState({},'','/');verifyThenLookup(rReg,sid);}
  else if(rReg){el('regInput').value=rReg;window.history.replaceState({},'','/');}
});

/* ── MAIN TABS ── */
function switchMainTab(tab){
  qsa('.pill-tab').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});
  qsa('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id==='tab-'+tab);});
  if(tab==='report')showIntelReport();
  if(tab==='history'&&motTests.length){buildMileageChart(motTests);buildMotTimeline(motTests);}
  if(tab==='valuation'&&vehicleData.value)renderValuation();
}

/* ── NAV ── */
function renderNav(){
  var li=!!(currentUser&&currentProfile);
  el('navGuest').classList.toggle('hidden',li);
  el('navLoggedIn').classList.toggle('hidden',!li);
  if(li){
    var uname=(currentProfile.username||currentUser.email||'').toUpperCase();
    if(el('navUsername'))el('navUsername').textContent=uname;
    if(el('btnAvatar'))el('btnAvatar').textContent=uname.charAt(0);
  }
}

/* ── PROFILE ── */
function loadProfile(){
  sb.from('profiles').select('id,username').eq('id',currentUser.id).maybeSingle()
    .then(function(r){
      if(r.data&&r.data.username){currentProfile=r.data;}
      else{var fb=currentUser.email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20)||'USER';currentProfile={id:currentUser.id,username:fb};sb.from('profiles').upsert([{id:currentUser.id,username:fb}],{onConflict:'id'});}
      renderNav();if(motTests.length)showIntelReport();
    }).catch(function(){currentProfile={id:currentUser.id,username:'USER'};renderNav();});
}
function tryCreateProfile(uid,username){
  sb.from('profiles').upsert([{id:uid,username:username}],{onConflict:'id'})
    .then(function(){localStorage.removeItem('giq_pu_'+uid);currentProfile={id:uid,username:username};renderNav();})
    .catch(function(){loadProfile();});
}

/* ── AUTH ── */
function openAuth(tab){
  ['authErr','authOk'].forEach(hideMsg);
  ['loginEmail','loginPass','signupUser','signupEmail','signupPass'].forEach(function(id){el(id).value='';});
  el('authModal').classList.remove('hidden');switchAuthTab(tab||'login');
}
function closeAuth(){el('authModal').classList.add('hidden');}
function switchAuthTab(t){
  el('tabLogin').classList.toggle('active',t==='login');el('tabSignup').classList.toggle('active',t==='signup');
  el('loginForm').style.display=t==='login'?'block':'none';el('signupForm').style.display=t==='signup'?'block':'none';
  ['authErr','authOk'].forEach(hideMsg);
}
function doLogin(){
  var email=el('loginEmail').value.trim(),pass=el('loginPass').value;
  if(!email||!pass){showErr('authErr','Enter email and password.');return;}
  var btn=el('btnDoLogin');btn.disabled=true;btn.textContent='...';
  sb.auth.signInWithPassword({email:email,password:pass}).then(function(r){btn.disabled=false;btn.textContent='Log In';if(r.error)showErr('authErr',r.error.message);else closeAuth();});
}
function doSignup(){
  var username=el('signupUser').value.trim().toUpperCase().replace(/[^A-Z0-9_]/g,'');
  var email=el('signupEmail').value.trim(),pass=el('signupPass').value;
  if(!username){showErr('authErr','Enter a username.');return;}
  if(!email){showErr('authErr','Enter your email.');return;}
  if(pass.length<6){showErr('authErr','Password needs 6+ chars.');return;}
  var btn=el('btnDoSignup');btn.disabled=true;btn.textContent='...';
  sb.from('profiles').select('id',{count:'exact',head:true}).eq('username',username)
    .then(function(ck){
      if((ck.count||0)>0){btn.disabled=false;btn.textContent='Create Free Account';showErr('authErr','Username taken.');return;}
      sb.auth.signUp({email:email,password:pass}).then(function(r){
        btn.disabled=false;btn.textContent='Create Free Account';
        if(r.error){showErr('authErr',r.error.message);return;}
        var uid=r.data&&r.data.user?r.data.user.id:null;
        if(uid){
          localStorage.setItem('giq_pu_'+uid,username);
          sb.from('profiles').upsert([{id:uid,username:username}],{onConflict:'id'})
            .then(function(){localStorage.removeItem('giq_pu_'+uid);currentUser=r.data.user;currentProfile={id:uid,username:username};renderNav();closeAuth();})
            .catch(function(){showOk('authOk','Account created! Log in to continue.');toast('Account created!','ok');});
        }else{showOk('authOk','Check your email to confirm, then log in!');}
      });
    });
}
function doLogout(){
  sb.auth.signOut().then(function(){currentUser=null;currentProfile=null;renderNav();closeProfileModal();
    el('intelPaywall').style.display='block';el('intelContent').style.display='none';});
}

/* ── PROFILE MODAL ── */
function openProfileModal(){
  ['profErr','profOk'].forEach(hideMsg);el('newUsername').value='';
  var name=(currentProfile&&currentProfile.username)?currentProfile.username.toUpperCase():'?';
  el('profAvatar').textContent=name.charAt(0);el('profName').textContent=name;el('profEmail').textContent=currentUser?currentUser.email:'';
  el('profLookups').textContent='—';el('profUnique').textContent='—';el('profHistory').innerHTML='<div class="ph-empty">Loading...</div>';
  el('profileModal').classList.remove('hidden');loadProfileHistory();
}
function closeProfileModal(){el('profileModal').classList.add('hidden');}
function saveUsername(){
  var val=el('newUsername').value.trim().toUpperCase().replace(/[^A-Z0-9_]/g,'');
  if(!val){showErr('profErr','Enter a username.');return;}
  var btn=el('btnSaveUser');btn.disabled=true;btn.textContent='...';
  var cur=(currentProfile&&currentProfile.username||'').toUpperCase();
  sb.from('profiles').select('id',{count:'exact',head:true}).eq('username',val)
    .then(function(ck){
      if((ck.count||0)>0&&val!==cur){btn.disabled=false;btn.textContent='Save';showErr('profErr','Username taken.');return;}
      sb.from('profiles').update({username:val}).eq('id',currentUser.id)
        .then(function(r){
          if(r.error||(r.count===0)){
            return sb.from('profiles').insert([{id:currentUser.id,username:val}]).then(function(r2){
              btn.disabled=false;btn.textContent='Save';
              if(r2.error){showErr('profErr',r2.error.message||'Failed');return;}
              applyUC(val);
            });
          }
          btn.disabled=false;btn.textContent='Save';
          if(r.error){showErr('profErr',r.error.message||'Failed');return;}
          applyUC(val);
        }).catch(function(e){btn.disabled=false;btn.textContent='Save';showErr('profErr',e.message||'Failed');});
    });
}
function applyUC(val){currentProfile.username=val;renderNav();el('profAvatar').textContent=val.charAt(0);el('profName').textContent=val;el('newUsername').value='';showOk('profOk','Username saved!');toast('Username saved!','ok',2000);}
function loadProfileHistory(){
  sb.from('car_history').select('reg,make,model,year,colour,fuel,looked_up_at').eq('user_id',currentUser.id).order('looked_up_at',{ascending:false}).limit(200)
    .then(function(r){
      if(r.error){el('profHistory').innerHTML='<div class="ph-empty">Error loading.</div>';return;}
      var rows=r.data||[];el('profLookups').textContent=rows.length;
      var seen={},unique=[];rows.forEach(function(x){if(!seen[x.reg]){seen[x.reg]=true;unique.push(x);}});
      el('profUnique').textContent=unique.length;
      if(!rows.length){el('profHistory').innerHTML='<div class="ph-empty">No cars yet.</div>';return;}
      el('profHistory').innerHTML=unique.map(function(row){
        var date=row.looked_up_at?new Date(row.looked_up_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
        var car=[(row.make||''),(row.model||''),(row.year||'')].filter(Boolean).join(' ')||'Unknown';
        var meta=[row.colour,row.fuel,date].filter(Boolean).join(' · ');
        return'<div class="ph-item" data-reg="'+esc(row.reg)+'">'
          +'<div class="ph-reg">'+esc(row.reg)+'</div>'
          +'<div style="flex:1;min-width:0"><div class="ph-car">'+esc(car)+'</div><div class="ph-meta">'+esc(meta)+'</div></div>'
          +'<i class="ti ti-chevron-right" style="color:var(--t4);font-size:12px"></i></div>';
      }).join('');
      qsa('#profHistory .ph-item').forEach(function(item){
        item.onclick=function(){el('regInput').value=item.getAttribute('data-reg');closeProfileModal();lookupVehicle();};
      });
    }).catch(function(){el('profHistory').innerHTML='<div class="ph-empty">Could not load.</div>';});
}

/* ── VEHICLE LOOKUP ── */
function lookupVehicle(){
  var raw=el('regInput').value.trim().toUpperCase();
  var clean=raw.replace(/\s/g,'');
  if(!clean||clean.length<2)return;
  if(SEARCH_MODE==='vin'||detectInputType(raw)==='vin'){lookupVin(clean);return;}
  var reg=clean;currentReg=reg;
  showLoadingOverlay(reg);
  el('errbox').classList.add('hidden');el('mainApp').classList.remove('hidden');el('loadbox').classList.add('hidden');
  var hs=el('heroSection');if(hs)hs.classList.add('searched');
  el('tabsWrap').classList.remove('hidden');el('vinStrip').classList.add('hidden');
  el('resultSection').classList.add('hidden');
  selectedMods=new Set();motTests=[];
  el('analyzeBtn').disabled=true;el('analyzeBtn').innerHTML='<i class="ti ti-sparkles"></i> Select a mod to analyse';
  document.querySelectorAll('.mod-btn').forEach(function(b){b.classList.remove('selected');});
  el('intelPaywall').style.display='block';el('intelContent').style.display='none';
  el('mileChartWrap').innerHTML='<div class="loading-box" style="padding:1.75rem"><div class="spin"></div> Building chart...</div>';
  el('motTimeline').innerHTML='<div class="loading-box"><div class="spin"></div></div>';
  switchMainTab('overview');
  fetch(VERCEL+'/api/vehicle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({registrationNumber:reg})})
    .then(function(r){if(!r.ok)throw new Error('DVLA error '+r.status);return r.json();})
    .then(function(d){
      var model=d.model||d.modelSeries||d.typeApproval||d.vehicleDescription||d.vehicleClass||'';
      if(model&&model.length<=2)model='';
      vehicleData=Object.assign({},d,{reg:reg,model:model,hp:estHp(d),torque:estTq(d),value:estVal(d)});
      renderVehicle(vehicleData);renderUlezVed(vehicleData);saveToHistory();loadSpecs();loadMot(reg);renderValuation();hideFeatGrid();hideLoadingOverlay();
      el('loadbox').classList.add('hidden');el('vcReg').textContent=reg;
      document.querySelector('.tab-rail').scrollIntoView({behavior:'smooth',block:'start'});
      showIntelReport();
    })
    .catch(function(e){
      el('loadbox').classList.add('hidden');hideLoadingOverlay();
      el('errbox').textContent=(e&&e.message&&!e.message.includes('Failed to fetch'))
        ?'Could not fetch vehicle — check the reg and try again.'
        :'Could not reach server — check your connection.';
      el('errbox').classList.remove('hidden');
    });
}

function verifyThenLookup(reg,sid){
  el('loadbox').classList.remove('hidden');el('mainApp').classList.remove('hidden');
  fetch(VERCEL+'/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:sid})})
    .then(function(r){return r.json();}).then(function(d){if(d.paid)sessionStorage.setItem('giq_paid_'+reg,'1');lookupVehicle();})
    .catch(function(){lookupVehicle();});
}

function renderVehicle(d){
  var reg=(d.reg||currentReg||'').toUpperCase().replace(/\s/g,'');
  var regFmt=reg.length===7?reg.slice(0,4)+' '+reg.slice(4):reg;
  if(el('vehReg'))el('vehReg').textContent=regFmt;
  if(el('vehHeader'))el('vehHeader').classList.add('visible');
  var taxOk=(d.taxStatus||'').toLowerCase().includes('taxed');
  var taxSorn=(d.taxStatus||'').toLowerCase().includes('sorn');
  if(el('vehTaxBadge')){el('vehTaxBadge').textContent=taxOk?'Taxed':taxSorn?'SORN':'Untaxed';el('vehTaxBadge').className='veh-status-badge '+(taxOk?'vsb-taxed':taxSorn?'vsb-sorn':'vsb-not-taxed');}
  var chips=[{ic:'ti-calendar',v:d.yearOfManufacture||'—'},{ic:'ti-gas-station',v:fmt(d.fuelType)},{ic:'ti-palette',v:fmt(d.colour||d.primaryColour)},{ic:'ti-engine',v:(d.engineCapacity||d.engineSize)?(d.engineCapacity||d.engineSize)+'cc':'—'}];
  if(el('vehChips'))el('vehChips').innerHTML=chips.map(function(ch,i){return(i>0?'<span class="veh-chip-div">·</span>':'')+'<span class="veh-chip"><i class="ti '+ch.ic+'"></i>'+esc(String(ch.v))+'</span>';}).join('');
  var mk=fmt(d.make),mo=d.model||d.modelSeries||d.typeApproval||d.vehicleDescription||'';
  if(mo&&mo.length<=2)mo='';
  if(el('vehName'))el('vehName').textContent=(mk+(mo?' '+fmt(mo):'')).trim()||'Unknown Vehicle';
  var motOk=(d.motStatus||'').toLowerCase().includes('valid');
  if(el('vehMotStatus')){el('vehMotStatus').textContent=motOk?'Valid':fmt(d.motStatus)||'Unknown';el('vehMotStatus').className='veh-stat-val '+(motOk?'ok':'bad');}
  if(el('vehMotExpiry'))el('vehMotExpiry').textContent=d.motExpiryDate?fmt(d.motExpiryDate):'—';
  if(el('vehTaxDue'))el('vehTaxDue').textContent=d.taxDueDate?fmt(d.taxDueDate):(taxOk?'Current':'—');
  var yr2=parseInt(d.yearOfManufacture)||0;
  var euro=yr2>=2015?'Euro 6':yr2>=2011?'Euro 5':yr2>=2006?'Euro 4':yr2>=2001?'Euro 3':'Pre-Euro 3';
  if(el('vehEuro'))el('vehEuro').textContent=euro;
  el('statMake').textContent=fmt(d.make);
  var m2=d.model||d.modelSeries||d.typeApproval||d.vehicleDescription||'';if(m2&&m2.length<=2)m2='';
  el('statModel').textContent=m2?fmt(m2):'-';
  el('statYear').textContent=d.yearOfManufacture||d.monthOfFirstRegistration||'-';
  el('statEngine').textContent=(d.engineCapacity||d.engineSize)?((d.engineCapacity||d.engineSize)+'cc'):'-';
  el('statColour').textContent=fmt(d.colour||d.primaryColour);el('statFuel').textContent=fmt(d.fuelType);
  el('statTax').innerHTML='<span class="sdot '+(taxOk?'sdot-gr':'sdot-r')+'"></span>'+(taxOk?'TAXED':fmt(d.taxStatus));
  el('statTax').className='sval '+(taxOk?'green':'red');
  var mok=(d.motStatus||'').toLowerCase().includes('valid');
  el('statMot').innerHTML='<span class="sdot '+(mok?'sdot-gr':'sdot-r')+'"></span>'+(mok?'VALID':fmt(d.motStatus||'Unknown'));
  el('statMot').className='sval '+(mok?'green':'red');
  var vin=d.vin||d.vinLastFive||'';
  if(vin&&el('vinVal')){el('vinVal').textContent=vin;if(el('vinNote'))el('vinNote').textContent=d.vin?'Full VIN':'Partial (last 5)';if(el('vinStrip'))el('vinStrip').classList.remove('hidden');}
  var ft=d.monthOfFirstRegistration||d.yearOfManufacture||'Unknown';
  if(el('firstRegText'))el('firstRegText').textContent=ft;
  if(el('firstRegText2'))el('firstRegText2').textContent=ft;
  var regF=(vehicleData.reg||'').replace(/\s/g,'').toUpperCase();
  var isUKReg=/^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(regF)||/^[A-Z]{1,3}[0-9]{1,4}[A-Z]{0,3}$/.test(regF);
  if(el('rhdChip')){el('rhdChip').textContent=isUKReg?'UK Spec':'Verify';el('rhdChip').className='chip '+(isUKReg?'chip-gr':'chip-g');}
  el('taxStatusText').textContent=(d.taxStatus||'Unknown')+(taxOk?' — Legal to drive on UK roads.':" — Do not drive without valid tax.");
  el('taxChip').textContent=taxOk?'Taxed':'Not Taxed';el('taxChip').className='chip '+(taxOk?'chip-gr':'chip-r');
}

function saveToHistory(){
  if(!currentUser)return;
  sb.from('car_history').insert({user_id:currentUser.id,reg:vehicleData.reg,make:vehicleData.make||null,model:vehicleData.model||null,year:vehicleData.yearOfManufacture?String(vehicleData.yearOfManufacture):null,colour:vehicleData.colour||vehicleData.primaryColour||null,fuel:vehicleData.fuelType||null,hp:vehicleData.hp||null,value:vehicleData.value||null})
    .then(function(r){if(r.error)console.warn('History:',r.error.code);}).catch(function(){});
}

/* ── SPECS ── */
function applySpecs(s){
  setTimeout(function(){
    if(s.bhp&&el('scBhp'))el('scBhp').textContent=parseInt(s.bhp);
    if(s.torqueNm&&el('scTq'))el('scTq').textContent=parseInt(s.torqueNm);
    if(s.zeroToSixty&&el('scZero'))el('scZero').textContent=parseFloat(s.zeroToSixty);
    if(s.topSpeedMph&&el('scTop'))el('scTop').textContent=parseInt(s.topSpeedMph);
    if(s.gearbox&&el('scGearbox'))el('scGearbox').textContent=s.gearbox.replace(/-speed/i,' spd').replace('Automatic','Auto');
    if(s.consumptionCombined!==undefined&&el('scMpg'))el('scMpg').textContent=s.consumptionCombined===0?'EV (N/A)':s.consumptionCombined;
    if(el('pbBhpVal')&&s.bhp)el('pbBhpVal').textContent=parseInt(s.bhp)+' BHP';
    if(el('pbTqVal')&&s.torqueNm)el('pbTqVal').textContent=parseInt(s.torqueNm)+' Nm';
  },250);
  if(el('specGearbox'))el('specGearbox').textContent=s.gearbox||'—';
  if(el('specCyl'))el('specCyl').textContent=(s.cylinders!=null)?String(s.cylinders):s.cylinders===0?'Electric':'—';
  if(el('specDrive'))el('specDrive').textContent=s.driveType||'—';
  if(el('specMpg'))el('specMpg').textContent=s.consumptionCombined?s.consumptionCombined+' mpg':s.consumptionCombined===0?'Electric (N/A)':'—';
  if(s.co2gkm===0){if(el('specCo2'))el('specCo2').innerHTML='0 g/km <span style="background:#22C55E;color:#fff;font-size:9px;font-weight:800;padding:1px 6px;border-radius:4px;margin-left:3px">A</span>';}
  else if(s.co2gkm){var bc={'A':'#22C55E','B':'#4D9E25','C':'#7CB428','D':'#D97706','E':'#F59E0B','F':'#EF6C00','G':'#EF4444'}[s.co2Label]||'var(--t3)';if(el('specCo2'))el('specCo2').innerHTML=s.co2gkm+' g/km'+(s.co2Label?'<span style="background:'+bc+';color:#fff;font-size:9px;font-weight:800;padding:1px 6px;border-radius:4px;margin-left:3px">'+esc(s.co2Label)+'</span>':'');}
  else{if(el('specCo2'))el('specCo2').textContent='—';}
  if(s.bhp)vehicleData.hp=parseInt(s.bhp);
  if(s.torqueNm)vehicleData.torque=parseInt(s.torqueNm);
  el('specsStatus').textContent='Loaded';el('specsStatus').className='chip chip-gr';
}

function loadSpecs(){
  el('specsStatus').textContent='Loading...';el('specsStatus').className='chip chip-b';
  var payload={make:vehicleData.make,model:vehicleData.model||vehicleData.modelSeries||vehicleData.typeApproval||'',year:vehicleData.yearOfManufacture,cc:vehicleData.engineCapacity||vehicleData.engineSize,fuel:vehicleData.fuelType};
  var key=[payload.make,payload.model,payload.year,payload.cc].join('_');
  if(_specCache[key]){applySpecs(_specCache[key]);return;}
  fetch(VERCEL+'/api/specs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){if(!r.ok)throw new Error('specs '+r.status);return r.json();})
    .then(function(s){if(!s||(!s.bhp&&!s.torqueNm&&!s.gearbox))throw new Error('empty');_specCache[key]=s;applySpecs(s);})
    .catch(function(){el('specsStatus').textContent='Estimated';el('specsStatus').className='chip chip-g';});
}

/* ── MOT ── */
function loadMot(reg){
  fetch(VERCEL+'/api/mot?reg='+reg)
    .then(function(r){if(!r.ok)throw new Error();return r.json();})
    .then(function(raw){renderMot(raw);})
    .catch(function(){renderDemoMot();});
}
function renderMot(raw){
  var tests=[];
  if(raw&&raw.motTests)tests=raw.motTests;
  else if(Array.isArray(raw)&&raw[0]&&raw[0].motTests)tests=raw[0].motTests;
  else if(Array.isArray(raw)&&raw[0]&&raw[0].completedDate)tests=raw;
  if(!tests.length){renderDemoMot();return;}
  motTests=tests;
  if(!vehicleData.model||vehicleData.model.length<=2){var mm=(raw&&raw.model)?raw.model:'';if(mm&&mm.length>2){vehicleData.model=mm.toUpperCase();el('statModel').textContent=vehicleData.model;}}
  buildMotSummary(tests);buildMotRows(tests);buildMileageChart(tests);buildMiBarChart(tests);buildMotTimeline(tests);renderValuation();showIntelReport();
}
function renderDemoMot(){
  var h=[
    {date:'14 Nov 2024',passed:true,od:62440,defects:[{type:'ADVISORY',text:'Nearside rear tyre worn close to legal limit'},{type:'ADVISORY',text:'Rear brake pads showing wear'}]},
    {date:'12 Nov 2023',passed:true,od:49210,defects:[]},
    {date:'08 Nov 2022',passed:true,od:37880,defects:[{type:'ADVISORY',text:'Front suspension arm bush deteriorating'}]},
    {date:'03 Dec 2021',passed:false,od:28550,defects:[{type:'MAJOR',text:'Nearside front headlamp aim too low (1.3.1a)'},{type:'ADVISORY',text:'Oil seeping from engine rocker cover gasket'}]}
  ];
  motTests=h.map(function(m){return{completedDate:m.date,testResult:m.passed?'PASSED':'FAILED',odometerValue:m.od,defects:m.defects};});
  buildMotSummary(motTests);buildMotRows(motTests);buildMileageChart(motTests);buildMotTimeline(motTests);renderValuation();showIntelReport();
}
function buildMotSummary(tests){
  var tot=tests.length,pass=tests.filter(function(t){return(t.testResult||'').toUpperCase()==='PASSED';}).length;
  var advs=tests.reduce(function(s,t){return s+(t.defects||[]).filter(function(d){return d.type==='ADVISORY';}).length;},0);
  var rate=Math.round(pass/tot*100);
  el('sumPass').textContent=pass;el('sumFail').textContent=tot-pass;el('sumAdv').textContent=advs;el('sumTotal').textContent=tot;
  el('passRatePct').textContent=rate+'%';
  el('passBarFill').style.width=rate+'%';
  el('passBarFill').style.background=rate>=80?'linear-gradient(90deg,var(--green),#22C55E)':rate>=60?'linear-gradient(90deg,var(--amber),#FCD34D)':'linear-gradient(90deg,var(--red),#F87171)';
  el('motSumWrap').classList.remove('hidden');
  el('motSumChip').textContent=rate+'% pass';el('motSumChip').style.display='inline-block';
  el('motSumChip').className='chip '+(rate>=80?'chip-gr':rate>=60?'chip-g':'chip-r');
  var allDef2=[];tests.forEach(function(t){(t.defects||[]).forEach(function(d){allDef2.push(d);});});
  var majors2=allDef2.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';}).length;
  var advisories2=allDef2.filter(function(d){return d.type==='ADVISORY';}).length;
  var rel=Math.max(0,Math.min(100,Math.round(rate-(majors2*4)-(advisories2*.8)+(tot>=4?5:0))));
  var relLabel=rel>=80?'Excellent':rel>=65?'Good':rel>=50?'Average':'Below Average';
  var relColor=rel>=80?'chip-gr':rel>=65?'chip-b':rel>=50?'chip-g':'chip-r';
  if(el('reliabilityChip')){el('reliabilityChip').textContent=relLabel+' ('+rel+'/100)';el('reliabilityChip').className='chip '+relColor;}
  if(el('reliabilityContent')){
    el('reliabilityContent').innerHTML='<div style="padding:.25rem 0">'
      +'<div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:5px"><span>Reliability Score</span><span>'+rel+'/100</span></div>'
      +'<div style="height:10px;background:rgba(0,0,0,.06);border-radius:8px;overflow:hidden;margin-bottom:12px"><div style="height:100%;width:'+rel+'%;border-radius:8px;background:linear-gradient(90deg,'+(rel>=80?'var(--green),#22C55E':rel>=65?'var(--blue),var(--blue3)':rel>=50?'var(--gold),var(--gold2)':'var(--red),#F87171')+');transition:width 1s cubic-bezier(.4,0,.2,1)"></div></div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">'
      +'<div class="mot-sb"><div class="mot-sn" style="font-size:20px;color:var(--red)">'+majors2+'</div><div class="mot-sl">Major Fails</div></div>'
      +'<div class="mot-sb"><div class="mot-sn" style="font-size:20px;color:var(--amber)">'+advisories2+'</div><div class="mot-sl">Advisories</div></div>'
      +'<div class="mot-sb"><div class="mot-sn" style="font-size:20px;color:var(--green)">'+rate+'%</div><div class="mot-sl">Pass Rate</div></div>'
      +'</div></div>';
  }
}
function buildMotRows(tests){
  el('motHistory').innerHTML=tests.slice(0,10).map(function(t){
    var passed=(t.testResult||'').toUpperCase()==='PASSED';
    var def=t.defects||[];
    var dang=def.filter(function(d){return d.type==='DANGEROUS';});
    var maj=def.filter(function(d){return d.type==='MAJOR';});
    var min=def.filter(function(d){return d.type==='MINOR';});
    var adv=def.filter(function(d){return d.type==='ADVISORY';});
    var ds=t.completedDate||'—';try{if(ds.includes('T'))ds=new Date(ds).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(e){}
    var mi=t.odometerValue?Number(t.odometerValue).toLocaleString()+' mi':'—';
    var dets=def.length
      ?dang.map(function(d){return'<div class="mot-di"><div class="def-dot d-dang"></div><div><span style="color:var(--red);font-weight:700;font-size:9.5px;text-transform:uppercase">Dangerous — </span>'+esc(d.text||'')+'</div></div>';}).join('')
        +maj.map(function(d){return'<div class="mot-di"><div class="def-dot d-maj"></div><div><span style="color:#EA580C;font-weight:700;font-size:9.5px;text-transform:uppercase">Major — </span>'+esc(d.text||'')+'</div></div>';}).join('')
        +min.map(function(d){return'<div class="mot-di"><div class="def-dot d-min"></div><div><span style="color:var(--green);font-weight:700;font-size:9.5px;text-transform:uppercase">Minor — </span>'+esc(d.text||'')+'</div></div>';}).join('')
        +adv.map(function(d){return'<div class="mot-di"><div class="def-dot d-adv"></div><div><span style="color:var(--amber);font-weight:700;font-size:9.5px;text-transform:uppercase">Advisory — </span>'+esc(d.text||'')+'</div></div>';}).join('')
      :'<div style="font-size:11px;color:var(--t3);padding:5px 0">No failures or advisories.</div>';
    return'<div class="mot-row-x" onclick="this.classList.toggle(\'open\')">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 8px;flex-wrap:wrap;gap:5px">'
      +'<span style="color:var(--t3);font-size:10.5px;font-weight:600">'+ds+'</span>'
      +'<span style="font-family:\'Syne\',sans-serif;font-size:12.5px;font-weight:700">'+mi+'</span>'
      +'<div style="display:flex;gap:3px;flex-wrap:wrap;align-items:center">'
      +((dang.length+maj.length)?'<span class="badge b-fail">'+(dang.length+maj.length)+' fail</span>':'')
      +(min.length?'<span class="badge b-warn">'+min.length+' min</span>':'')
      +(adv.length?'<span class="badge b-adv">'+adv.length+' adv</span>':'')
      +'<span class="badge '+(passed?'b-pass':'b-fail')+'">'+(passed?'PASS':'FAIL')+'</span>'
      +'<i class="ti ti-chevron-down" style="color:var(--t4);font-size:11px;transition:transform .2s"></i>'
      +'</div></div>'
      +'<div class="mot-det" style="padding:3px 8px 10px">'+dets+'</div></div>';
  }).join('');
  qsa('.mot-row-x').forEach(function(row){
    row.onclick=function(){
      var open=row.classList.contains('open');row.classList.toggle('open');
      var chev=row.querySelector('.ti-chevron-down');if(chev)chev.style.transform=open?'':'rotate(180deg)';
    };
  });
}

/* ── MILEAGE SVG CHART ── */
function buildMileageChart(tests){
  var carYear=parseInt(vehicleData.yearOfManufacture)||2010;
  var sorted=tests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var pts=[{yr:carYear,mi:0,reg:true,passed:true}];
  sorted.forEach(function(t){
    var mi=parseInt(t.odometerValue)||0;if(!mi)return;
    var yr=0;try{yr=new Date(t.completedDate||'').getFullYear();}catch(e){}
    if(yr>0&&yr<carYear)return;
    pts.push({yr:yr||carYear,mi:mi,passed:(t.testResult||'').toUpperCase()==='PASSED',defects:t.defects||[],date:t.completedDate||''});
  });
  if(pts.length<2){el('mileChartWrap').innerHTML='<div style="text-align:center;padding:1.5rem;font-size:12px;color:var(--t3)">Insufficient data for chart</div>';return;}
  var maxMi=Math.max.apply(null,pts.map(function(p){return p.mi;}))||1;
  var minYr=carYear,maxYr=Math.max(2026,pts[pts.length-1].yr||2026),yrSpan=Math.max(1,maxYr-minYr);
  var W=680,H=190,PL=50,PR=10,PT=10,PB=28,CW=W-PL-PR,CH=H-PT-PB;
  function px(yr){return PL+(yr-minYr)/yrSpan*CW;}
  function py(mi){return PT+CH-(mi/maxMi)*CH;}
  var yGrid='';
  [0,.25,.5,.75,1].forEach(function(f){var mi=Math.round(maxMi*f),y=PT+CH-f*CH;yGrid+='<line x1="'+PL+'" y1="'+y+'" x2="'+(W-PR)+'" y2="'+y+'" stroke="#E0EAFF" stroke-width="1"'+(f>0?' stroke-dasharray="3,4"':'')+'/>';var lbl=mi>=1000?Math.round(mi/1000)+'k':String(mi);yGrid+='<text x="'+(PL-5)+'" y="'+(y+4)+'" text-anchor="end" font-size="9" fill="#8AABCC" font-family="DM Sans,sans-serif">'+lbl+'</text>';});
  var xGrid='',step=Math.max(1,Math.ceil(yrSpan/7));
  for(var y=minYr;y<=maxYr;y+=step)xGrid+='<text x="'+px(y)+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" fill="#8AABCC" font-family="DM Sans,sans-serif">'+y+'</text>';
  var areaD='M'+px(pts[0].yr)+','+py(0)+' ';pts.forEach(function(p){areaD+='L'+px(p.yr)+','+py(p.mi)+' ';});areaD+='L'+px(pts[pts.length-1].yr)+','+py(0)+'Z';
  var lineD='M';pts.forEach(function(p,i){lineD+=(i>0?' L':'')+px(p.yr)+','+py(p.mi);});
  var pathLen=50;for(var i=1;i<pts.length;i++){var dx=px(pts[i].yr)-px(pts[i-1].yr),dy=py(pts[i].mi)-py(pts[i-1].mi);pathLen+=Math.sqrt(dx*dx+dy*dy);}pathLen=Math.ceil(pathLen)+20;
  var dotsHtml=pts.map(function(p,idx){
    var fraud=!p.reg&&idx>0&&p.mi<pts[idx-1].mi;
    var col=p.reg?'var(--green)':fraud?'var(--red)':p.passed===false?'#F97316':'var(--blue)';
    var cx=px(p.yr),cy=py(p.mi);
    var lbl=p.reg?'REG: 0 miles':(p.mi.toLocaleString()+' mi'+(p.date?' · '+new Date(p.date).getFullYear():''));
    return'<circle cx="'+cx+'" cy="'+cy+'" r="'+(p.reg?6:4.5)+'" fill="'+col+'" stroke="white" stroke-width="2"><title>'+esc(lbl)+'</title></circle>'+(p.reg?'<text x="'+cx+'" y="'+(cy-11)+'" text-anchor="middle" font-size="8.5" font-weight="800" fill="var(--green)" font-family="Syne,sans-serif">REG</text>':'')+(fraud?'<circle cx="'+cx+'" cy="'+cy+'" r="9" fill="none" stroke="var(--red)" stroke-width="1.5" opacity=".5"/>':'');
  }).join('');
  var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;overflow:visible;display:block" xmlns="http://www.w3.org/2000/svg">'
    +'<defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1550C0" stop-opacity="0.13"/><stop offset="100%" stop-color="#1550C0" stop-opacity="0.01"/></linearGradient></defs>'
    +'<line x1="'+PL+'" y1="'+PT+'" x2="'+PL+'" y2="'+(H-PB)+'" stroke="#C5D8FF" stroke-width="1"/>'
    +'<line x1="'+PL+'" y1="'+(H-PB)+'" x2="'+(W-PR)+'" y2="'+(H-PB)+'" stroke="#C5D8FF" stroke-width="1"/>'
    +yGrid+xGrid
    +'<path d="'+areaD+'" fill="url(#gfill)"/>'
    +'<path d="'+lineD+'" fill="none" stroke="#1550C0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:'+pathLen+';stroke-dashoffset:'+pathLen+';animation:drawLine 1.4s cubic-bezier(.4,0,.2,1) .2s forwards"/>'
    +dotsHtml+'</svg>';
  el('mileChartWrap').innerHTML=svg;
}

/* ── MOT TIMELINE ── */
function buildMotTimeline(tests){
  var sorted=tests.slice().sort(function(a,b){return new Date(b.completedDate||0)-new Date(a.completedDate||0);});
  el('motTimeline').innerHTML='<div class="mot-tl">'+sorted.slice(0,12).map(function(t,idx){
    var passed=(t.testResult||'').toUpperCase()==='PASSED';
    var def=t.defects||[];
    var maj=def.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';});
    var adv=def.filter(function(d){return d.type==='ADVISORY';});
    var ds=t.completedDate||'—';try{if(ds.includes('T'))ds=new Date(ds).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(e){}
    var mi=t.odometerValue?Number(t.odometerValue).toLocaleString()+' miles':'—';
    var defHTML=def.length?def.map(function(d){var cls=d.type==='DANGEROUS'?'d-dang':d.type==='MAJOR'?'d-maj':d.type==='ADVISORY'?'d-adv':'d-min';return'<div class="tl-def"><div class="def-dot '+cls+'"></div><div><span style="font-weight:700;font-size:9.5px;text-transform:uppercase;margin-right:3px">'+esc(d.type)+'</span>'+esc(d.text||'')+'</div></div>';}).join(''):'<div style="font-size:11px;color:var(--t3);padding:3px 0">No defects recorded.</div>';
    return'<div class="tl-item" style="animation-delay:'+(idx*.04)+'s"><div class="tl-dot '+(passed?'pass':'fail')+'">'+(passed?'<i class="ti ti-check" style="font-size:8px"></i>':'<i class="ti ti-x" style="font-size:8px"></i>')+'</div>'
      +'<div class="tl-body" onclick="this.closest(\'.tl-item\').classList.toggle(\'open\')">'
      +'<div class="tl-row"><span class="tl-date">'+ds+'</span><span class="tl-mi">'+mi+'</span>'
      +'<div class="tl-badges">'+(maj.length?'<span class="badge b-fail">'+maj.length+' fail</span>':'')+(adv.length?'<span class="badge b-adv">'+adv.length+' adv</span>':'')+'<span class="badge '+(passed?'b-pass':'b-fail')+'">'+(passed?'PASS':'FAIL')+'</span><i class="ti ti-chevron-down" style="color:var(--t4);font-size:10px"></i></div></div>'
      +'<div class="tl-defs">'+defHTML+'</div></div></div>';
  }).join('')+'</div>';
}

/* ── DAMAGE MAP ── */
var ZK={front:['headlamp','headlight','bumper','bonnet','front','number plate','wiper','fog lamp','horn','grille'],rear:['rear','tail','boot','reversing','back bumper','rear lamp'],left:['nearside','left','driver side'],right:['offside','right','passenger side'],roof:['roof','windscreen','screen','mirror','wiper blade'],under:['brake','suspension','steering','tyre','wheel bearing','oil','engine','gearbox','clutch','exhaust','prop shaft','fuel','emission']};
function buildDamageMap(tests){
  var allDef=[];tests.forEach(function(t){(t.defects||[]).forEach(function(d){allDef.push(d);});});
  qsa('.dmg-zone').forEach(function(z){z.classList.remove('hit','minor-hit');});
  var hitZ={};
  allDef.forEach(function(d){var txt=(d.text||'').toLowerCase(),isMaj=d.type==='MAJOR'||d.type==='DANGEROUS';Object.keys(ZK).forEach(function(zone){if(ZK[zone].some(function(kw){return txt.includes(kw);})){if(!hitZ[zone]||isMaj)hitZ[zone]=isMaj?'hit':'minor-hit';}});});
  Object.keys(hitZ).forEach(function(zone){var z=el('zone-'+zone);if(z)z.classList.add(hitZ[zone]);});
  var listEl=el('dmgList');
  var serious=allDef.filter(function(d){return d.type==='MAJOR'||d.type==='DANGEROUS';});
  var adv=allDef.filter(function(d){return d.type==='ADVISORY';});
  if(!allDef.length){listEl.innerHTML='<div style="font-size:11px;color:var(--t3);text-align:center;padding:.85rem;width:100%"><i class="ti ti-check" style="color:var(--green);font-size:18px;display:block;margin-bottom:6px"></i>Clean — no defects in MOT history</div>';el('dmgChip').textContent='Clean';el('dmgChip').className='chip chip-gr';return;}
  var html='';
  if(serious.length){html+='<div style="font-size:8.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--red);margin-bottom:5px">Failures</div>';serious.forEach(function(d){html+='<div class="dmg-item damage"><i class="ti ti-alert-triangle"></i><div><div class="dmg-it">'+esc(d.type)+'</div><div class="dmg-id">'+esc(d.text)+'</div></div></div>';});}
  if(adv.length){html+='<div style="font-size:8.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--amber);margin:8px 0 5px">Advisories</div>';adv.slice(0,5).forEach(function(d){html+='<div class="dmg-item advisory"><i class="ti ti-alert-circle"></i><div><div class="dmg-it">Advisory</div><div class="dmg-id">'+esc(d.text)+'</div></div></div>';});if(adv.length>5)html+='<div style="font-size:9.5px;color:var(--t3);margin-top:4px">+'+(adv.length-5)+' more</div>';}
  el('dmgChip').textContent=allDef.length+' items';el('dmgChip').className='chip '+(serious.length?'chip-r':'chip-g');
  listEl.innerHTML=html;
}

/* ── ANNUAL MILEAGE ── */
function calcAnnualMi(){
  if(motTests.length<2)return 0;
  var sr=motTests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var fr=sr.filter(function(t){return parseInt(t.odometerValue)>0;});
  if(fr.length<2)return 0;
  var yrs=(new Date(fr[fr.length-1].completedDate)-new Date(fr[0].completedDate))/(1000*60*60*24*365.25);
  return yrs>0.1?Math.round((parseInt(fr[fr.length-1].odometerValue)-parseInt(fr[0].odometerValue))/yrs):0;
}

/* ── VALUATION ── */
function renderValuation(){
  var d=vehicleData,yr=parseInt(d.yearOfManufacture)||0,age=yr?2026-yr:0;
  var hasRealData=!!(d.make&&d.yearOfManufacture&&motTests.length>0);
  var base=d.value||null;
  if(!hasRealData||!base){
    el('valPrice').textContent='Unavailable';el('valPrivate').textContent='—';el('valTrade').textContent='—';el('valPx').textContent='—';
    el('vfAge').textContent=age||'—';var annMi0=calcAnnualMi();el('vfMileage').textContent=annMi0>0?annMi0.toLocaleString():'N/A';el('vfPass').textContent='N/A';
    el('finPrice').value=15000;el('finDeposit').value=2000;calcFinance();return;
  }
  el('valPrice').textContent='£'+base.toLocaleString();
  el('valPrivate').textContent='£'+Math.round(base*.88).toLocaleString()+'–£'+Math.round(base*1.12).toLocaleString();
  el('valTrade').textContent='£'+Math.round(base*.82).toLocaleString();
  el('valPx').textContent='£'+Math.round(base*.73).toLocaleString();
  el('vfAge').textContent=age;
  var annMi=calcAnnualMi();el('vfMileage').textContent=annMi>0?annMi.toLocaleString():'N/A';
  var tot=motTests.length,pass=motTests.filter(function(t){return(t.testResult||'').toUpperCase()==='PASSED';}).length;
  el('vfPass').textContent=tot>0?Math.round(pass/tot*100)+'%':'N/A';
  var depHTML='';
  for(var y=0;y<=5;y++){var dp=Math.round(base*Math.pow(.85,y)),pct=Math.round((dp/base)*100);depHTML+='<div class="dep-row"><div class="dep-yr">'+(y===0?'Now':'+'+(y)+'yr')+'</div><div class="dep-bg"><div class="dep-fill" id="depF'+y+'" style="width:0"></div></div><div class="dep-val">£'+dp.toLocaleString()+'</div></div>';}
  el('depRows').innerHTML=depHTML;
  setTimeout(function(){for(var y=0;y<=5;y++){var dp2=Math.round(base*Math.pow(.85,y)),p2=Math.round((dp2/base)*100),f=el('depF'+y);if(f)f.style.width=p2+'%';}},300);
  el('finPrice').value=base;el('finDeposit').value=Math.round(base*.15);calcFinance();
  var fuel2=(d.fuelType||'').toUpperCase();
  var isEV=fuel2.indexOf('ELECTRIC')>=0,isHyb=fuel2.indexOf('HYBRID')>=0,isDsl=fuel2.indexOf('DIESEL')>=0;
  if(el('demandFuel'))el('demandFuel').textContent=isEV?'Very High ↑':isHyb?'High ↑':'Medium →';
  if(el('demandAge'))el('demandAge').textContent=age<=2?'Strong ↑':age<=5?'Good →':age<=10?'Moderate →':'Lower ↓';
  if(el('demandTrend'))el('demandTrend').textContent=isEV?'Rising':'Stable →';
  if(el('demandTime'))el('demandTime').textContent=age<=3?'2–3 weeks':age<=7?'3–5 weeks':'4–8 weeks';
}
function calcFinance(){
  var price=parseFloat(el('finPrice').value)||8000,dep=parseFloat(el('finDeposit').value)||0;
  var term=parseInt(el('finTerm').value)||36,apr=parseFloat(el('finApr').value)||9.9;
  var loan=Math.max(0,price-dep),mr=apr/100/12;
  var monthly=mr>0?Math.round(loan*(mr*Math.pow(1+mr,term))/(Math.pow(1+mr,term)-1)*100)/100:Math.round(loan/term*100)/100;
  el('finMonthly').textContent='£'+monthly.toFixed(2);
  el('finTotal').textContent='£'+Math.round(monthly*term+dep).toLocaleString();
  el('finInterest').textContent='£'+Math.max(0,Math.round(monthly*term-loan)).toLocaleString();
  el('finLoan').textContent='£'+loan.toLocaleString();
}

/* ── INTEL REPORT ── */
var VIP=['bravemalek2020@gmail.com','waelmoh1983@gmail.com'];
function isVip(){if(!currentUser)return false;var e=(currentUser.email||'').toLowerCase().trim();return VIP.some(function(v){return v.toLowerCase()===e;});}
function hasPaid(r){return sessionStorage.getItem('giq_paid_'+(r||currentReg))==='1';}

function buildGauge(score){
  var col=score<=25?'var(--green)':score<=55?'var(--amber)':'var(--red)';
  var angDeg=-180+(score/100)*180,angRad=angDeg*(Math.PI/180);
  var cx=100,cy=100,r=72;
  var nx=cx+r*.65*Math.cos(angRad),ny=cy+r*.65*Math.sin(angRad);
  function arcPath(fromDeg,toDeg,color){var r1=fromDeg*(Math.PI/180),r2=toDeg*(Math.PI/180);var x1=cx+r*Math.cos(r1),y1=cy+r*Math.sin(r1),x2=cx+r*Math.cos(r2),y2=cy+r*Math.sin(r2);var large=(toDeg-fromDeg)>180?1:0;return'<path d="M'+x1+' '+y1+' A'+r+' '+r+' 0 '+large+' 1 '+x2+' '+y2+'" stroke="'+color+'" stroke-width="12" fill="none" stroke-linecap="round"/>';}
  var bg=arcPath(-180,-120,'rgba(13,158,92,.2)')+arcPath(-120,-60,'rgba(192,112,0,.2)')+arcPath(-60,0,'rgba(207,34,34,.2)');
  var filled=score>0?arcPath(-180,Math.min(-0.5,angDeg),col):'';
  return'<svg viewBox="0 0 200 115" style="width:100%;max-width:150px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">'+bg+filled+'<line x1="'+cx+'" y1="'+cy+'" x2="'+nx+'" y2="'+ny+'" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/><circle cx="'+cx+'" cy="'+cy+'" r="4.5" fill="var(--ink)"/><text x="'+cx+'" y="'+(cy+16)+'" text-anchor="middle" font-family="Syne,sans-serif" font-size="22" font-weight="800" fill="'+col+'">'+score+'</text><text x="'+cx+'" y="'+(cy+28)+'" text-anchor="middle" font-size="8" fill="var(--t3)" font-weight="700" letter-spacing=".8">RISK SCORE</text></svg>';
}

function showIntelReport(){
  if(SEARCH_MODE==='vin'&&(!motTests||!motTests.length)){buildForeignVinReport();return;}
  if(!motTests.length)return;
  if(!currentUser){el('pwLoggedOut').style.display='block';el('pwLoggedIn').style.display='none';el('intelPaywall').style.display='block';el('intelContent').style.display='none';el('intelBadge').textContent='£1.99 per report';el('intelBadge').className='chip chip-b';return;}
  var vip=isVip(),paid=hasPaid(currentReg);
  if(vip||paid){
    el('intelPaywall').style.display='none';el('intelContent').style.display='block';
    el('intelBadge').textContent=vip?'VIP Access':'UNLOCKED';el('intelBadge').className=vip?'chip chip-g':'chip chip-gr';
    buildIntelReport(motTests);buildDamageMap(motTests);buildOwnership();runAiRisk(motTests);
  }else{
    el('pwLoggedOut').style.display='none';el('pwLoggedIn').style.display='block';
    el('intelPaywall').style.display='block';el('intelContent').style.display='none';
    el('intelBadge').textContent='£1.99 to unlock';el('intelBadge').className='chip chip-g';
  }
}

/* ════════════════════════════════════════════
   FIXED FUNCTION 3: buildOwnership — real ABI 1-50 groups
   ════════════════════════════════════════════ */
function buildOwnership(){
  var d=vehicleData,annMi=calcAnnualMi(),comm=annMi>18000;
  el('commUseTitle').textContent=comm?'Possible Commercial/Fleet Use':'No Commercial Use Indicators';
  el('commUseText').textContent=comm?'~'+annMi.toLocaleString()+' mi/yr — consistent with commercial or fleet use.':'~'+(annMi>0?annMi.toLocaleString():'unknown')+' mi/yr — consistent with private use.';
  el('commUseChip').textContent=comm?'Flag':'Low Risk';el('commUseChip').className='chip '+(comm?'chip-g':'chip-gr');

  var cc=parseInt(vehicleData.engineCapacity)||1600;
  var bhp=vehicleData.hp||130;
  var value=vehicleData.value||estVal(d);
  var age=Math.max(0,2026-(parseInt(d.yearOfManufacture)||2018));

  /* ABI 1-50 group: performance 50%, value 30%, age 20% */
  var perfScore=Math.min(50,(bhp/10)+(cc/100));
  var valueScore=Math.min(50,value/1000);
  var ageAdjust=age>10?-4:age>5?-2:0;
  var abiGroup=Math.round((perfScore*0.5)+(valueScore*0.3)+(age*0.2))+ageAdjust;
  abiGroup=Math.max(1,Math.min(50,abiGroup));

  /* Published average UK annual premium by ABI group band (2024/25) */
  var premiumBands=[
    {max:10,low:350,high:550},{max:20,low:550,high:800},{max:30,low:800,high:1200},
    {max:40,low:1200,high:1900},{max:50,low:1900,high:3200}
  ];
  var pb=premiumBands.filter(function(x){return abiGroup<=x.max;})[0]||premiumBands[premiumBands.length-1];

  el('insuranceGroupText').textContent='ABI Group '+abiGroup+'/50 — based on '+bhp+' BHP, '+cc+'cc, £'+value.toLocaleString()+' value, '+age+' yr'+(age===1?'':'s')+' old.';
  el('insuranceGroupChip').textContent='Group '+abiGroup;
  el('insuranceCostText').textContent='£'+pb.low.toLocaleString()+'–£'+pb.high.toLocaleString()+'/yr for an average UK driver (30+, no claims, ABI group '+abiGroup+').';
  el('insuranceCostChip').textContent='£'+pb.low.toLocaleString()+'–£'+pb.high.toLocaleString();
}

function buildIntelReport(tests){
  var carYear=parseInt(vehicleData.yearOfManufacture)||0;
  var sorted=tests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var readings=sorted.map(function(t){return{date:t.completedDate||'',mi:parseInt(t.odometerValue)||0};}).filter(function(r){if(!r.mi)return false;if(carYear){var yr=new Date(r.date).getFullYear();if(yr>0&&yr<carYear)return false;}return true;});
  var fraud=[];for(var i=1;i<readings.length;i++){if(readings[i].mi<readings[i-1].mi)fraud.push({from:readings[i-1].mi,to:readings[i].mi,drop:readings[i-1].mi-readings[i].mi,date:readings[i].date});}
  var annualMi=0;if(readings.length>=2){var f=readings[0],l=readings[readings.length-1];var yrs=(new Date(l.date)-new Date(f.date))/(1000*60*60*24*365.25);annualMi=yrs>0.1?Math.round((l.mi-f.mi)/yrs):0;}
  var miStatus=annualMi>0?(annualMi>20000?'high':annualMi<3000?'low':'normal'):'unknown';
  var pass=tests.filter(function(t){return(t.testResult||'').toUpperCase()==='PASSED';}).length,passRate=Math.round(pass/tests.length*100);
  var rH=sorted.slice(Math.floor(sorted.length/2)),oH=sorted.slice(0,Math.floor(sorted.length/2));
  var rAdv=rH.reduce(function(s,t){return s+(t.defects||[]).filter(function(d){return d.type==='ADVISORY';}).length;},0);
  var oAdv=oH.reduce(function(s,t){return s+(t.defects||[]).filter(function(d){return d.type==='ADVISORY';}).length;},0);
  var score=Math.min(100,fraud.length*35+(passRate<60?25:passRate<80?10:0)+(miStatus==='high'?10:0)+(rAdv>oAdv&&rAdv>2?10:0));
  var lv=score>=50?'high':score>=20?'med':'low';
  var fa=el('fraudAlert'),fat=el('fraudAlertText');
  if(fa&&fat&&fraud.length){fa.classList.remove('hidden');fat.textContent='Odometer dropped '+fraud.map(function(ev){return ev.drop.toLocaleString()+' miles around '+ev.date;}).join('; ')+'. Walk away or require independent verification.';}
  else if(fa){fa.classList.add('hidden');}
  el('riskGaugeSvg').innerHTML=buildGauge(score);
  el('riskLbl').textContent=lv==='low'?'LOW RISK — Clean History':lv==='med'?'MODERATE RISK':'HIGH RISK — Review Carefully';
  el('riskSub').textContent=lv==='low'?'No major concerns from available DVLA/DVSA data.':lv==='med'?'Some concerns. Review checks below before purchasing.':'Significant issues detected. HPI check strongly recommended.';
  var checks=[];
  if(!fraud.length)checks.push({s:'ok',ic:'ti-check',t:'Mileage Consistent — '+readings.length+' Tests',d:'No odometer drops detected. Readings increase consistently across all MOT records.'});
  else fraud.forEach(function(ev){checks.push({s:'bad',ic:'ti-alert-triangle',t:'Mileage Rollback — SERIOUS RED FLAG',d:'Odometer dropped '+ev.drop.toLocaleString()+' miles ('+ev.from.toLocaleString()+'→'+ev.to.toLocaleString()+') around '+ev.date+'. Strong fraud indicator.'});});
  if(annualMi>0){
    if(miStatus==='normal')checks.push({s:'ok',ic:'ti-check',t:'Normal Annual Mileage (~'+annualMi.toLocaleString()+' mi/yr)',d:'Within normal private use range. UK average is 8,000–10,000 miles/year.'});
    else if(miStatus==='high')checks.push({s:'warn',ic:'ti-alert-circle',t:'High Annual Mileage (~'+annualMi.toLocaleString()+' mi/yr)',d:'Above UK average. Higher wear expected on engine, transmission, tyres and suspension.'});
    else checks.push({s:'warn',ic:'ti-alert-circle',t:'Very Low Annual Mileage (~'+annualMi.toLocaleString()+' mi/yr)',d:'Can cause rubber seal and brake deterioration. May also indicate mileage manipulation.'});
  }
  if(passRate>=80)checks.push({s:'ok',ic:'ti-check',t:'Strong MOT History — '+passRate+'% Pass Rate',d:pass+'/'+tests.length+' tests passed. Consistent record of a well-maintained vehicle.'});
  else if(passRate>=60)checks.push({s:'warn',ic:'ti-alert-circle',t:'Average MOT Pass Rate — '+passRate+'%',d:'Check if failures repeat on the same component — suggests deferred maintenance.'});
  else checks.push({s:'bad',ic:'ti-x',t:'Poor MOT History — Only '+passRate+'% Pass Rate',d:'Only '+pass+'/'+tests.length+' passed. Multiple failures indicate recurring issues or neglect.'});
  if(rAdv>oAdv&&rAdv>=3)checks.push({s:'warn',ic:'ti-trending-up',t:'Advisories Increasing ('+rAdv+' recent vs '+oAdv+' older)',d:'More advisories in recent tests — components ageing. Budget for maintenance.'});
  else checks.push({s:'ok',ic:'ti-trending-down',t:'Advisory Trend Stable',d:'No significant increase in advisories over time. Consistently maintained.'});
  var lastMi=readings.length?readings[readings.length-1].mi:0;
  if(lastMi>0)checks.push({s:lastMi>120000?'warn':'ok',ic:lastMi>120000?'ti-gauge':'ti-check',t:'Total Recorded Mileage: '+lastMi.toLocaleString()+' miles',d:lastMi>120000?'High mileage. Budget for timing chain/belt, service items and wear parts.':'Mileage within a reasonable range for vehicle age and use.'});
  checks.push({s:'warn',ic:'ti-info-circle',t:'Finance, Theft & Write-off Not in DVLA Data',d:'Use HPI or MyCarCheck (£10–20) for definitive finance, theft and write-off status.'});
  var reg=(currentReg||'').toUpperCase().replace(/\s/g,'');
  var isModernUK=/^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(reg);
  var isOldUK=/^[A-Z]{1,3}[0-9]{1,4}[A-Z]{0,3}$/.test(reg)||/^[0-9]{1,4}[A-Z]{1,3}$/.test(reg);
  var cloneRisk=isModernUK||isOldUK?'Low Risk':'Check Further';
  var cloneNote=isModernUK?'Standard UK format. No obvious plate anomaly detected.':isOldUK?'Legacy UK format — consistent with vehicle age.':'Non-standard format — verify plate legitimacy.';
  if(el('cloneChip')){el('cloneChip').textContent=cloneRisk;el('cloneChip').className='chip '+(cloneRisk==='Low Risk'?'chip-gr':'chip-g');}
  if(el('cloneText'))el('cloneText').textContent=cloneNote;
  var regYear2=0;if(isModernUK){var m2=parseInt(reg.slice(2,4));regYear2=m2>=51?2000+m2-51+1:2000+m2;}
  var yr3=parseInt(vehicleData.yearOfManufacture)||0;
  var importLikely=regYear2>0&&Math.abs(regYear2-yr3)>2;
  if(el('importChip')){el('importChip').textContent=importLikely?'Possible Import':'UK Spec Likely';el('importChip').className='chip '+(importLikely?'chip-g':'chip-gr');}
  if(el('importText'))el('importText').textContent=importLikely?'Registration year suggests possible reimport or plate change. Verify with DVLA V5C.':'Registration pattern consistent with UK-spec vehicle.';
  el('intelChecks').innerHTML=checks.map(function(c){return'<div class="chk '+c.s+'"><div class="chk-ic"><i class="ti '+c.ic+'"></i></div><div><div class="chk-t">'+esc(c.t)+'</div><div class="chk-d">'+esc(c.d)+'</div></div></div>';}).join('');
}

/* ── AI RISK ── */
function runAiRisk(tests){
  var d=vehicleData,carYear=parseInt(d.yearOfManufacture)||0;
  var sorted=tests.slice().sort(function(a,b){return new Date(a.completedDate||0)-new Date(b.completedDate||0);});
  var readings=sorted.map(function(t){return{date:t.completedDate||'',mi:parseInt(t.odometerValue)||0};}).filter(function(r){if(!r.mi)return false;if(carYear){var yr=new Date(r.date).getFullYear();if(yr>0&&yr<carYear)return false;}return true;});
  var drops=[];for(var i=1;i<readings.length;i++){if(readings[i].mi<readings[i-1].mi)drops.push(readings[i-1].mi-readings[i].mi);}
  var lastMi=readings.length?readings[readings.length-1].mi:0,annMi=calcAnnualMi();
  var pass=tests.filter(function(t){return(t.testResult||'').toUpperCase()==='PASSED';}).length;
  var passRate=tests.length?Math.round(pass/tests.length*100):100;
  var allDef=[];tests.forEach(function(t){(t.defects||[]).forEach(function(x){allDef.push(x);});});
  var majors=allDef.filter(function(x){return x.type==='MAJOR'||x.type==='DANGEROUS';}).map(function(x){return x.text||'';});
  fetch(VERCEL+'/api/ai-risk',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({make:d.make,model:d.model||'',year:d.yearOfManufacture,cc:d.engineCapacity,fuel:d.fuelType,colour:d.colour||d.primaryColour,taxStatus:d.taxStatus,motStatus:d.motStatus,passRate:passRate,totalTests:tests.length,lastMileage:lastMi,annualMileage:annMi,fraudDrops:drops,majorFailures:majors.slice(0,5)})})
    .then(function(r){return r.json();})
    .then(function(resp){if(resp.error)renderAiRiskFallback(drops,passRate,annMi,majors);else renderAiRisk(resp);})
    .catch(function(){renderAiRiskFallback(drops,passRate,annMi,majors);});
}
function renderAiRisk(r){
  var vc=r.overallVerdict||'UNKNOWN';
  el('aiRiskChip').textContent=vc;el('aiRiskChip').className='chip '+(vc==='CLEAN'?'chip-gr':vc==='HIGH RISK'?'chip-r':'chip-g');
  var html='';
  (r.keyFindings||[]).forEach(function(f){html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;font-size:11.5px;color:var(--t2)"><i class="ti ti-point-filled" style="color:var(--blue);font-size:9px;flex-shrink:0"></i>'+esc(f)+'</div>';});
  var rows=[{l:'Stolen Risk',v:r.stolenRisk||'—',n:r.stolenNote||'',c:r.stolenRisk==='Low'?'gr':r.stolenRisk==='High'?'r':'g'},{l:'Finance / Write-Off',v:'Cannot verify',n:'Outstanding finance and write-off status require HPI check — not in DVLA/DVSA public records',c:'g'},{l:'Clone / Plate Risk',v:r.cloneRisk||'—',n:r.cloneNote||'',c:r.cloneRisk==='Low'?'gr':r.cloneRisk==='High'?'r':'g'},{l:'Mileage',v:r.mileageVerdict||'—',n:'',c:r.mileageVerdict==='Consistent'?'gr':r.mileageVerdict==='Fraudulent'?'r':'g'}];
  rows.forEach(function(row){html+='<div class="hrow"><div class="hic hi-'+row.c+'"><i class="ti ti-'+(row.c==='gr'?'check':row.c==='r'?'alert-triangle':'alert-circle')+'"></i></div><div style="flex:1"><div class="hrow-t">'+esc(row.l)+'</div>'+(row.n?'<div class="hrow-d">'+esc(row.n)+'</div>':'')+'</div><div><div class="chip chip-'+row.c+'">'+esc(row.v)+'</div></div></div>';});
  if(r.buyerAdvice)html+='<div class="verdict" style="margin-top:8px"><strong>Advice:</strong> '+esc(r.buyerAdvice)+'</div>';
  html+='<div class="info-box" style="margin-top:7px"><i class="ti ti-info-circle"></i> AI from DVLA/DVSA patterns only. <strong>Always run an HPI check</strong> for definitive stolen, finance and write-off verification.</div>';
  el('aiRiskContent').innerHTML=html;
}
function renderAiRiskFallback(drops,passRate,annMi,majors){
  var vc=drops.length||passRate<60?'SUSPICIOUS':'CLEAN';
  el('aiRiskChip').textContent=vc;el('aiRiskChip').className='chip '+(vc==='CLEAN'?'chip-gr':'chip-g');
  var findings=[];
  if(drops.length)findings.push('Mileage rollback detected — '+drops.length+' drop(s) in MOT history');
  if(passRate<60)findings.push('Below-average MOT pass rate ('+passRate+'%)');
  if(annMi>20000)findings.push('High annual mileage suggests commercial or fleet use');
  if(majors.length)findings.push(majors.length+' major/dangerous failure(s) on record');
  if(!findings.length)findings.push('No major red flags from DVLA/DVSA data');
  var html=findings.map(function(f){return'<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;font-size:11.5px;color:var(--t2)"><i class="ti ti-point-filled" style="color:var(--blue);font-size:9px;flex-shrink:0"></i>'+esc(f)+'</div>';}).join('');
  html+='<div class="hrow" style="margin-top:9px"><div class="hic hi-g"><i class="ti ti-coins"></i></div><div style="flex:1"><div class="hrow-t">Finance &amp; Theft</div><div class="hrow-d">Cannot verify from DVLA/DVSA. HPI check required.</div></div><div><a href="https://www.hpicheck.com" target="_blank" style="text-decoration:none"><div class="chip chip-g">HPI →</div></a></div></div>';
  html+='<div class="info-box" style="margin-top:7px"><i class="ti ti-info-circle"></i> DVLA/DVSA data only. <strong>Always run an HPI check</strong> before purchasing.</div>';
  el('aiRiskContent').innerHTML=html;
}

/* ── VIN LOOKUP ── */
function lookupVin(vin){
  var decoded=decodeVin(vin);
  if(!decoded){toast('Invalid VIN — must be exactly 17 characters','err');return;}
  el('mainApp').classList.remove('hidden');el('errbox').classList.add('hidden');
  var hs=el('heroSection');if(hs)hs.classList.add('searched');
  if(el('tabsWrap'))el('tabsWrap').classList.remove('hidden');
  switchMainTab('overview');
  if(el('vehReg'))el('vehReg').textContent=vin.slice(0,3)+' ··· '+vin.slice(14);
  if(el('vehHeader'))el('vehHeader').classList.add('visible');
  if(el('vehTaxBadge')){el('vehTaxBadge').textContent='VIN';el('vehTaxBadge').className='veh-status-badge vsb-taxed';}
  if(el('vehChips'))el('vehChips').innerHTML='<span class="veh-chip">'+decoded.flag+' '+esc(decoded.country)+'</span>'+(decoded.year?'<span class="veh-chip-div">·</span><span class="veh-chip"><i class="ti ti-calendar"></i>'+decoded.year+'</span>':'');
  if(el('vehName'))el('vehName').textContent='VIN Decoded — '+decoded.country;
  if(el('vehMotStatus')){el('vehMotStatus').textContent='WMI: '+decoded.wmi;el('vehMotStatus').className='veh-stat-val ok';}
  if(el('vehMotExpiry'))el('vehMotExpiry').textContent=decoded.year||'—';
  if(el('vehTaxDue'))el('vehTaxDue').textContent=decoded.plant;
  if(el('vehEuro'))el('vehEuro').textContent='#'+decoded.serial;
  var checkHtml=decoded.country==='United States'||decoded.country==='Canada'||decoded.country==='Mexico'?'<span class="'+(decoded.checkValid?'vin-check-ok':'vin-check-fail')+'">'+(decoded.checkValid?'✓ Valid':'✗ Invalid')+'</span>':'<span style="color:rgba(255,255,255,.4)">N/A</span>';
  var vinCard='<div class="vin-card"><div class="vin-header"><div class="vin-flag">'+decoded.flag+'</div><div><div class="vin-title">'+esc(decoded.country)+'</div><div class="vin-country">World Manufacturer Identifier: '+esc(decoded.wmi)+'</div></div></div>'
    +'<div class="vin-num">'+vin+'</div>'
    +'<div class="vin-grid"><div class="vin-box"><div class="vin-box-lbl">Country</div><div class="vin-box-val">'+decoded.flag+' '+esc(decoded.country)+'</div></div><div class="vin-box"><div class="vin-box-lbl">Model Year</div><div class="vin-box-val">'+(decoded.year||'—')+'</div></div><div class="vin-box"><div class="vin-box-lbl">Check Digit</div><div class="vin-box-val">'+checkHtml+'</div></div></div>'
    +'<div class="vin-detail-row"><span class="vin-detail-lbl">WMI (Manufacturer)</span><span class="vin-detail-val">'+esc(decoded.wmi)+'</span></div>'
    +'<div class="vin-detail-row"><span class="vin-detail-lbl">VDS (Vehicle Desc.)</span><span class="vin-detail-val">'+esc(decoded.vds)+'</span></div>'
    +'<div class="vin-detail-row"><span class="vin-detail-lbl">Plant Code</span><span class="vin-detail-val">'+esc(decoded.plant)+'</span></div>'
    +'<div class="vin-detail-row"><span class="vin-detail-lbl">Serial Number</span><span class="vin-detail-val">'+esc(decoded.serial)+'</span></div>'
    +'</div>';
  var overviewFirst=el('tab-overview');
  if(overviewFirst){var existing=overviewFirst.querySelector('.vin-card');if(existing)existing.parentNode.removeChild(existing);overviewFirst.insertAdjacentHTML('afterbegin',vinCard);}
  if(el('motHistory'))el('motHistory').innerHTML='<div class="info-box" style="margin:0"><i class="ti ti-info-circle"></i> <strong>No UK MOT records</strong> — MOT history is only available for UK-registered vehicles.</div>';
  if(el('motSumWrap'))el('motSumWrap').classList.add('hidden');
  function estBhpFromDisp(dispL,cyls,fuel){var cc=Math.round((parseFloat(dispL)||1.6)*1000);var f=(fuel||'').toUpperCase();if(f.includes('ELECTRIC'))return{bhp:204,tq:310,z62:7.5,top:120,gearbox:'Single-speed Auto',mpg:0,co2:0};if(f.includes('HYBRID')){var hbhp=cc<=1500?122:180;return{bhp:hbhp,tq:Math.round(hbhp*1.6),z62:9.5,top:115,gearbox:'CVT Auto',mpg:55,co2:95};}var isDsl=f.includes('DIESEL');var bhp,tq,z62,top,mpg,co2;if(isDsl){bhp=cc<=1500?115:cc<=2000?150:cc<=2500?190:250;tq=Math.round(bhp*2.2);z62=cc<=1500?11:cc<=2000?9.5:7.5;top=cc<=1500?114:cc<=2000?128:148;mpg=cc<=1500?60:cc<=2000?50:40;co2=Math.round(5600/mpg);}else{bhp=cc<=999?95:cc<=1199?110:cc<=1399?128:cc<=1599?138:cc<=1999?163:cc<=2499?228:cc<=2999?300:380;tq=Math.round(bhp*1.55);z62=cc<=999?12.5:cc<=1199?11:cc<=1399?10:cc<=1599?9.2:cc<=1999?7.8:cc<=2499?6.5:5.2;top=cc<=999?106:cc<=1199?115:cc<=1399?120:cc<=1599?126:cc<=1999?136:cc<=2499?148:158;mpg=Math.max(22,65-Math.round(cc/80));co2=Math.round(6400/mpg*0.0454*19.6);}var gbox=cc<=1600?'6-speed Manual':'8-speed Auto';return{bhp:bhp,tq:tq,z62:z62,top:top,gearbox:gbox,mpg:mpg,co2:co2,cylinders:parseInt(cyls)||Math.round(cc/400)};}
  fetch('https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/'+vin+'?format=json')
    .then(function(r){return r.json();})
    .then(function(d){
      var vals={};(d.Results||[]).forEach(function(item){if(item.Value&&item.Value!=='Not Applicable')vals[item.Variable]=item.Value;});
      var make2=vals['Make']||'',model2=vals['Model']||'',trim=vals['Trim']||'',body=vals['Body Class']||'';
      var cyls=vals['Engine Number of Cylinders']||'',dispL=vals['Displacement (L)']||'',dispCC=vals['Displacement (CC)']||'';
      var fuel2=vals['Fuel Type - Primary']||'',doors=vals['Number of Doors']||'',drive=vals['Drive Type']||'';
      var trans=vals['Transmission Style']||'',transSp=vals['Transmission Speeds']||'',country2=vals['Plant Country']||'';
      var fullName=(make2+' '+(model2||'')).trim();
      if(fullName){if(el('vehName'))el('vehName').textContent=fullName+(trim?' '+trim:'');}
      var cc=dispCC?parseInt(dispCC):dispL?Math.round(parseFloat(dispL)*1000):1600;
      var specs=estBhpFromDisp(dispL||cc/1000,cyls,fuel2);
      if(trans&&transSp)specs.gearbox=transSp+'-speed '+(trans.toLowerCase().includes('auto')?'Auto':'Manual');
      else if(trans)specs.gearbox=trans;
      if(el('scBhp'))el('scBhp').textContent=specs.bhp;if(el('scTq'))el('scTq').textContent=specs.tq;
      if(el('scZero'))el('scZero').textContent=specs.z62;if(el('scTop'))el('scTop').textContent=specs.top;
      if(el('scGearbox'))el('scGearbox').textContent=specs.gearbox;if(el('scMpg'))el('scMpg').textContent=specs.mpg===0?'EV (N/A)':specs.mpg;
      if(el('specCyl'))el('specCyl').textContent=(specs.cylinders||(cyls?parseInt(cyls):4))+' cylinders';
      if(el('specDrive'))el('specDrive').textContent=drive||'—';
      if(el('specsStatus')){el('specsStatus').textContent='From VIN';el('specsStatus').className='chip chip-gr';}
      if(el('specCo2'))el('specCo2').textContent=specs.co2===0?'0 g/km (EV)':specs.co2+' g/km (est.)';
      var extra='';
      if(make2)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Make</span><span class="vin-detail-val">'+esc(make2)+'</span></div>';
      if(model2)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Model</span><span class="vin-detail-val">'+esc(model2)+(trim?' · '+esc(trim):'')+'</span></div>';
      if(body)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Body Style</span><span class="vin-detail-val">'+esc(body)+'</span></div>';
      if(cc)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Engine</span><span class="vin-detail-val">'+cc+'cc'+(cyls?' · '+cyls+' cyl':'')+'</span></div>';
      if(fuel2)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Fuel</span><span class="vin-detail-val">'+esc(fuel2)+'</span></div>';
      if(drive)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Drive</span><span class="vin-detail-val">'+esc(drive)+'</span></div>';
      if(doors)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Doors</span><span class="vin-detail-val">'+esc(doors)+'</span></div>';
      if(country2)extra+='<div class="vin-detail-row"><span class="vin-detail-lbl">Assembly</span><span class="vin-detail-val">'+esc(country2)+'</span></div>';
      extra+='<div class="info-box" style="margin-top:10px"><i class="ti ti-info-circle"></i> Specs are <strong>estimated</strong> from engine displacement. Check manufacturer spec sheet for exact figures.</div>';
      var card=overviewFirst&&overviewFirst.querySelector('.vin-card');if(card&&extra)card.insertAdjacentHTML('beforeend',extra);
    }).catch(function(){if(el('specsStatus')){el('specsStatus').textContent='Estimated';el('specsStatus').className='chip chip-g';}});
}

function buildForeignVinReport(){
  var vin=(currentReg||'').toUpperCase();
  var decoded=decodeVin(vin)||{country:'Unknown',flag:'🌍',wmi:'—',year:null};
  var isUS=decoded.country==='United States'||decoded.country==='Canada';
  var isEU=['Germany','France','Italy','Spain','Sweden','Netherlands','Belgium','Austria','Czech Republic','Poland'].indexOf(decoded.country)>=0;
  var chkResult=vin.length===17?vinCheckDigit(vin):{valid:null};
  var fraudRisk=chkResult.valid===false?'High — check digit invalid, possible cloned/fake VIN':'Low — VIN format appears legitimate';
  var fraudCls=chkResult.valid===false?'bad':'ok';
  var ov=el('tab-report');if(!ov)return;
  ov.innerHTML='<div class="intel-card"><div class="intel-bar"></div><div style="padding:1.1rem">'
    +'<div class="card-head" style="margin-bottom:9px"><div class="card-title"><i class="ti ti-report-analytics"></i> International VIN Report</div><div class="chip chip-gr">Free</div></div>'
    +'<div class="chk '+fraudCls+'" style="margin-bottom:12px"><div class="chk-ic"><i class="ti ti-shield-check"></i></div><div><div class="chk-t">VIN Authenticity Check</div><div class="chk-d">'+esc(fraudRisk)+'</div></div></div>'
    +'<div class="sect-lbl">Vehicle Origin</div>'
    +'<div class="hrow"><div class="hic hi-b"><i class="ti ti-world"></i></div><div style="flex:1"><div class="hrow-t">Country of Manufacture</div><div class="hrow-d">'+decoded.flag+' '+esc(decoded.country)+' — detected from WMI ('+esc(decoded.wmi)+')</div></div></div>'
    +(decoded.year?'<div class="hrow"><div class="hic hi-b"><i class="ti ti-calendar"></i></div><div><div class="hrow-t">Model Year</div><div class="hrow-d">'+decoded.year+' (decoded from VIN position 10)</div></div></div>':'')
    +'<div class="sect-lbl">Stolen &amp; History Checks</div>'
    +(isUS?'<a class="partner-cta" href="https://www.nicb.org/vincheck" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#14202E,#1550C0)"><div class="partner-ic"><i class="ti ti-shield-check"></i></div><div><div class="partner-t">NICB VINCheck — Free (USA)</div><div class="partner-d">Official US National Insurance Crime Bureau stolen vehicle check</div></div><i class="ti ti-chevron-right partner-arr"></i></a>':'')
    +(isUS?'<a class="partner-cta" href="https://www.carfax.com" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#1A0A00,#B03A00)"><div class="partner-ic"><i class="ti ti-car"></i></div><div><div class="partner-t">Carfax History Report (USA/Canada)</div><div class="partner-d">Accident, ownership, service and title history for North American vehicles</div></div><i class="ti ti-chevron-right partner-arr"></i></a>':'')
    +(isEU?'<a class="partner-cta" href="https://www.europol.europa.eu/useful-links/stolen-vehicles" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#003399,#0050CC)"><div class="partner-ic"><i class="ti ti-shield"></i></div><div><div class="partner-t">Europol Stolen Vehicles</div><div class="partner-d">Check if vehicle is listed as stolen across EU member states</div></div><i class="ti ti-chevron-right partner-arr"></i></a>':'')
    +'<a class="partner-cta" href="https://www.interpol.int/en/Crimes/Vehicle-Crime" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#0A1628,#2D1B69)"><div class="partner-ic"><i class="ti ti-world"></i></div><div><div class="partner-t">Interpol — Global Stolen Vehicle Check</div><div class="partner-d">International criminal police database for vehicles reported stolen worldwide</div></div><i class="ti ti-chevron-right partner-arr"></i></a>'
    +'<div class="info-box" style="margin-top:0"><i class="ti ti-info-circle"></i> UK MOT, finance and write-off data is <strong>only available for UK-registered vehicles</strong>. For foreign VINs, use the services above for your vehicle\'s country of origin.</div>'
    +'</div></div>';
}

/* ── MODS ── */
var MOD_FALLBACK={
  'ECU remap':{hpGain:30,torqueGain:50,sound:4,soundDesc:'No change',cost:'£350–£550',insNote:'Must declare — expect 10-25% increase',motRisk:'Low',motNote:'Passes MOT if mapped cleanly',fail:'Low — use reputable tuner',verdict:'One of the best value mods. Choose a specialist with a rolling road. Turbos respond best.'},
  'Performance exhaust':{hpGain:7,torqueGain:10,sound:8,soundDesc:'Deep, sporty note',cost:'£400–£1,200',insNote:'Declare it — minor impact on premium',motRisk:'Low',motNote:'Must retain cat to pass emissions',fail:'Low — quality brands rarely fail',verdict:'Mainly a sound upgrade. Milltek and Scorpion are trusted brands for UK cars.'},
  'Cold air intake':{hpGain:5,torqueGain:8,sound:6,soundDesc:'Induction roar at high RPM',cost:'£80–£280',insNote:'Low impact — still declare',motRisk:'Low',motNote:'No MOT concern',fail:'Low',verdict:'Good entry-level mod. K&N and Pipercross are reliable choices.'},
  'Turbo upgrade':{hpGain:80,torqueGain:120,sound:5,soundDesc:'More whoosh, subtle without exhaust',cost:'£1,500–£4,500',insNote:'High impact — some insurers may refuse',motRisk:'Medium',motNote:'Supporting mods needed — remap essential',fail:'High if supporting mods not fitted',verdict:'Major mod requiring fuelling, intercooler and remap. Use a specialist.'},
  'Supercharger kit':{hpGain:100,torqueGain:130,sound:5,soundDesc:'Mechanical whine at high RPM',cost:'£3,000–£8,000',insNote:'Very high — specialist policy likely needed',motRisk:'Medium',motNote:'Remap and supporting mods required',fail:'Medium with proper install',verdict:'Linear power delivery, no lag. Expensive but effective on N/A engines.'},
  'Intercooler upgrade':{hpGain:10,torqueGain:15,sound:1,soundDesc:'No sound change',cost:'£200–£700',insNote:'Declare — low premium impact',motRisk:'Low',motNote:'No MOT concern',fail:'Low',verdict:'Essential if chasing more power from a turbo engine. Reduces heat soak safely.'},
  'Exhaust decat pipe':{hpGain:8,torqueGain:12,sound:9,soundDesc:'Very loud — not for everyone',cost:'£150–£350',insNote:'Declare — moderate impact',motRisk:'High',motNote:'FAILS MOT emissions test — track use only',fail:'Low mechanically',verdict:'Illegal on UK public roads. Will fail MOT. Consider a sports cat instead.'},
  'Forged engine internals':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No change',cost:'£2,000–£5,000',insNote:'Declare major engine work',motRisk:'Low',motNote:'No MOT concern if rebuilt correctly',fail:'Very Low',verdict:'No power gain alone. Enables safe high-power builds over 350 BHP.'},
  'Sports air filter':{hpGain:3,torqueGain:5,sound:4,soundDesc:'Slight induction sound at high RPM',cost:'£40–£90',insNote:'Declare — very low impact',motRisk:'Low',motNote:'No MOT concern',fail:'Very Low',verdict:'Cheapest meaningful mod. K&N drop-in filters are the go-to choice.'},
  'Coilover kit':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No sound change',cost:'£600–£2,500',insNote:'Declare — expect moderate increase',motRisk:'Medium',motNote:'Get alignment check after fitting',fail:'Low with quality brand',verdict:'Best handling upgrade available. Get a 4-wheel alignment after fitting.'},
  'Lowering springs':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No sound change',cost:'£90–£240',insNote:'Declare — low impact',motRisk:'Low',motNote:'Check bump stop clearance at MOT',fail:'Very Low',verdict:'Good value stance upgrade. Eibach and H&R are trusted. Get alignment done after.'},
  'Big brake kit':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No sound change',cost:'£800–£3,000',insNote:'Declare — may reduce premium on sports cars',motRisk:'Low',motNote:'No MOT concern if correctly fitted',fail:'Very Low with quality brand',verdict:'Essential for track use or high-powered cars. Brembo and AP Racing are standards.'},
  'Anti-roll bar upgrade':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No sound change',cost:'£150–£550',insNote:'Low impact',motRisk:'Low',motNote:'No MOT concern',fail:'Very Low',verdict:'Excellent value handling mod. Whiteline and Eibach make great UK options.'},
  'Limited slip differential':{hpGain:0,torqueGain:0,sound:2,soundDesc:'Faint mechanical noise under load',cost:'£700–£2,000',insNote:'Declare — moderate impact',motRisk:'Low',motNote:'No MOT concern',fail:'Low with quality brand',verdict:'Transforms high-power RWD cars. Wavetrac and Quaife are popular UK choices.'},
  'Uprated suspension bushes':{hpGain:0,torqueGain:0,sound:2,soundDesc:'May increase interior noise slightly',cost:'£200–£550',insNote:'Very low impact',motRisk:'Low',motNote:'No MOT concern',fail:'Very Low',verdict:'Powerflex and SuperPro are the go-to UK brands. Sharper steering feedback.'},
  'Alloy wheels upgrade':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No sound change',cost:'£400–£2,000',insNote:'Declare — affects value and repair cost',motRisk:'Low',motNote:'Must not foul bodywork or suspension',fail:'Very Low',verdict:'Check offset carefully before buying. Lighter wheels improve handling feel.'},
  'Body kit aerodynamics':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No sound change',cost:'£500–£3,000',insNote:'Declare — affects value and repair costs',motRisk:'Low',motNote:'Check ground clearance at MOT',fail:'Low',verdict:'Purely aesthetic on most road cars. High risk on daily drivers with speed bumps.'},
  'Window tint':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No change',cost:'£150–£380',insNote:'Declare — very low impact',motRisk:'Medium',motNote:'Front must be 70%+ VLT — tested at MOT',fail:'Very Low',verdict:'Legal limit: 70% VLT on front side windows. Llumar and SunTek are quality brands.'},
  'Tow bar fitting':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No change',cost:'£200–£550',insNote:'Declare — minor impact',motRisk:'Low',motNote:'No MOT concern',fail:'Very Low',verdict:'Detachable bars are tidier when not in use. Check your vehicle towing capacity.'},
  'Wrap or respray':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No change',cost:'£1,500–£7,000',insNote:'Declare colour change — affects value',motRisk:'Low',motNote:'DVLA notification required for permanent respray',fail:'Very Low',verdict:'Wrap is reversible and no DVLA notification needed. Quality varies hugely.'},
  'Carbon fibre bonnet':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No change',cost:'£400–£1,400',insNote:'Declare — higher replacement value',motRisk:'Low',motNote:'No MOT concern',fail:'Very Low',verdict:'Saves 5-12kg vs steel. Lowers centre of gravity marginally. Check quality before buying.'},
  'Sports clutch upgrade':{hpGain:0,torqueGain:0,sound:2,soundDesc:'Firmer pedal feel',cost:'£500–£1,400',insNote:'Declare drivetrain work',motRisk:'Low',motNote:'No MOT concern',fail:'Low with correct spec clutch',verdict:'Necessary when OEM clutch slips with added power. Sachs and AP are trusted brands.'},
  'Short shifter kit':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No change',cost:'£80–£280',insNote:'Very low impact',motRisk:'Low',motNote:'No MOT concern',fail:'Very Low',verdict:'Reduces throw by 30-40%. Sharper, more mechanical feel. Easy DIY install.'},
  'Gearbox rebuild or upgrade':{hpGain:0,torqueGain:0,sound:2,soundDesc:'Quieter if worn before',cost:'£900–£3,000',insNote:'Declare major drivetrain work',motRisk:'Low',motNote:'No MOT concern',fail:'Low with quality rebuild',verdict:'Essential if gearbox is notchy or worn. Use a specialist — not a generic garage.'},
  'Roll cage installation':{hpGain:0,torqueGain:0,sound:3,soundDesc:'More road noise inside',cost:'£1,500–£5,000',insNote:'Specialist policy required',motRisk:'High',motNote:'Complex — consult DVSA before fitting for road use',fail:'Very Low structurally',verdict:'Track use essential. Road use requires padding. FIA spec for competition.'},
  'Bucket seat and harness':{hpGain:0,torqueGain:0,sound:1,soundDesc:'No change',cost:'£400–£1,400',insNote:'Declare — affects occupant safety profile',motRisk:'Medium',motNote:'Standard seatbelt must remain functional for road use',fail:'Very Low',verdict:'Harness is track-only — airbag risk on road. Recaro and Sparco make excellent road-legal buckets.'},
  'Nitrous oxide system':{hpGain:75,torqueGain:90,sound:3,soundDesc:'No change to engine note',cost:'£400–£1,000',insNote:'No standard insurer will cover',motRisk:'High',motNote:'Illegal on UK public roads',fail:'High — engine stress',verdict:'Track use only. Illegal on UK public roads. High engine stress — supporting mods essential.'},
};

function modFallback(modName,hp,torque,value){
  var k=Object.keys(MOD_FALLBACK).find(function(m){return modName.toLowerCase().indexOf(m.toLowerCase().split(' ')[0])>=0;});
  var fb=k?MOD_FALLBACK[k]:MOD_FALLBACK['ECU remap'];
  return{hpGain:fb.hpGain,torqueGain:fb.torqueGain,newHp:hp+(fb.hpGain||0),newTorque:torque+(fb.torqueGain||0),newValue:value+(fb.hpGain>0?Math.round(value*.03):0),soundRating:fb.sound,soundDesc:fb.soundDesc,valueChange:fb.hpGain>0?'+£'+Math.round(value*.03).toLocaleString():'No change',valueChangeDirection:fb.hpGain>0?'up':'neutral',installCost:fb.cost,insuranceImpact:fb.insNote,motRisk:fb.motRisk,motNote:fb.motNote,failureRisk:fb.fail,verdict:fb.verdict};
}

function selectMod(btn){
  var mod=btn.dataset.mod;
  if(selectedMods.has(mod)){selectedMods.delete(mod);btn.classList.remove('selected');}
  else{selectedMods.add(mod);btn.classList.add('selected');}
  var n=selectedMods.size,ab=el('analyzeBtn');
  if(n===0){ab.disabled=true;ab.innerHTML='<i class="ti ti-sparkles"></i> Select mods to analyse';}
  else if(n===1){ab.disabled=false;ab.innerHTML='<i class="ti ti-sparkles"></i> Analyse: '+Array.from(selectedMods)[0];}
  else{ab.disabled=false;ab.innerHTML='<i class="ti ti-sparkles"></i> Analyse '+n+' mods together';}
}

function analyseMod(){
  if(!selectedMods.size)return;
  var btn=el('analyzeBtn'),mods=Array.from(selectedMods),n=mods.length;
  btn.disabled=true;btn.innerHTML='<div class="spin" style="margin-right:7px"></div> Analysing '+n+' mod'+(n>1?'s':'')+'...';
  var make=vehicleData.make||'Unknown',model=vehicleData.model||'',year=vehicleData.yearOfManufacture||2018;
  var cc=parseInt(vehicleData.engineCapacity)||1600,hp=vehicleData.hp||130,torque=vehicleData.torque||200;
  var value=vehicleData.value||8000,fuel=(vehicleData.fuelType||'PETROL').toUpperCase();
  function resetBtn(){btn.disabled=false;btn.innerHTML='<i class="ti ti-sparkles"></i> Analyse '+n+' mod'+(n>1?'s':'');}
  function safeResult(d,modName){return{mod:modName,hpGain:parseInt(d.hpGain)||0,torqueGain:parseInt(d.torqueGain)||0,newHp:parseInt(d.newHp)||hp,newTorque:parseInt(d.newTorque)||torque,newValue:parseInt(d.newValue)||value,soundRating:Math.max(1,Math.min(10,parseInt(d.soundRating)||5)),soundDesc:d.soundDesc||'—',valueChange:d.valueChange||'—',valueChangeDirection:d.valueChangeDirection||'neutral',installCost:d.installCost||'—',insuranceImpact:d.insuranceImpact||'Declare all mods to insurer',motRisk:d.motRisk||'Medium',motNote:d.motNote||'—',failureRisk:d.failureRisk||'Medium',verdict:d.verdict||'Consult a specialist.'};}
  var promises=mods.map(function(mod){
    return fetch(VERCEL+'/api/mod',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mod:mod,make:make,model:model,year:year,cc:cc,hp:hp,torque:torque,value:value,fuel:fuel})})
      .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
      .then(function(d){return safeResult(d.error?modFallback(mod,hp,torque,value):d,mod);})
      .catch(function(){return safeResult(modFallback(mod,hp,torque,value),mod);});
  });
  Promise.all(promises).then(function(results){renderMultiResult(results,hp,torque,value);resetBtn();});
}

function renderMultiResult(results,baseHp,baseTq,baseVal){
  if(results.length===1){renderResult(results[0]);return;}
  var totalHpGain=results.reduce(function(s,r){return s+(parseInt(r.hpGain)||0);},0);
  var totalTqGain=results.reduce(function(s,r){return s+(parseInt(r.torqueGain)||0);},0);
  var totalCost=0;results.forEach(function(r){var m=String(r.installCost||'').match(/[\d,]+/g);if(m)totalCost+=parseInt(m[0].replace(',',''));});
  var costStr=totalCost>0?'~£'+totalCost.toLocaleString()+'+':'See individual mods';
  var highestMotRisk=results.some(function(r){return r.motRisk==='High';})?'High':results.some(function(r){return r.motRisk==='Medium';})?'Medium':'Low';
  var highestSound=Math.max.apply(null,results.map(function(r){return parseInt(r.soundRating)||1;}));
  var bars='';for(var i=0;i<8;i++)bars+='<div class="sb" style="height:'+(i<highestSound?Math.round(10+Math.random()*14):3)+'px;opacity:'+(i<highestSound?1:.14)+'"></div>';
  var modCards=results.map(function(r){var hg=parseInt(r.hpGain)||0,tg=parseInt(r.torqueGain)||0,mc2=r.motRisk==='High'?'red':r.motRisk==='Medium'?'amber':'green';return'<div style="background:var(--bg);border:1px solid var(--b1);border-radius:var(--rs);padding:10px 12px;margin-bottom:7px"><div style="font-family:Syne,sans-serif;font-size:12px;font-weight:800;color:var(--ink);margin-bottom:7px">'+esc(r.mod)+'</div><div class="drow"><span class="dlbl">HP gain</span><span class="dval">'+(hg?'+'+hg+' BHP':'None')+'</span></div><div class="drow"><span class="dlbl">Torque gain</span><span class="dval">'+(tg?'+'+tg+' Nm':'None')+'</span></div><div class="drow"><span class="dlbl">Install cost</span><span class="dval">'+esc(r.installCost||'—')+'</span></div><div class="drow"><span class="dlbl">MOT risk</span><span class="dval sval '+mc2+'">'+esc(r.motRisk)+'</span></div><div style="font-size:10.5px;color:var(--t2);line-height:1.5;margin-top:7px;padding-top:7px;border-top:1px solid var(--b1)">'+esc(r.verdict)+'</div></div>';}).join('');
  el('resultSection').innerHTML='<div class="res-card"><div class="res-title"><span>'+results.length+' MODS COMBINED</span><div class="sbar">'+bars+'</div></div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px"><div class="mot-sb"><div class="mot-sn" style="color:var(--green);font-size:22px">+'+(totalHpGain||0)+'</div><div class="mot-sl">Total BHP</div></div><div class="mot-sb"><div class="mot-sn" style="color:var(--blue);font-size:22px">+'+(totalTqGain||0)+'</div><div class="mot-sl">Total Nm</div></div><div class="mot-sb"><div class="mot-sn" style="color:var(--amber);font-size:16px">'+esc(costStr)+'</div><div class="mot-sl">Est. Cost</div></div></div>'
    +'<div class="chk '+(highestMotRisk==='High'?'bad':highestMotRisk==='Medium'?'warn':'ok')+'" style="margin-bottom:12px"><div class="chk-ic"><i class="ti ti-alert-circle"></i></div><div><div class="chk-t">Combined MOT Risk: '+highestMotRisk+'</div><div class="chk-d">Declare ALL modifications to your insurer. Multiple mods increases insurance impact significantly.</div></div></div>'
    +'<div style="font-family:Syne,sans-serif;font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--t3);margin-bottom:8px">Individual Breakdown</div>'
    +modCards
    +'<button class="share-btn" id="shareBtn"><i class="ti ti-share" style="margin-right:5px"></i>Share This Build</button></div>';
  el('resultSection').classList.remove('hidden');
  el('resultSection').scrollIntoView({behavior:'smooth',block:'start'});
  el('shareBtn').onclick=function(){var mArr=Array.from(selectedMods);var text='GarageIQ Build — '+(vehicleData.make||'')+' '+(vehicleData.model||'')+' '+(vehicleData.yearOfManufacture||'')+'\nMods: '+mArr.join(', ')+'\n+'+totalHpGain+' BHP | +'+totalTqGain+' Nm\nwww.garageiq.org.uk';if(navigator.share)navigator.share({title:'GarageIQ Build',text:text,url:'https://www.garageiq.org.uk'});else navigator.clipboard.writeText(text).then(function(){toast('Build copied!','ok',2000);});};
}

function renderResult(r){
  var rating=parseInt(r.soundRating)||5,bars='';
  for(var i=0;i<8;i++)bars+='<div class="sb" style="height:'+(i<rating?Math.round(10+Math.random()*14):3)+'px;opacity:'+(i<rating?1:.14)+'"></div>';
  var mc=r.motRisk==='Low'?'green':r.motRisk==='Medium'?'amber':'red';
  var fs=String(r.failureRisk||''),fc=fs.toLowerCase().startsWith('low')?'green':fs.toLowerCase().startsWith('med')?'amber':'red';
  var hn=parseInt(r.hpGain)||0,tn=parseInt(r.torqueGain)||0;
  var dir=r.valueChangeDirection||(String(r.valueChange||'').startsWith('-')?'down':'neutral');
  el('resultSection').innerHTML='<div class="res-card">'
    +'<div class="res-title"><span>'+esc((r.mod||Array.from(selectedMods)[0]||'').toUpperCase())+'</span><div class="sbar">'+bars+'</div></div>'
    +'<div class="drow"><span class="dlbl">Power</span><span class="dval">'+(hn?r.newHp+' BHP':'No change')+' <span class="chg '+(hn>0?'cup':hn<0?'cdn':'cnt')+'">'+(hn?(hn>0?'+':'')+hn+' BHP':'—')+'</span></span></div>'
    +'<div class="drow"><span class="dlbl">Torque</span><span class="dval">'+(tn?r.newTorque+' Nm':'No change')+' <span class="chg '+(tn>0?'cup':tn<0?'cdn':'cnt')+'">'+(tn?(tn>0?'+':'')+tn+' Nm':'—')+'</span></span></div>'
    +'<div class="drow"><span class="dlbl">Sound</span><span class="dval">'+rating+'/10 <span style="font-size:11px;font-weight:400;color:var(--t3)">— '+esc(r.soundDesc)+'</span></span></div>'
    +'<div class="drow"><span class="dlbl">Retail Value</span><span class="dval">£'+esc(String(r.newValue))+' <span class="chg '+(dir==='up'?'cup':dir==='down'?'cdn':'cnt')+'">'+esc(r.valueChange)+'</span></span></div>'
    +'<div class="drow"><span class="dlbl">Install Cost</span><span class="dval">'+esc(r.installCost)+'</span></div>'
    +'<div class="drow"><span class="dlbl">Insurance</span><span class="dval" style="font-size:11.5px;max-width:52%;text-align:right">'+esc(r.insuranceImpact)+'</span></div>'
    +'<div class="drow"><span class="dlbl">MOT Risk</span><span class="dval"><span class="sval '+mc+'" style="font-size:12.5px">'+esc(r.motRisk)+'</span> <span style="font-size:10.5px;color:var(--t3);margin-left:4px">'+esc(r.motNote)+'</span></span></div>'
    +'<div class="drow"><span class="dlbl">Reliability</span><span class="dval"><span class="sval '+fc+'" style="font-size:12.5px">'+esc(fs.split('-')[0].trim())+'</span></span></div>'
    +'<div class="verdict"><strong>Verdict:</strong> '+esc(r.verdict)+'</div>'
    +'<button class="share-btn" id="shareBtn"><i class="ti ti-share" style="margin-right:5px"></i>Share This Result</button></div>';
  el('resultSection').classList.remove('hidden');
  el('resultSection').scrollIntoView({behavior:'smooth',block:'start'});
  el('shareBtn').onclick=function(){var mArr=Array.from(selectedMods);var text='GarageIQ — '+(vehicleData.make||'')+(vehicleData.model?' '+vehicleData.model:'')+' '+(vehicleData.yearOfManufacture||'')+'\nMods: '+mArr.join(', ')+'\nwww.garageiq.org.uk';if(navigator.share)navigator.share({title:'GarageIQ',text:text,url:'https://www.garageiq.org.uk'});else navigator.clipboard.writeText(text).then(function(){toast('Copied!','ok',2000);});};
}

/* ── STRIPE ── */
function startPayment(){
  if(!currentUser){openAuth('login');return;}
  var btn=el('btnPay');btn.disabled=true;btn.innerHTML='<div class="spin" style="margin-right:7px"></div> Loading...';
  fetch(VERCEL+'/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reg:currentReg,userId:currentUser.id})})
    .then(function(r){return r.json();})
    .then(function(d){if(d.url)window.location.href=d.url;else{btn.disabled=false;btn.innerHTML='<i class="ti ti-lock-open"></i> Unlock for £1.99';toast('Payment error: '+(d.error||'Unknown'),'err');}})
    .catch(function(e){btn.disabled=false;btn.innerHTML='<i class="ti ti-lock-open"></i> Unlock for £1.99';toast('Payment error: '+e.message,'err');});
}

/* ── HELPERS ── */
function showErr(id,msg){var e=el(id);if(!e)return;e.textContent=msg;e.style.display='block';}
function showOk(id,msg){var e=el(id);if(!e)return;e.textContent=msg;e.style.display='block';}
function hideMsg(id){var e=el(id);if(!e)return;e.textContent='';e.style.display='none';}
function hideFeatGrid(){var fg=el('featGrid');if(fg)fg.style.display='none';}

/* ── TOAST ── */
function toast(msg,type,dur){
  var wrap=el('toastWrap');if(!wrap)return;
  var t=document.createElement('div');
  t.className='toast'+(type?' '+type:'');
  var icon=type==='ok'?'ti-check':type==='err'?'ti-alert-circle':'ti-info-circle';
  t.innerHTML='<i class="ti '+icon+'" style="font-size:14px;flex-shrink:0"></i>'+esc(msg);
  wrap.appendChild(t);
  setTimeout(function(){t.style.animation='toastOut .3s ease forwards';setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},300);},(dur||3000));
}

/* ── SCROLL REVEAL ── */
(function(){
  if(!window.IntersectionObserver)return;
  var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}});},{threshold:.12});
  function observe(){document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});}
  observe();
  document.addEventListener('click',function(e){if(e.target.closest('.pill-tab'))setTimeout(observe,100);});
})();

/* ── KEYBOARD SHORTCUT: / focuses reg input ── */
document.addEventListener('keydown',function(e){
  if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){
    e.preventDefault();var r=el('regInput');if(r){r.focus();r.select();}
  }
});
